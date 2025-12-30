import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Search, Save, CheckSquare, Square, Filter, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { ResultadoReconciliacao, Transacao, TransacaoCorrespondida } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

// Helper to get ID helper
const getId = (item: any) => item.id;

export const AnalysisPage: React.FC = () => {
    const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01');
    const [endDate, setEndDate] = useState(new Date().getFullYear() + '-12-31');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<ResultadoReconciliacao | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Local changes state: mapping ID -> boolean (true = tratado, false = nao tratado)
    // Only stores changes that differ from original
    const [alteracoes, setAlteracoes] = useState<Record<string, boolean>>({});

    // UI States
    const [abaAtiva, setAbaAtiva] = useState<'correspondidos' | 'banco' | 'contabilidade'>('correspondidos');
    const [termoPesquisa, setTermoPesquisa] = useState('');
    const [mostrarTratados, setMostrarTratados] = useState(true);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reconciliation/global?start=${startDate}&end=${endDate}`);
            const data = await res.json();
            setResultado(data);
            setAlteracoes({}); // Reset changes on new analysis
            setCurrentPage(1); // Reset to page 1
        } catch (error) {
            console.error("Error analyzing:", error);
            alert("Erro ao gerar análise.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!resultado) return;

        const updates: { type: 'bank' | 'phc', id: string, val: boolean }[] = [];

        Object.entries(alteracoes).forEach(([id, val]) => {
            // Check Reconciliados
            const isReconciliado = resultado.reconciliados.find(t => t.id === id);
            if (isReconciliado) {
                // Determine if we need to update bank, phc or both.
                // If the user checks the box (val=true), we treat BOTH.
                // If uncheck, untreat BOTH.
                updates.push({ type: 'bank', id: isReconciliado.bankId, val: val as boolean });
                updates.push({ type: 'phc', id: isReconciliado.phcId, val: val as boolean });
                return;
            }

            // Check Apenas Banco
            const isBank = resultado.apenasBanco.find(t => t.id === id);
            if (isBank) {
                updates.push({ type: 'bank', id, val: val as boolean });
                return;
            }

            // Check Apenas PHC
            const isPhc = resultado.apenasContabilidade.find(t => t.id === id);
            if (isPhc) {
                updates.push({ type: 'phc', id, val: val as boolean });
                return;
            }
        });

        const bankTrue = updates.filter(u => u.type === 'bank' && u.val).map(u => u.id);
        const bankFalse = updates.filter(u => u.type === 'bank' && !u.val).map(u => u.id);
        const phcTrue = updates.filter(u => u.type === 'phc' && u.val).map(u => u.id);
        const phcFalse = updates.filter(u => u.type === 'phc' && !u.val).map(u => u.id);

        setLoading(true);
        try {
            const requests = [];
            if (bankTrue.length > 0) requests.push(fetch('/api/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'bank', ids: bankTrue, tratado: true }) }));
            if (bankFalse.length > 0) requests.push(fetch('/api/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'bank', ids: bankFalse, tratado: false }) }));
            if (phcTrue.length > 0) requests.push(fetch('/api/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'phc', ids: phcTrue, tratado: true }) }));
            if (phcFalse.length > 0) requests.push(fetch('/api/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'phc', ids: phcFalse, tratado: false }) }));

            const responses = await Promise.all(requests);

            // Check for errors
            for (const res of responses) {
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
            }

            // Refresh data
            await handleAnalyze();
            alert("Alterações guardadas com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao guardar alterações. Verifique a consola.");
        } finally {
            setLoading(false);
        }
    };

    const toggleTratado = (id: string, currentVal: boolean) => {
        setAlteracoes(prev => {
            const newState = { ...prev };
            // If it's in changes, toggle it back to original (remove key) or new value
            // Simpler: just set the new value. If it matches original, we could remove logic but keeping it simple is fine.
            if (newState[id] === !currentVal) {
                delete newState[id]; // Back to original
            } else {
                newState[id] = !currentVal;
            }
            return newState;
        });
    };

    const getTratadoStatus = (item: any) => {
        if (alteracoes.hasOwnProperty(item.id)) {
            return alteracoes[item.id];
        }
        return !!item.tratado;
    };

    const formatarMoeda = (val: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

    const dadosCompletosFiltrados = useMemo(() => {
        if (!resultado) return [];
        const termo = termoPesquisa.toLowerCase();
        let list: any[] = [];

        if (abaAtiva === 'correspondidos') {
            list = resultado.reconciliados;
        } else if (abaAtiva === 'banco') {
            list = resultado.apenasBanco;
        } else {
            list = resultado.apenasContabilidade;
        }

        return list.filter(item => {
            const searchMatch = !termo ||
                (item.descricao || item.descBanco || '').toLowerCase().includes(termo) ||
                (item.descContabilidade || '').toLowerCase().includes(termo) ||
                item.valor.toString().includes(termo);

            const tratado = getTratadoStatus(item);
            if (!mostrarTratados && tratado) return false;

            return searchMatch;
        });
    }, [resultado, abaAtiva, termoPesquisa, mostrarTratados, alteracoes]);

    // Derived State for Pagination
    const totalItems = dadosCompletosFiltrados.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return dadosCompletosFiltrados.slice(start, start + itemsPerPage);
    }, [dadosCompletosFiltrados, currentPage, itemsPerPage]);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [abaAtiva, termoPesquisa, itemsPerPage]);


    // Counters
    const stats = useMemo(() => {
        if (!resultado) return { tratado: 0, total: 0 };
        const list = abaAtiva === 'correspondidos' ? resultado.reconciliados :
            abaAtiva === 'banco' ? resultado.apenasBanco : resultado.apenasContabilidade;

        const total = list.length;
        const tratado = list.filter((item: any) => getTratadoStatus(item)).length;
        return { tratado, total };
    }, [resultado, abaAtiva, alteracoes]);

    const hasChanges = Object.keys(alteracoes).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart className="w-8 h-8 text-[#e82127]" />
                    Análise Global
                </h2>
                {hasChanges && (
                    <Button onClick={handleSave} disabled={loading} icon={<Save size={18} />} className="animate-in fade-in zoom-in duration-200">
                        Guardar Alterações
                    </Button>
                )}
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-4 py-2 text-gray-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fim</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-4 py-2 text-gray-900 dark:text-white"
                    />
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-6 py-2 bg-[#e82127] hover:bg-[#c9181d] text-white rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? 'A processar...' : <><Search size={18} /> Analisar</>}
                </button>
            </div>

            {resultado && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg border border-green-100 dark:border-green-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-green-800 dark:text-green-400 mb-2">Reconciliado</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{resultado.resumo.totalReconciliado}</div>
                            <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                {formatarMoeda(resultado.resumo.valorReconciliado)}
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-800 dark:text-blue-400 mb-2">Apenas Banco</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{resultado.resumo.totalApenasBanco}</div>
                            <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                {formatarMoeda(resultado.resumo.valorApenasBanco)}
                            </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-800 dark:text-orange-400 mb-2">Apenas PHC</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{resultado.resumo.totalApenasContabilidade}</div>
                            <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                {formatarMoeda(resultado.resumo.valorApenasContabilidade)}
                            </div>
                        </div>
                    </div>

                    <Card className="flex flex-col min-h-[500px]">
                        {/* Tabs & Toolbar */}
                        <div className="flex flex-col xl:flex-row justify-between items-center border-b border-gray-200 dark:border-white/10 p-2 gap-4">
                            <div className="flex gap-2 bg-gray-100 dark:bg-black/20 p-1 rounded-lg overflow-x-auto max-w-full">
                                <button
                                    onClick={() => { setAbaAtiva('correspondidos'); setTermoPesquisa(''); }}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${abaAtiva === 'correspondidos' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Correspondidos
                                </button>
                                <button
                                    onClick={() => { setAbaAtiva('banco'); setTermoPesquisa(''); }}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${abaAtiva === 'banco' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Falta Banco
                                </button>
                                <button
                                    onClick={() => { setAbaAtiva('contabilidade'); setTermoPesquisa(''); }}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${abaAtiva === 'contabilidade' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Falta PHC
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                                {/* Pagination Controls */}
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="hidden sm:inline">Mostrar:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 focus:ring-[#e82127] focus:border-[#e82127]"
                                    >
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3ch] text-center">
                                        {currentPage} / {totalPages || 1}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>

                                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/5 whitespace-nowrap">
                                    <span className="font-semibold text-gray-900 dark:text-white">{stats.tratado}</span>
                                    <span className="mx-1">/</span>
                                    <span>{stats.total}</span>
                                    <span className="ml-1">Tratados</span>
                                </div>

                                <button
                                    onClick={() => setMostrarTratados(!mostrarTratados)}
                                    className={`p-1.5 rounded-md border transition-colors flex items-center gap-2 text-sm px-3 ${mostrarTratados ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10' : 'bg-[#e82127]/10 text-[#e82127] border-[#e82127]/20'}`}
                                    title={mostrarTratados ? "Ocultar Tratados" : "Mostrar Tratados"}
                                >
                                    {mostrarTratados ? <Eye size={18} /> : <EyeOff size={18} />}
                                    <span className="hidden sm:inline">{mostrarTratados ? 'Ocultar Tratados' : 'Mostrar Tratados'}</span>
                                </button>

                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={termoPesquisa}
                                        onChange={(e) => setTermoPesquisa(e.target.value)}
                                        placeholder="Pesquisar..."
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#e82127]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-medium text-gray-500 dark:text-gray-300 sticky top-0 backdrop-blur-md z-10">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-center">
                                            <div className="sr-only">Estado</div>
                                        </th>
                                        {abaAtiva === 'correspondidos' ? (
                                            <>
                                                <th className="px-4 py-3">Valor</th>
                                                <th className="px-4 py-3">Data</th>
                                                <th className="px-4 py-3">Desc Banco</th>
                                                <th className="px-4 py-3">Desc PHC</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3">Data</th>
                                                <th className="px-4 py-3">Descrição</th>
                                                <th className="px-4 py-3">Valor</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((item: any) => {
                                            const tratado = getTratadoStatus(item);
                                            return (
                                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${tratado ? 'bg-green-50/50 dark:bg-green-900/5' : ''}`}>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => toggleTratado(item.id, tratado)}
                                                            className={`transition-colors ${tratado ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                                                        >
                                                            {tratado ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>
                                                    </td>
                                                    {abaAtiva === 'correspondidos' ? (
                                                        <>
                                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatarMoeda(item.valor)}</td>
                                                            <td className="px-4 py-3 text-xs">{item.dataBanco}</td>
                                                            <td className="px-4 py-3 truncate max-w-[200px] text-xs" title={item.descBanco}>{item.descBanco}</td>
                                                            <td className="px-4 py-3 truncate max-w-[200px] text-xs" title={item.descContabilidade}>{item.descContabilidade}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3 text-xs">{item.data}</td>
                                                            <td className="px-4 py-3 text-gray-900 dark:text-white text-xs" title={item.descricao}>{item.descricao}</td>
                                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatarMoeda(item.valor)}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={abaAtiva === 'correspondidos' ? 5 : 4} className="py-12 text-center text-gray-400 dark:text-gray-600">
                                                Nenhum registo encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

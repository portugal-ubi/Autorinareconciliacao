import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Search, Save, CheckSquare, Square, Filter, ChevronLeft, ChevronRight, Eye, EyeOff, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

    // Notes state: mapping ID -> string (only stores changes)
    const [notas, setNotas] = useState<Record<string, string>>({});

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
            setNotas({});
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

        // Collect all IDs that have changes
        const changedIds = new Set([...Object.keys(alteracoes), ...Object.keys(notas)]);
        const updatesBank: any[] = [];
        const updatesPhc: any[] = [];

        changedIds.forEach(id => {
            // Check Reconciliados
            const isReconciliado = resultado.reconciliados.find(t => t.id === id);
            if (isReconciliado) {
                // If matched, apply tratado change to both. Notes not supported for matched yet (UI hides it).
                if (alteracoes.hasOwnProperty(id)) {
                    const val = alteracoes[id];
                    updatesBank.push({ id: isReconciliado.bankId, tratado: val });
                    updatesPhc.push({ id: isReconciliado.phcId, tratado: val });
                }
                return;
            }

            // Check Apenas Banco
            const isBank = resultado.apenasBanco.find(t => t.id === id);
            if (isBank) {
                const update: any = { id };
                if (alteracoes.hasOwnProperty(id)) update.tratado = alteracoes[id];
                if (notas.hasOwnProperty(id)) update.notas = notas[id];
                updatesBank.push(update);
                return;
            }

            // Check Apenas PHC
            const isPhc = resultado.apenasContabilidade.find(t => t.id === id);
            if (isPhc) {
                const update: any = { id };
                if (alteracoes.hasOwnProperty(id)) update.tratado = alteracoes[id];
                if (notas.hasOwnProperty(id)) update.notas = notas[id];
                updatesPhc.push(update);
                return;
            }
        });

        setLoading(true);
        try {
            const requests = [];
            if (updatesBank.length > 0) requests.push(fetch('/api/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'bank', items: updatesBank }) }));
            if (updatesPhc.length > 0) requests.push(fetch('/api/transactions/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'phc', items: updatesPhc }) }));

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
            if (newState[id] === !currentVal) {
                delete newState[id]; // Back to original
            } else {
                newState[id] = !currentVal;
            }
            return newState;
        });
    };

    const handleNoteChange = (id: string, val: string) => {
        setNotas(prev => ({
            ...prev,
            [id]: val
        }));
    };

    const getNota = (item: any) => {
        if (notas.hasOwnProperty(item.id)) return notas[item.id];
        return item.notas || '';
    };

    const getTratadoStatus = (item: any) => {
        if (alteracoes.hasOwnProperty(item.id)) {
            return alteracoes[item.id];
        }
        return !!item.tratado;
    };

    const handleExportExcel = () => {
        if (dadosCompletosFiltrados.length === 0) {
            alert("Não existem dados para exportar.");
            return;
        }

        const dataToExport = dadosCompletosFiltrados.map((item: any) => {
            const base = {
                Valor: item.valor,
                Estado: getTratadoStatus(item) ? 'Tratado' : 'Não Tratado'
            };

            if (abaAtiva === 'correspondidos') {
                return {
                    ...base,
                    'Data Banco': item.dataBanco,
                    'Desc Banco': item.descBanco,
                    'Desc PHC': item.descContabilidade
                };
            } else {
                return {
                    ...base,
                    Data: item.data,
                    Descricao: item.descricao,
                    Notas: getNota(item)
                };
            }
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dados");
        XLSX.writeFile(wb, `Analise_${abaAtiva}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportPDF = () => {
        if (dadosCompletosFiltrados.length === 0) {
            alert("Não existem dados para exportar.");
            return;
        }

        const doc = new jsPDF();

        // Header "Auto Rina" - Blue
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // Blue #2563eb
        doc.setFont("helvetica", "bold");
        doc.text("Auto Rina", 14, 20);

        // Subheader
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0); // Black
        doc.text("Análise de Reconciliação", 14, 30);

        // Meta info
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const tabName = abaAtiva === 'correspondidos' ? 'Correspondidos' :
            abaAtiva === 'banco' ? 'Falta Banco' : 'Falta PHC';

        doc.text(`Tipo: ${tabName}`, 14, 40);
        doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-PT')}`, 14, 45);

        // Line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 48, 196, 48);

        // Table
        const head = [];
        const body = [];

        if (abaAtiva === 'correspondidos') {
            head.push(['Data', 'Desc Banco', 'Desc PHC', 'Valor', 'Estado']);
            body.push(...dadosCompletosFiltrados.map(item => [
                item.dataBanco,
                item.descBanco,
                item.descContabilidade,
                formatarMoeda(item.valor),
                getTratadoStatus(item) ? 'Tratado' : ''
            ]));
        } else {
            head.push(['Data', 'Descrição', 'Valor', 'Notas', 'Estado']);
            body.push(...dadosCompletosFiltrados.map(item => [
                item.data,
                item.descricao,
                formatarMoeda(item.valor),
                getNota(item),
                getTratadoStatus(item) ? 'Tratado' : ''
            ]));
        }

        autoTable(doc, {
            startY: 55,
            head: head,
            body: body,
            headStyles: { fillColor: [37, 99, 235] }, // Blue header
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            didDrawPage: (data) => {
                // Hook reserved for future use
            }
        });

        // Add total pages if needed, but simple page number is often enough.
        // For "Page X of Y", we need to know total pages which is tricky inside the loop during generation unless we use the final callback.
        // Let's optimize to just "Página X" as it's simpler and robust, or do the "X of Y" post-processing.

        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            const text = `Página ${i} de ${totalPages}`;
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height;
            doc.text(text, pageSize.width - 14 - doc.getTextWidth(text), pageHeight - 10);
        }

        doc.save(`Analise_${abaAtiva}_${new Date().toISOString().split('T')[0]}.pdf`);
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
            const itemNota = getNota(item).toLowerCase();
            const searchMatch = !termo ||
                (item.descricao || item.descBanco || '').toLowerCase().includes(termo) ||
                (item.descContabilidade || '').toLowerCase().includes(termo) ||
                item.valor.toString().includes(termo) ||
                itemNota.includes(termo);

            const tratado = getTratadoStatus(item);
            if (!mostrarTratados && tratado) return false;

            return searchMatch;
        });
    }, [resultado, abaAtiva, termoPesquisa, mostrarTratados, alteracoes, notas]);

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

    const hasChanges = Object.keys(alteracoes).length > 0 || Object.keys(notas).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart className="w-8 h-8 text-[#e82127]" />
                    Análise Global
                </h2>
                <div className="flex gap-2">
                    <Button onClick={handleExportExcel} variant="secondary" icon={<FileSpreadsheet size={18} />}>
                        Excel
                    </Button>
                    <Button onClick={handleExportPDF} variant="secondary" icon={<FileText size={18} />}>
                        PDF
                    </Button>
                    {hasChanges && (
                        <Button onClick={handleSave} disabled={loading} icon={<Save size={18} />} className="animate-in fade-in zoom-in duration-200">
                            Guardar Alterações
                        </Button>
                    )}
                </div>
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
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(() => {
                            const countTratados = (list: any[]) => list.filter(item => getTratadoStatus(item)).length;

                            const recTotal = resultado.resumo.totalReconciliado;
                            const recTratados = countTratados(resultado.reconciliados);

                            const bankTotal = resultado.resumo.totalApenasBanco;
                            const bankTratados = countTratados(resultado.apenasBanco);

                            const phcTotal = resultado.resumo.totalApenasContabilidade;
                            const phcTratados = countTratados(resultado.apenasContabilidade);

                            return (
                                <>
                                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg border border-green-100 dark:border-green-900/30">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-green-800 dark:text-green-400 mb-2">Reconciliado</h3>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{recTotal}</div>
                                            <div className="text-sm font-medium text-green-600 dark:text-green-400">({recTratados} tratados)</div>
                                        </div>
                                        <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                            {formatarMoeda(resultado.resumo.valorReconciliado)}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-800 dark:text-blue-400 mb-2">Apenas Banco</h3>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{bankTotal}</div>
                                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">({bankTratados} tratados)</div>
                                        </div>
                                        <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                            {formatarMoeda(resultado.resumo.valorApenasBanco)}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-orange-800 dark:text-orange-400 mb-2">Apenas PHC</h3>
                                        <div className="flex items-baseline gap-2">
                                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{phcTotal}</div>
                                            <div className="text-sm font-medium text-orange-600 dark:text-orange-400">({phcTratados} tratados)</div>
                                        </div>
                                        <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                            {formatarMoeda(resultado.resumo.valorApenasContabilidade)}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
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
                                                <th className="px-4 py-3">Notas</th>
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
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={getNota(item)}
                                                                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                                    placeholder="Adicionar nota..."
                                                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#e82127] text-xs py-1 px-2 focus:outline-none transition-colors"
                                                                />
                                                            </td>
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

import React, { useState, useMemo } from 'react';
import { BarChart, Search, Download, Square, CheckSquare } from 'lucide-react';
import { ResultadoReconciliacao } from '../types';
import { Card } from '../components/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AnalysisPage: React.FC = () => {
    const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01');
    const [endDate, setEndDate] = useState(new Date().getFullYear() + '-12-31');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<ResultadoReconciliacao | null>(null);

    // UI States
    const [abaAtiva, setAbaAtiva] = useState<'correspondidos' | 'banco' | 'contabilidade'>('correspondidos');
    const [termoPesquisa, setTermoPesquisa] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reconciliation/global?start=${startDate}&end=${endDate}`);
            const data = await res.json();
            setResultado(data);
        } catch (error) {
            console.error("Error analyzing:", error);
            alert("Erro ao gerar análise.");
        } finally {
            setLoading(false);
        }
    };

    const formatarMoeda = (val: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

    const dadosPie = useMemo(() => {
        if (!resultado) return [];
        return [
            { nome: 'Correspondidos', valor: resultado.resumo.totalReconciliado, color: '#10b981' },
            { nome: 'Apenas Banco', valor: resultado.resumo.totalApenasBanco, color: '#eab308' },
            { nome: 'Apenas PHC', valor: resultado.resumo.totalApenasContabilidade, color: '#f97316' },
        ];
    }, [resultado]);

    const dadosFiltrados = useMemo(() => {
        if (!resultado) return [];
        const termo = termoPesquisa.toLowerCase();

        if (abaAtiva === 'correspondidos') {
            return resultado.reconciliados.filter(item =>
                !termo ||
                item.descBanco.toLowerCase().includes(termo) ||
                item.descContabilidade.toLowerCase().includes(termo) ||
                item.valor.toString().includes(termo)
            );
        } else if (abaAtiva === 'banco') {
            return resultado.apenasBanco.filter(item =>
                !termo ||
                item.descricao.toLowerCase().includes(termo) ||
                item.valor.toString().includes(termo)
            );
        } else {
            return resultado.apenasContabilidade.filter(item =>
                !termo ||
                item.descricao.toLowerCase().includes(termo) ||
                item.valor.toString().includes(termo)
            );
        }
    }, [resultado, abaAtiva, termoPesquisa]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart className="w-8 h-8 text-[#e82127]" />
                Análise Global
            </h2>

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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <Card title="Distribuição" className="lg:col-span-1 h-[600px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dadosPie}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="valor"
                                        stroke="none"
                                    >
                                        {dadosPie.map((entrada, index) => (
                                            <Cell key={`cell-${index}`} fill={entrada.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900)', border: 'none', borderRadius: '4px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Detailed Table with Tabs & Search */}
                        <Card className="lg:col-span-2 h-[600px] flex flex-col">
                            {/* Tabs */}
                            <div className="flex flex-col border-b border-gray-200 dark:border-white/10">
                                <div className="flex">
                                    <button
                                        onClick={() => { setAbaAtiva('correspondidos'); setTermoPesquisa(''); }}
                                        className={`flex-1 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${abaAtiva === 'correspondidos' ? 'border-[#e82127] text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5' : 'border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        Correspondidos
                                    </button>
                                    <button
                                        onClick={() => { setAbaAtiva('banco'); setTermoPesquisa(''); }}
                                        className={`flex-1 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${abaAtiva === 'banco' ? 'border-yellow-500 text-gray-900 dark:text-white bg-yellow-50 dark:bg-yellow-900/10' : 'border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        Falta Banco
                                    </button>
                                    <button
                                        onClick={() => { setAbaAtiva('contabilidade'); setTermoPesquisa(''); }}
                                        className={`flex-1 px-4 py-4 text-sm font-medium transition-colors border-b-2 ${abaAtiva === 'contabilidade' ? 'border-orange-500 text-gray-900 dark:text-white bg-orange-50 dark:bg-orange-900/10' : 'border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        Falta PHC
                                    </button>
                                </div>

                                <div className="p-3 bg-gray-50 dark:bg-black/20">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={termoPesquisa}
                                            onChange={(e) => setTermoPesquisa(e.target.value)}
                                            placeholder={`Pesquisar na aba ${abaAtiva === 'correspondidos' ? 'Correspondidos' : abaAtiva === 'banco' ? 'Banco' : 'PHC'}...`}
                                            className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-md pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#e82127]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                    <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-medium text-gray-500 dark:text-gray-300 sticky top-0 backdrop-blur-md z-10">
                                        <tr>
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
                                        {dadosFiltrados.length > 0 ? (
                                            dadosFiltrados.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    {abaAtiva === 'correspondidos' ? (
                                                        <>
                                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatarMoeda(item.valor)}</td>
                                                            <td className="px-4 py-3 text-xs">{item.dataBanco}</td>
                                                            <td className="px-4 py-3 truncate max-w-[120px] text-xs" title={item.descBanco}>{item.descBanco}</td>
                                                            <td className="px-4 py-3 truncate max-w-[120px] text-xs" title={item.descContabilidade}>{item.descContabilidade}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3 text-xs">{item.data}</td>
                                                            <td className="px-4 py-3 text-gray-900 dark:text-white text-xs" title={item.descricao}>{item.descricao}</td>
                                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatarMoeda(item.valor)}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-gray-600">
                                                    Nenhum registo encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState } from 'react';
import { BarChart, Search, Download } from 'lucide-react';
import { ResultadoReconciliacao } from '../types';

export const AnalysisPage: React.FC = () => {
    const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01');
    const [endDate, setEndDate] = useState(new Date().getFullYear() + '-12-31');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<ResultadoReconciliacao | null>(null);

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
                        className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-4 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fim</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md px-4 py-2"
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
                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(resultado.resumo.valorReconciliado)}
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-800 dark:text-blue-400 mb-2">Apenas Banco</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{resultado.resumo.totalApenasBanco}</div>
                            <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(resultado.resumo.valorApenasBanco)}
                            </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-orange-800 dark:text-orange-400 mb-2">Apenas PHC</h3>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{resultado.resumo.totalApenasContabilidade}</div>
                            <div className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(resultado.resumo.valorApenasContabilidade)}
                            </div>
                        </div>
                    </div>

                    {/* Lists - Reusing similar layout to ResultsPage but simpler */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-blue-600 dark:text-blue-400">Falta na Contabilidade (Está no Banco)</h3>
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden max-h-[500px] overflow-y-auto">
                                {resultado.apenasBanco.map((item, i) => (
                                    <div key={i} className="p-3 border-b border-gray-100 dark:border-white/5 text-sm flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div>
                                            <div className="font-mono text-gray-600 dark:text-gray-400 text-xs">{item.data}</div>
                                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={item.descricao}>{item.descricao}</div>
                                        </div>
                                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(item.valor)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-orange-600 dark:text-orange-400">Falta no Banco (Está na Contabilidade)</h3>
                            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden max-h-[500px] overflow-y-auto">
                                {resultado.apenasContabilidade.map((item, i) => (
                                    <div key={i} className="p-3 border-b border-gray-100 dark:border-white/5 text-sm flex justify-between items-center hover:bg-gray-50 dark:hover:bg-white/5">
                                        <div>
                                            <div className="font-mono text-gray-600 dark:text-gray-400 text-xs">{item.data}</div>
                                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={item.descricao}>{item.descricao}</div>
                                        </div>
                                        <div className="font-mono font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(item.valor)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

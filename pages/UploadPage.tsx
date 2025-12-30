import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface UploadStatus {
    bank: { minDate: string; maxDate: string; count: string };
    phc: { minDate: string; maxDate: string; count: string };
}

export const UploadPage: React.FC = () => {
    const [status, setStatus] = useState<UploadStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Years list (current + past 4 years)
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchStatus();
    }, [selectedYear]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/status/range?year=${selectedYear}`);
            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error("Error fetching status", error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bank' | 'phc') => {
        if (!e.target.files || !e.target.files[0]) return;

        setLoading(true);
        setMessage(null);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const res = await fetch(`/api/upload/${type}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: `Sucesso! Adicionados: ${data.added}, Ignorados (Duplicados): ${data.skipped}, Total no ficheiro: ${data.total}`
                });
                fetchStatus();
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao carregar ficheiro.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setLoading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Importar Dados</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ano:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-white/10 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#e82127]"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        Banco
                    </h3>
                    {status?.bank.count ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Registos: <span className="font-mono font-bold text-gray-900 dark:text-white">{status.bank.count}</span></p>
                            <p>Desde: <span className="font-mono text-gray-900 dark:text-white">{status.bank.minDate?.split('T')[0]}</span></p>
                            <p>Até: <span className="font-mono text-gray-900 dark:text-white">{status.bank.maxDate?.split('T')[0]}</span></p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Sem dados</p>
                    )}
                    <div className="mt-4">
                        <label className="block w-full cursor-pointer bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-4 transition-colors text-center group">
                            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleUpload(e, 'bank')} disabled={loading} />
                            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Carregar Ficheiro Banco</span>
                        </label>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        PHC (Contabilidade)
                    </h3>
                    {status?.phc.count ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>Registos: <span className="font-mono font-bold text-gray-900 dark:text-white">{status.phc.count}</span></p>
                            <p>Desde: <span className="font-mono text-gray-900 dark:text-white">{status.phc.minDate?.split('T')[0]}</span></p>
                            <p>Até: <span className="font-mono text-gray-900 dark:text-white">{status.phc.maxDate?.split('T')[0]}</span></p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Sem dados</p>
                    )}
                    <div className="mt-4">
                        <label className="block w-full cursor-pointer bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md p-4 transition-colors text-center group">
                            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleUpload(e, 'phc')} disabled={loading} />
                            <Upload className="w-6 h-6 mx-auto mb-2 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Carregar Ficheiro PHC</span>
                        </label>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-3 text-gray-500">A processar ficheiro...</span>
                </div>
            )}

            {message && (
                <div className={`p-4 rounded-md flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                    <span>{message.text}</span>
                </div>
            )}
        </div>
    );
};

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export const VerificationPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [selectedType, setSelectedType] = useState<'bank' | 'phc'>('bank');

    const handleVerify = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        setLoading(true);
        setResult(null);
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('type', selectedType);

        try {
            const res = await fetch('/api/verify/check', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            alert("Erro na verificação");
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-[#e82127]" />
                Verificação de Integridade
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Submeta um ficheiro "Master" (ex: extrato anual) para verificar se todos os movimentos estão registados na base de dados.
            </p>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setSelectedType('bank')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedType === 'bank' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                >
                    Verificar Banco
                </button>
                <button
                    onClick={() => setSelectedType('phc')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedType === 'phc' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                >
                    Verificar PHC
                </button>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <label className="cursor-pointer block">
                    <input type="file" className="hidden" onChange={handleVerify} disabled={loading} />
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Carregar Ficheiro de Controlo ({selectedType === 'bank' ? 'Banco' : 'PHC'})
                    </span>
                    <span className="text-sm text-gray-500">Suporta Excel ou CSV</span>
                </label>
            </div>

            {loading && <p className="text-center text-gray-500 animate-pulse">A analisar ficheiro...</p>}

            {result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                            <h3 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                Em Falta na Base de Dados
                                <span className="bg-red-200 dark:bg-red-900/50 text-xs px-2 py-0.5 rounded-full ml-auto">{result.missingInDb.length}</span>
                            </h3>
                            {result.missingInDb.length === 0 ? (
                                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Tudo OK!</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {result.missingInDb.map((item: any, i: number) => (
                                        <div key={i} className="text-sm bg-white dark:bg-black/20 p-2 rounded flex justify-between">
                                            <span>{item.data}</span>
                                            <span className="font-mono">{item.valor} €</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <h3 className="text-orange-800 dark:text-orange-300 font-bold flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                Extra na Base de Dados
                                <span className="text-xs font-normal text-gray-500 ml-2">(Neste período)</span>
                                <span className="bg-orange-200 dark:bg-orange-900/50 text-xs px-2 py-0.5 rounded-full ml-auto">{result.extraInDb.length}</span>
                            </h3>
                            {result.extraInDb.length === 0 ? (
                                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Tudo OK!</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {result.extraInDb.map((item: any, i: number) => (
                                        <div key={i} className="text-sm bg-white dark:bg-black/20 p-2 rounded flex justify-between">
                                            <span>{item.data}</span>
                                            <span className="font-mono">{item.valor} €</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
    const handleImportMissing = async () => {
        if (!result || !result.missingInDb || result.missingInDb.length === 0) return;

        if (!confirm(`Tem a certeza que deseja importar ${result.missingInDb.length} registos para a base de dados?`)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/verify/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedType,
                    transactions: result.missingInDb
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`Sucesso! ${data.imported} registos importados.`);
                // Clear the list or refresh? Let's clear the result to force a re-check if needed, or just clear the missing list
                setResult(null); // Force user to re-upload to confirm everything is clean, or just clear
            } else {
                alert("Erro ao importar: " + (data.error || 'Erro desconhecido'));
            }
        } catch (e) {
            console.error(e);
            alert("Erro de comunicação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-[#e82127]" />
                Verificação de Integridade
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
                Submeta um ficheiro "Master" (ex: extrato anual) para verificar se todos os movimentos estão registados na base de dados.
            </p>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setSelectedType('bank')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedType === 'bank' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                >
                    Verificar Banco
                </button>
                <button
                    onClick={() => setSelectedType('phc')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${selectedType === 'phc' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}
                >
                    Verificar PHC
                </button>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <label className="cursor-pointer block">
                    <input type="file" className="hidden" onChange={handleVerify} disabled={loading} />
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Carregar Ficheiro de Controlo ({selectedType === 'bank' ? 'Banco' : 'PHC'})
                    </span>
                    <span className="text-sm text-gray-500">Suporta Excel ou CSV</span>
                </label>
            </div>

            {loading && <p className="text-center text-gray-500 animate-pulse">A processar...</p>}

            {result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-red-800 dark:text-red-300 font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Em Falta na Base de Dados
                                    <span className="bg-red-200 dark:bg-red-900/50 text-xs px-2 py-0.5 rounded-full ml-2">{result.missingInDb.length}</span>
                                </h3>
                                {result.missingInDb.length > 0 && (
                                    <button
                                        onClick={handleImportMissing}
                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                    >
                                        Importar {result.missingInDb.length} Itens
                                    </button>
                                )}
                            </div>

                            {result.missingInDb.length === 0 ? (
                                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Tudo OK!</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {result.missingInDb.map((item: any, i: number) => (
                                        <div key={i} className="text-sm bg-white dark:bg-black/20 p-2 rounded flex justify-between">
                                            <span>{item.data}</span>
                                            <span className="font-mono">{item.valor} €</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <h3 className="text-orange-800 dark:text-orange-300 font-bold flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                Extra na Base de Dados
                                <span className="text-xs font-normal text-gray-500 ml-2">(Neste período)</span>
                                <span className="bg-orange-200 dark:bg-orange-900/50 text-xs px-2 py-0.5 rounded-full ml-auto">{result.extraInDb.length}</span>
                            </h3>
                            {result.extraInDb.length === 0 ? (
                                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Tudo OK!</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {result.extraInDb.map((item: any, i: number) => (
                                        <div key={i} className="text-sm bg-white dark:bg-black/20 p-2 rounded flex justify-between">
                                            <span>{item.data}</span>
                                            <span className="font-mono">{item.valor} €</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

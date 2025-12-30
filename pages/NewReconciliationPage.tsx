import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Upload, FileText, ArrowRight, Check } from 'lucide-react';
import { Transacao, ResultadoReconciliacao } from '../types';
import { processarReconciliacao, gerarDadosSimulados } from '../services/reconciliationService';

interface NewReconciliationPageProps {
  onConcluir: (resultado: ResultadoReconciliacao) => void;
}

export const NewReconciliationPage: React.FC<NewReconciliationPageProps> = ({ onConcluir }) => {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [estaAProcessar, setEstaAProcessar] = useState(false);
  const [ficheiroContabilidade, setFicheiroContabilidade] = useState<File | null>(null);
  const [ficheiroBanco, setFicheiroBanco] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleMudancaFicheiro = (tipo: 'banco' | 'contabilidade') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setErro(null);
    if (e.target.files && e.target.files[0]) {
      if (tipo === 'banco') setFicheiroBanco(e.target.files[0]);
      else setFicheiroContabilidade(e.target.files[0]);
    }
  };

  const handleProcessar = async () => {
    if (!ficheiroContabilidade || !ficheiroBanco) return;

    setEstaAProcessar(true);
    setErro(null);

    try {
      // Send files directly to backend
      console.log(`Sending files to backend for processing...`);

      const resultado = await processarReconciliacao(ficheiroBanco, ficheiroContabilidade);
      onConcluir(resultado);
    } catch (erro: any) {
      console.error(erro);
      setErro("Erro ao processar ficheiros. Verifique se são ficheiros Excel válidos (.xlsx, .xls) e tente novamente.");
      setEstaAProcessar(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Reconciliação</h1>
        <p className="text-gray-500 dark:text-gray-400">Carregue o seu ficheiro PHC e extratos bancários para iniciar a correspondência automática.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Linha Conectora */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-400 dark:text-white/50 shadow-sm dark:shadow-none">
            <ArrowRight size={20} />
          </div>
        </div>

        {/* Esquerda: Dropzone Contabilidade */}
        <Card title="Extrato PHC" className="relative group hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div className="h-64 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg flex flex-col items-center justify-center p-6 text-center transition-colors group-hover:border-gray-300 dark:group-hover:border-white/20 bg-gray-50 dark:bg-black/20">
            {ficheiroContabilidade ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-500">
                  <Check size={32} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white break-all">{ficheiroContabilidade.name}</p>
                  <p className="text-sm text-gray-500">{(ficheiroContabilidade.size / 1024).toFixed(2)} KB</p>
                </div>
                <button onClick={() => setFicheiroContabilidade(null)} className="text-xs text-red-500 hover:text-red-400 uppercase tracking-wide">Remover</button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-white transition-colors">
                  <FileText size={32} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Arraste e largue o Excel do PHC</p>
                <p className="text-xs text-gray-500 dark:text-gray-600 mb-6">Suportado: .xlsx, .xls</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 rounded text-sm font-medium transition-colors text-gray-900 dark:text-white border border-gray-200 dark:border-transparent">Procurar Ficheiros</span>
                  <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleMudancaFicheiro('contabilidade')} />
                </label>
              </>
            )}
          </div>
        </Card>

        {/* Direita: Dropzone Banco */}
        <Card title="Extrato Bancário" className="relative group hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div className="h-64 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg flex flex-col items-center justify-center p-6 text-center transition-colors group-hover:border-gray-300 dark:group-hover:border-white/20 bg-gray-50 dark:bg-black/20">
            {ficheiroBanco ? (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                  <Check size={32} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white break-all">{ficheiroBanco.name}</p>
                  <p className="text-sm text-gray-500">{(ficheiroBanco.size / 1024).toFixed(2)} KB</p>
                </div>
                <button onClick={() => setFicheiroBanco(null)} className="text-xs text-red-500 hover:text-red-400 uppercase tracking-wide">Remover</button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-white transition-colors">
                  <Upload size={32} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Arraste e largue o Excel do Banco</p>
                <p className="text-xs text-gray-500 dark:text-gray-600 mb-6">Suportado: .xlsx, .xls</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 rounded text-sm font-medium transition-colors text-gray-900 dark:text-white border border-gray-200 dark:border-transparent">Procurar Ficheiros</span>
                  <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleMudancaFicheiro('banco')} />
                </label>
              </>
            )}
          </div>
        </Card>
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-md text-sm text-center animate-in fade-in">
          {erro}
        </div>
      )}

      <div className="flex justify-center pt-8">
        <Button
          size="lg"
          className="w-64 h-12 text-lg"
          disabled={!ficheiroContabilidade || !ficheiroBanco || estaAProcessar}
          onClick={handleProcessar}
          isLoading={estaAProcessar}
        >
          {estaAProcessar ? 'A Processar...' : 'Iniciar Reconciliação'}
        </Button>
      </div>
    </div>
  );
};
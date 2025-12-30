import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, TrendingUp, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ResultadoReconciliacao } from '../types';

interface DashboardPageProps {
  onVerNovaRecon: () => void;
  historicoRecente: ResultadoReconciliacao[];
  onSelecionarHistorico: (resultado: ResultadoReconciliacao) => void;
}

// Cálculos das métricas
const totalReconciliacoes = historicoRecente.length;
const reconciliacoesTratadas = historicoRecente.filter(h => h.tratado).length;
const taxaReconciliado = totalReconciliacoes > 0
  ? ((reconciliacoesTratadas / totalReconciliacoes) * 100).toFixed(1)
  : '0';

const totalPendentesManuais = historicoRecente.reduce((acc, curr) => {
  const pendentesBanco = curr.apenasBanco.filter(t => !t.tratado).length;
  const pendentesPhc = curr.apenasContabilidade.filter(t => !t.tratado).length;
  return acc + pendentesBanco + pendentesPhc;
}, 0);

const totalVistos = historicoRecente.reduce((acc, curr) => {
  const vistosReconciliados = curr.reconciliados.filter(t => t.tratado).length;
  const vistosBanco = curr.apenasBanco.filter(t => t.tratado).length;
  const vistosPhc = curr.apenasContabilidade.filter(t => t.tratado).length;
  return acc + vistosReconciliados + vistosBanco + vistosPhc;
}, 0);

const totalPossiveis = historicoRecente.reduce((acc, curr) => {
  return acc +
    curr.reconciliados.length +
    curr.apenasBanco.length +
    curr.apenasContabilidade.length;
}, 0);

return (
  <div className="space-y-6">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Painel de Controlo</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Visão geral das atividades recentes de reconciliação</p>
      </div>
      <Button onClick={onVerNovaRecon} icon={<Plus size={16} />}>
        Nova Reconciliação
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-l-4 border-l-green-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Reconciliado (Status)</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {reconciliacoesTratadas}/{totalReconciliacoes}
              </h3>
            </div>
          </div>
          <div className={`p-2 rounded-full ${reconciliacoesTratadas === totalReconciliacoes && totalReconciliacoes > 0 ? 'bg-green-500/10 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
            <CheckCircle size={20} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400">
          {/* <TrendingUp size={14} className="mr-1" /> */}
          <span>Reconciliações Tratadas / Totais</span>
        </div>
      </Card>

      <Card className="border-l-4 border-l-yellow-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Itens Pendentes</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalPendentesManuais}</h3>
          </div>
          <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500">
            <AlertCircle size={20} />
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <span>Divergências por tratar (Banco + PHC)</span>
        </div>
      </Card>

      <Card className="border-l-4 border-l-[#e82127]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Progresso Global</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalVistos}/{totalPossiveis}
            </h3>
          </div>
          <div className="p-2 bg-red-500/10 rounded-full text-[#e82127]">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <span>Total Vistos / Total Itens</span>
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-6">
      <Card title="Atividade Recente">
        <div className="space-y-2">
          {historicoRecente.length > 0 ? (
            historicoRecente.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelecionarHistorico(item)}
                className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-white/10 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 group-hover:bg-[#e82127]/10 group-hover:text-[#e82127] transition-colors">
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium group-hover:text-[#e82127] transition-colors">
                      {item.nome ? item.nome : `Reconciliação #${item.id.substring(0, 6)}`}
                    </p>
                    {item.nome && <p className="text-xs text-gray-500">#{item.id.substring(0, 8)}</p>}
                    <p className="text-xs text-gray-500">
                      {item.resumo.totalReconciliado} correspondidos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${item.tratado ? 'bg-green-500/20 text-green-600 dark:text-green-500' : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'}`}>
                    {item.tratado ? 'Concluído' : 'Pendente'}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{calcularTempoRelativo(item.carimboTempo)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Ainda não existem reconciliações recentes.
            </div>
          )}
        </div>
      </Card>
    </div>
  </div>
);
};
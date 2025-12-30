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

const dadosGrafico = [
  { nome: 'Seg', correspondidos: 4000, erro: 2400 },
  { nome: 'Ter', correspondidos: 3000, erro: 1398 },
  { nome: 'Qua', correspondidos: 2000, erro: 9800 },
  { nome: 'Qui', correspondidos: 2780, erro: 3908 },
  { nome: 'Sex', correspondidos: 1890, erro: 4800 },
  { nome: 'Sab', correspondidos: 2390, erro: 3800 },
  { nome: 'Dom', correspondidos: 3490, erro: 4300 },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onVerNovaRecon, 
  historicoRecente,
  onSelecionarHistorico
}) => {
  
  const calcularTempoRelativo = (isoString: string) => {
    const data = new Date(isoString);
    const agora = new Date();
    const difHoras = Math.abs(agora.getTime() - data.getTime()) / 36e5;
    
    if (difHoras < 24) {
      if (difHoras < 1) return 'há menos de 1h';
      return `há ${Math.floor(difHoras)}h`;
    }
    return data.toLocaleDateString('pt-PT');
  };

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
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Reconciliado (Mês)</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">98.2%</h3>
            </div>
            <div className="p-2 bg-green-500/10 rounded-full text-green-500">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-green-600 dark:text-green-400">
            <TrendingUp size={14} className="mr-1" />
            <span>+2.4% que o mês passado</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Revisão Pendente</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">42</h3>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span>Requer intervenção manual</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-[#e82127]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Volume Total</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">€1.2M</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-full text-[#e82127]">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span>Processado em 12 ficheiros</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tendências de Volume" className="h-96">
          <div className="h-full w-full pt-4">
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="corCorrespondidos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e82127" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e82127" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="nome" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900)', border: 'none', borderRadius: '4px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="correspondidos" stroke="#e82127" strokeWidth={2} fillOpacity={1} fill="url(#corCorrespondidos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

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
                        Reconciliação #{item.id.substring(0, 6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.resumo.totalReconciliado} correspondidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-green-500/20 text-green-600 dark:text-green-500">
                      Concluído
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
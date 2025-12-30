import React, { useState, useEffect, useMemo } from 'react';
import { ResultadoReconciliacao, TransacaoCorrespondida, Transacao } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, Download, CheckCircle, XCircle, Search, Save, Square, CheckSquare } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ResultsPageProps {
  resultado: ResultadoReconciliacao;
  onVoltar: () => void;
  onGuardar?: (resultado: ResultadoReconciliacao) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ resultado, onVoltar, onGuardar }) => {
  // Estado local para permitir edição dos vistos antes de guardar
  const [dadosLocais, setDadosLocais] = useState<ResultadoReconciliacao>(resultado);
  const [abaAtiva, setAbaAtiva] = useState<'correspondidos' | 'banco' | 'contabilidade'>('correspondidos');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [temAlteracoes, setTemAlteracoes] = useState(false);

  // Atualizar dados locais se a prop mudar (ex: recarregar página)
  useEffect(() => {
    setDadosLocais(resultado);
  }, [resultado.id]);

  const dadosPie = [
    { nome: 'Correspondidos', valor: dadosLocais.resumo.totalReconciliado, color: '#10b981' },
    { nome: 'Apenas Banco', valor: dadosLocais.resumo.totalApenasBanco, color: '#eab308' },
    { nome: 'Apenas PHC', valor: dadosLocais.resumo.totalApenasContabilidade, color: '#f97316' },
  ];

  const formatarMoeda = (val: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

  // Filtra os dados da aba ativa com base na pesquisa
  const dadosFiltrados = useMemo(() => {
    const termo = termoPesquisa.toLowerCase();
    
    if (abaAtiva === 'correspondidos') {
      return dadosLocais.reconciliados.filter(item => 
        !termo || 
        item.descBanco.toLowerCase().includes(termo) || 
        item.descContabilidade.toLowerCase().includes(termo) ||
        item.valor.toString().includes(termo)
      );
    } else if (abaAtiva === 'banco') {
      return dadosLocais.apenasBanco.filter(item => 
        !termo || 
        item.descricao.toLowerCase().includes(termo) || 
        item.valor.toString().includes(termo)
      );
    } else {
      return dadosLocais.apenasContabilidade.filter(item => 
        !termo || 
        item.descricao.toLowerCase().includes(termo) || 
        item.valor.toString().includes(termo)
      );
    }
  }, [dadosLocais, abaAtiva, termoPesquisa]);

  // Manipuladores de Checkbox
  const toggleItem = (id: string) => {
    setTemAlteracoes(true);
    const novoEstado = { ...dadosLocais };
    
    if (abaAtiva === 'correspondidos') {
      novoEstado.reconciliados = novoEstado.reconciliados.map(item => 
        item.id === id ? { ...item, tratado: !item.tratado } : item
      );
    } else if (abaAtiva === 'banco') {
      novoEstado.apenasBanco = novoEstado.apenasBanco.map(item => 
        item.id === id ? { ...item, tratado: !item.tratado } : item
      );
    } else {
      novoEstado.apenasContabilidade = novoEstado.apenasContabilidade.map(item => 
        item.id === id ? { ...item, tratado: !item.tratado } : item
      );
    }
    setDadosLocais(novoEstado);
  };

  const toggleTodos = () => {
    setTemAlteracoes(true);
    const todosVisiveisJaSelecionados = dadosFiltrados.every((item: any) => item.tratado);
    const novoEstado = { ...dadosLocais };
    const idsVisiveis = new Set(dadosFiltrados.map((item: any) => item.id));

    const atualizarLista = (lista: any[]) => lista.map(item => 
      idsVisiveis.has(item.id) ? { ...item, tratado: !todosVisiveisJaSelecionados } : item
    );

    if (abaAtiva === 'correspondidos') {
      novoEstado.reconciliados = atualizarLista(novoEstado.reconciliados);
    } else if (abaAtiva === 'banco') {
      novoEstado.apenasBanco = atualizarLista(novoEstado.apenasBanco);
    } else {
      novoEstado.apenasContabilidade = atualizarLista(novoEstado.apenasContabilidade);
    }
    setDadosLocais(novoEstado);
  };

  const handleGuardar = () => {
    if (onGuardar) {
      onGuardar(dadosLocais);
      setTemAlteracoes(false);
    }
  };

  const todosSelecionados = dadosFiltrados.length > 0 && dadosFiltrados.every((item: any) => item.tratado);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onVoltar} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhe da Reconciliação</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              #{resultado.id.substring(0,8)} • Gerado em {new Date(resultado.carimboTempo).toLocaleString('pt-PT')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {temAlteracoes && (
            <Button 
              onClick={handleGuardar}
              className="animate-pulse bg-green-600 hover:bg-green-700 shadow-none border-transparent text-white"
              icon={<Save size={16} />}
            >
              Guardar Alterações
            </Button>
          )}
          <Button variant="secondary" icon={<Download size={16} />}>PDF</Button>
          <Button icon={<Download size={16} />}>Excel</Button>
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-green-500 bg-gradient-to-b from-green-50 to-white dark:from-green-500/5 dark:to-transparent">
          <div className="text-center">
            <p className="text-green-500 font-bold uppercase tracking-widest text-xs mb-2">Reconciliado</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{dadosLocais.resumo.totalReconciliado}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{formatarMoeda(dadosLocais.resumo.valorReconciliado)}</p>
          </div>
        </Card>
        <Card className="border-t-4 border-t-yellow-500 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-500/5 dark:to-transparent">
          <div className="text-center">
            <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-2">Apenas Banco</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{dadosLocais.resumo.totalApenasBanco}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{formatarMoeda(dadosLocais.resumo.valorApenasBanco)}</p>
          </div>
        </Card>
        <Card className="border-t-4 border-t-orange-500 bg-gradient-to-b from-orange-50 to-white dark:from-orange-500/5 dark:to-transparent">
          <div className="text-center">
            <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2">Apenas PHC</p>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{dadosLocais.resumo.totalApenasContabilidade}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{formatarMoeda(dadosLocais.resumo.valorApenasContabilidade)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
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
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Tabela Detalhada com Pesquisa e Vistos */}
        <Card className="lg:col-span-2 h-[600px] flex flex-col">
          {/* Header da Tabela: Abas + Pesquisa */}
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
                  <th className="px-4 py-3 w-12 text-center">
                    <button onClick={toggleTodos} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" title="Selecionar Todos Visíveis">
                      {todosSelecionados ? <CheckSquare size={18} className="text-[#e82127]" /> : <Square size={18} />}
                    </button>
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
                      <th className="px-4 py-3">Estado</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {dadosFiltrados.length > 0 ? (
                  dadosFiltrados.map((item: any) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${item.tratado ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleItem(item.id)} className="text-gray-300 hover:text-green-500 dark:hover:text-green-400">
                         {item.tratado ? <CheckSquare size={18} className="text-green-500" /> : <Square size={18} />}
                      </button>
                    </td>

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
                        <td className="px-4 py-3">
                          {abaAtiva === 'banco' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-500">
                              Não está no PHC
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-500">
                              Não está no Banco
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                  ))
                ) : (
                  <tr>
                     <td colSpan={5} className="py-12 text-center">
                        <EstadoVazio texto={termoPesquisa ? "Nenhum resultado para a pesquisa" : "Tudo limpo por aqui."} />
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const EstadoVazio = ({ texto }: { texto: string }) => (
  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
    <Search className="w-12 h-12 mb-2 opacity-20" />
    <p className="text-sm">{texto}</p>
  </div>
);
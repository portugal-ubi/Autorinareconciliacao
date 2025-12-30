import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ResultadoReconciliacao } from '../types';
import { Eye, Search, CheckSquare, Square, Trash2, Edit3, X } from 'lucide-react';

interface HistoryPageProps {
  historico: ResultadoReconciliacao[];
  onSelecionarHistorico: (resultado: ResultadoReconciliacao) => void;
  onToggleTratado: (id: string) => void;
  onApagar: (id: string) => void;
  onAtualizarNome: (id: string, nome: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  historico,
  onSelecionarHistorico,
  onToggleTratado,
  onApagar,
  onAtualizarNome
}) => {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setTempName(currentName);
  };

  const handleSaveName = (id: string) => {
    onAtualizarNome(id, tempName);
    setEditingId(null);
  };

  // Lógica de pesquisa profunda
  const historicoFiltrado = useMemo(() => {
    if (!termoPesquisa) return historico;

    const termo = termoPesquisa.toLowerCase();

    return historico.filter(recon => {
      // 1. Pesquisa no cabeçalho/resumo
      if (recon.id.toLowerCase().includes(termo)) return true;
      if (new Date(recon.carimboTempo).toLocaleDateString().includes(termo)) return true;

      // 2. Pesquisa profunda nos arrays de transações
      // Verificar em transações não reconciliadas (Banco)
      const encontrouBanco = recon.apenasBanco.some(t =>
        t.descricao.toLowerCase().includes(termo) ||
        t.valor.toString().includes(termo)
      );
      if (encontrouBanco) return true;

      // Verificar em transações não reconciliadas (PHC)
      const encontrouContab = recon.apenasContabilidade.some(t =>
        t.descricao.toLowerCase().includes(termo) ||
        t.valor.toString().includes(termo)
      );
      if (encontrouContab) return true;

      // Verificar nos reconciliados
      const encontrouRecon = recon.reconciliados.some(t =>
        t.descBanco.toLowerCase().includes(termo) ||
        t.descContabilidade.toLowerCase().includes(termo) ||
        t.valor.toString().includes(termo)
      );

      return encontrouRecon;
    });
  }, [historico, termoPesquisa]);

  const formatarMoeda = (val: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Histórico de Reconciliações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Registo completo guardado em base de dados</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por ID, valor ou descrição..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-md pl-10 pr-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-[#e82127] transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-medium text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 w-16 text-center">Tratado</th>
                <th className="px-6 py-4">ID Reconciliação</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Corresp.</th>
                <th className="px-6 py-4 text-yellow-600 dark:text-yellow-500">Falta Banco</th>
                <th className="px-6 py-4 text-orange-600 dark:text-orange-500">Falta PHC</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {historicoFiltrado.length > 0 ? (
                historicoFiltrado.map((item) => (
                  <tr key={item.id} className={`hover: bg - gray - 50 dark: hover: bg - white / [0.02] transition - colors ${item.tratado ? 'bg-green-50/30 dark:bg-green-900/10' : ''} `}>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTratado(item.id);
                        }}
                        className={`transition - colors ${item.tratado ? 'text-green-500 hover:text-green-600' : 'text-gray-300 hover:text-gray-500'} `}
                      >
                        {item.tratado ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div>{item.nome ? item.nome : <span className="text-gray-500 italic">Sem nome</span>}</div>
                      <div className="text-xs text-gray-500">#{item.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.carimboTempo).toLocaleDateString('pt-PT', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {/* Corresp: Count treated / total */}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.reconciliados.filter(t => t.tratado).length}/{item.resumo.totalReconciliado}
                      </span>
                      <span className="text-xs ml-1 text-gray-400">({formatarMoeda(item.resumo.valorReconciliado)})</span>
                    </td>
                    <td className="px-6 py-4 text-yellow-600 dark:text-yellow-500">
                      {/* Banco: Count treated / total */}
                      <span className="font-bold">
                        {item.apenasBanco.filter(t => t.tratado).length}/{item.resumo.totalApenasBanco}
                      </span>
                      <span className="text-xs opacity-70 ml-1">({formatarMoeda(item.resumo.valorApenasBanco)})</span>
                    </td>
                    <td className="px-6 py-4 text-orange-600 dark:text-orange-500">
                      {/* PHC: Count treated / total */}
                      <span className="font-bold">
                        {item.apenasContabilidade.filter(t => t.tratado).length}/{item.resumo.totalApenasContabilidade}
                      </span>
                      <span className="text-xs opacity-70 ml-1">({formatarMoeda(item.resumo.valorApenasContabilidade)})</span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {item.id === editingId ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-32 px-2 py-1 text-sm border rounded dark:bg-black/20 dark:border-white/10"
                            placeholder="Nome..."
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleSaveName(item.id)} className="text-green-600 hover:text-green-700">
                            <CheckSquare size={16} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600">
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(item.id, item.nome || '');
                          }}
                          className="text-blue-500 hover:text-blue-600"
                          title="Renomear"
                        >
                          <Edit3 size={18} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelecionarHistorico(item)}
                        className="text-[#e82127] hover:text-[#c21b20]"
                        title="Ver Detalhes"
                      >
                        <Eye size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Tem a certeza que deseja apagar este registo?')) {
                            onApagar(item.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Apagar"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {termoPesquisa ? 'Nenhum resultado encontrado para a sua pesquisa.' : 'Ainda não existem reconciliações no histórico.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card >
    </div >
  );
};
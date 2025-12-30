import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Utilizador } from '../types';

export const UsersPage: React.FC = () => {
  // Dados Simulados
  const [utilizadores] = useState<Utilizador[]>([
    { id: '1', nome: 'Elon M.', email: 'elon@tesla.com', funcao: 'admin' },
    { id: '2', nome: 'Franz von Holzhausen', email: 'franz@tesla.com', funcao: 'utilizador' },
    { id: '3', nome: 'Drew Baglino', email: 'drew@tesla.com', funcao: 'utilizador' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gestão de Utilizadores</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerir acessos e permissões</p>
        </div>
        <Button icon={<Plus size={16} />}>
          Adicionar Utilizador
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-medium text-gray-500 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Função</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {utilizadores.map((utilizador) => (
              <tr key={utilizador.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-gray-700 dark:text-white text-xs">
                      {utilizador.nome.charAt(0)}
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium">{utilizador.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{utilizador.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                    ${utilizador.funcao === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}
                  `}>
                    {utilizador.funcao}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-green-500/10 text-green-600 dark:text-green-500">
                    Ativo
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-gray-400 dark:text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
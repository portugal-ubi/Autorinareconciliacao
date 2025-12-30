import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Utilizador } from '../types';

export const UsersPage: React.FC = () => {
  // Dados Simulados
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);
  const [showModal, setShowModal] = useState(false);

  // State for new user
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaPassword, setNovaPassword] = useState('');
  const [novaFuncao, setNovaFuncao] = useState<'admin' | 'utilizador'>('utilizador');

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUtilizadores(data);
      }
    } catch (err) {
      console.error("Erro ao carregar utilizadores", err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
          password: novaPassword,
          funcao: novaFuncao
        })
      });

      if (res.ok) {
        setShowModal(false);
        setNovoNome('');
        setNovoEmail('');
        setNovaPassword('');
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar utilizador');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem a certeza que deseja apagar este utilizador?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchUsers();
      } else {
        alert('Erro ao apagar utilizador');
      }
    } catch (error) {
      alert('Erro de conexão');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gestão de Utilizadores</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerir acessos e permissões</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
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
                    <button
                      onClick={() => handleDeleteUser(utilizador.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-gray-400 dark:text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {utilizadores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nenhum utilizador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Basic Modal for New User */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Novo Utilizador</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  required
                  type="text"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={novoEmail}
                  onChange={e => setNovoEmail(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={novaPassword}
                  onChange={e => setNovaPassword(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função</label>
                <select
                  value={novaFuncao}
                  onChange={e => setNovaFuncao(e.target.value as 'admin' | 'utilizador')}
                  className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10"
                >
                  <option value="utilizador">Utilizador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
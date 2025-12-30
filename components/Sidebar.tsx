import React from 'react';
import { Pagina } from '../types';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  PieChart,
  History
} from 'lucide-react';

interface SidebarProps {
  paginaAtual: Pagina;
  onNavegar: (pagina: Pagina) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ paginaAtual, onNavegar, isAdmin, onLogout }) => {
  const itensNavegacao = [
    { pagina: Pagina.DASHBOARD, label: 'Painel', icon: <LayoutDashboard size={20} /> },
    { pagina: Pagina.UPLOAD, label: 'Importar Dados', icon: <FileText size={20} /> },
    { pagina: Pagina.VERIFICACAO, label: 'Verificação', icon: <PieChart size={20} /> },
    { pagina: Pagina.NOVA_RECON, label: 'Reconciliar', icon: <FileText size={20} /> },
    { pagina: Pagina.HISTORICO, label: 'Histórico', icon: <History size={20} /> },
    ...(paginaAtual === Pagina.RESULTADOS ? [{ pagina: Pagina.RESULTADOS, label: 'Resultados', icon: <PieChart size={20} /> }] : []),
    ...(isAdmin ? [{ pagina: Pagina.UTILIZADORES, label: 'Utilizadores', icon: <Users size={20} /> }] : []),
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-[#050505] border-r border-gray-200 dark:border-white/10 flex flex-col hidden md:flex z-50 transition-colors duration-200">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#e82127] rounded-sm flex items-center justify-center font-bold text-white text-lg">
            R
          </div>
          <h1 className="text-xl font-bold tracking-widest text-gray-900 dark:text-white">RECON<span className="text-[#e82127]">.</span></h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {itensNavegacao.map((item) => (
          <button
            key={item.pagina}
            onClick={() => onNavegar(item.pagina)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 group
              ${paginaAtual === item.pagina
                ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-l-2 border-[#e82127]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
          >
            <span className={`${paginaAtual === item.pagina ? 'text-[#e82127]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
              {item.icon}
            </span>
            <span className="font-medium tracking-wide text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium tracking-wide text-sm">Sair</span>
        </button>
        <p className="mt-6 pl-4 text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-widest font-medium">
          *made by Mauro Silva
        </p>
      </div>
    </div>
  );
};
import React from 'react';
import { Utilizador } from '../types';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useTema } from '../context/ThemeContext';

interface HeaderProps {
  utilizador: Utilizador;
  titulo: string;
}

export const Header: React.FC<HeaderProps> = ({ utilizador, titulo }) => {
  const { tema, alternarTema } = useTema();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40 transition-colors duration-200">
      <h2 className="text-xl font-medium text-gray-900 dark:text-white tracking-wide">{titulo}</h2>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Pesquisar transações..."
            className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#e82127] dark:focus:border-[#e82127] w-64 transition-colors"
          />
        </div>

        <button
          onClick={alternarTema}
          className="p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          {tema === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Bell Removed */}

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{utilizador.nome}</p>
            <p className="text-xs text-gray-500 uppercase">{utilizador.funcao}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-900 border border-gray-200 dark:border-white/20 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white">
            {utilizador.nome.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
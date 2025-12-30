import React, { useState } from 'react';
import { Utilizador } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Sun, Moon } from 'lucide-react';
import { useTema } from '../context/ThemeContext';

interface LoginPageProps {
  onLogin: (utilizador: Utilizador) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@recon.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const { tema, alternarTema } = useTema();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data);
      } else {
        alert(data.error || 'Erro ao iniciar sessão');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Erro de conexão ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] relative overflow-hidden transition-colors duration-200">
      {/* Botão de Tema no Login */}
      <button
        onClick={alternarTema}
        className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-white/10 text-gray-500 dark:text-white shadow-sm hover:shadow-md transition-all z-20"
      >
        {tema === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Decoração de Fundo */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e82127] to-transparent opacity-50"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#e82127] rounded-full filter blur-[120px] opacity-10 animate-pulse"></div>

      <Card className="w-full max-w-md p-8 z-10 border-gray-200 dark:border-white/5 shadow-xl dark:shadow-2xl bg-white dark:bg-black/40">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-[#e82127] rounded-sm flex items-center justify-center font-bold text-white text-xl mx-auto mb-4 shadow-[0_0_20px_rgba(232,33,39,0.4)]">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-gray-900 dark:text-white mb-2">RECON AUTO RINA</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sistema Seguro de Reconciliação Financeira</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Endereço de Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com"
          />

          <Input
            label="Palavra-passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-[#e82127] focus:ring-[#e82127]" />
              Lembrar-me
            </label>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-[#e82127] transition-colors">Recuperar Palavra-passe?</a>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Entrar
          </Button>
        </form>
      </Card>

      <p className="absolute bottom-4 left-4 text-gray-400 dark:text-gray-600 text-[10px] tracking-widest uppercase font-medium">
        *made by Mauro Silva
      </p>
    </div>
  );
};
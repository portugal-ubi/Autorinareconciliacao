import React from 'react';
import { Card } from '../components/Card';

interface DashboardPageProps {
  onVerNovaRecon: () => void;
  historicoRecente: any[];
  onSelecionarHistorico: (resultado: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = () => {

  const quotes = [
    {
      text: "Acredita que podes e já estás a meio do caminho.",
      author: "Theodore Roosevelt (26.º Presidente dos EUA)"
    },
    {
      text: "O futuro pertence àqueles que acreditam na beleza dos seus sonhos.",
      author: "Eleanor Roosevelt (Antiga Primeira-Dama dos EUA e ativista)"
    },
    {
      text: "Podes encontrar muitas derrotas, mas não deves ser derrotado.",
      author: "Maya Angelou (Escritora e poetisa)"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center pt-8 pb-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Bem Vindo</h1>
        <div className="h-1 w-24 bg-[#e82127] mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {quotes.map((quote, index) => (
          <Card key={index} className="h-full hover:shadow-lg transition-shadow border-t-4 border-t-[#e82127]">
            <div className="flex flex-col h-full justify-between p-4">
              <blockquote className="text-lg font-medium text-gray-700 dark:text-gray-300 italic mb-4">
                "{quote.text}"
              </blockquote>
              <cite className="text-sm text-gray-500 dark:text-gray-400 not-italic border-t border-gray-100 dark:border-white/10 pt-4 block">
                — {quote.author}
              </cite>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12 text-gray-400 text-sm">
        <p>Auto Rina - Reconciliação Bancária</p>
      </div>
    </div>
  );
};
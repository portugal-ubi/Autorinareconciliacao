import React, { useState, useEffect } from 'react';
import { Pagina, Utilizador, ResultadoReconciliacao } from './types';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UploadPage } from './pages/UploadPage';
import { VerificationPage } from './pages/VerificationPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultsPage } from './pages/ResultsPage';
import { obterHistorico } from './services/reconciliationService';

const App: React.FC = () => {
  const [utilizadorAtual, setUtilizadorAtual] = useState<Utilizador | null>(null);
  const [paginaAtual, setPaginaAtual] = useState<Pagina>(Pagina.LOGIN);
  const [historico, setHistorico] = useState<ResultadoReconciliacao[]>([]);
  const [resultadoSelecionado, setResultadoSelecionado] = useState<ResultadoReconciliacao | null>(null);

  useEffect(() => {
    if (utilizadorAtual) {
      loadHistory();
    }
  }, [utilizadorAtual, paginaAtual]); // Refresh when page changes esp. after upload

  const loadHistory = async () => {
    try {
      const data = await obterHistorico();
      setHistorico(data);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const handleLogin = (user: Utilizador) => {
    setUtilizadorAtual(user);
    setPaginaAtual(Pagina.DASHBOARD);
  };

  const handleLogout = () => {
    setUtilizadorAtual(null);
    setPaginaAtual(Pagina.LOGIN);
    setHistorico([]);
  };

  const handleVerHistorico = (resultado: ResultadoReconciliacao) => {
    setResultadoSelecionado(resultado);
    setPaginaAtual(Pagina.RESULTADOS);
  };

  // Renderizar conteúdo baseado no estado da página
  const renderizarConteudo = () => {
    if (!utilizadorAtual) {
      return <LoginPage onLogin={handleLogin} />;
    }

    switch (paginaAtual) {
      case Pagina.DASHBOARD:
        return (
          <DashboardPage
            historicoRecente={historico}
            onVerNovaRecon={() => setPaginaAtual(Pagina.UPLOAD)}
            onSelecionarHistorico={handleVerHistorico}
          />
        );
      case Pagina.UTILIZADORES:
        return <UsersPage />;
      case Pagina.UPLOAD:
        return <UploadPage />;
      case Pagina.VERIFICACAO:
        return <VerificationPage />;
      case Pagina.ANALISE:
        return <AnalysisPage />;
      case Pagina.RESULTADOS:
        if (!resultadoSelecionado) return <DashboardPage historicoRecente={historico} onVerNovaRecon={() => setPaginaAtual(Pagina.UPLOAD)} onSelecionarHistorico={handleVerHistorico} />;
        return (
          <ResultsPage
            resultado={resultadoSelecionado}
            onVoltar={() => setPaginaAtual(Pagina.DASHBOARD)}
          />
        );
      default:
        return <DashboardPage historicoRecente={historico} onVerNovaRecon={() => setPaginaAtual(Pagina.UPLOAD)} onSelecionarHistorico={handleVerHistorico} />;
    }
  };

  if (!utilizadorAtual) {
    return <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">{renderizarConteudo()}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden transition-colors duration-200">
      <Sidebar
        paginaAtual={paginaAtual}
        onNavegar={setPaginaAtual}
        isAdmin={utilizadorAtual.funcao === 'admin'}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header utilizador={utilizadorAtual} titulo={getTituloPagina(paginaAtual)} />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {renderizarConteudo()}
          </div>
        </main>
      </div>
    </div>
  );
};

function getTituloPagina(pagina: Pagina): string {
  switch (pagina) {
    case Pagina.DASHBOARD: return 'Painel de Controlo';
    case Pagina.UTILIZADORES: return 'Gestão de Utilizadores';
    case Pagina.UPLOAD: return 'Importar Movimentos';
    case Pagina.VERIFICACAO: return 'Verificação de Integridade';
    case Pagina.ANALISE: return 'Análise Global';
    case Pagina.RESULTADOS: return 'Detalhe da Reconciliação';
    default: return '';
  }
}

export default App;
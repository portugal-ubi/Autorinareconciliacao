import React, { useState } from 'react';
import { Pagina, Utilizador, ResultadoReconciliacao } from './types';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { NewReconciliationPage } from './pages/NewReconciliationPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { UploadPage } from './pages/UploadPage';
import { VerificationPage } from './pages/VerificationPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { gerarHistoricoInicial, obterHistorico, apagarReconciliacao, atualizarNomeReconciliacao } from './services/reconciliationService';
import { useEffect } from 'react';

const App: React.FC = () => {
  const [utilizadorAtual, setUtilizadorAtual] = useState<Utilizador | null>(null);
  const [paginaAtual, setPaginaAtual] = useState<Pagina>(Pagina.LOGIN);
  const [resultadoAtual, setResultadoAtual] = useState<ResultadoReconciliacao | null>(null);
  const [historicoReconciliacoes, setHistoricoReconciliacoes] = useState<ResultadoReconciliacao[]>([]);

  // Carregar histórico ao iniciar
  useEffect(() => {
    if (utilizadorAtual) {
      carregarHistorico();
    }
  }, [utilizadorAtual]);

  const carregarHistorico = async () => {
    const dados = await obterHistorico();
    setHistoricoReconciliacoes(dados);
  };

  const handleLogin = (user: Utilizador) => {
    setUtilizadorAtual(user);
    setPaginaAtual(Pagina.DASHBOARD);
  };

  const handleLogout = () => {
    setUtilizadorAtual(null);
    setPaginaAtual(Pagina.LOGIN);
    setResultadoAtual(null);
  };

  const handleReconciliacaoCompleta = (resultado: ResultadoReconciliacao) => {
    setResultadoAtual(resultado);
    // Atualizar histórico após nova reconciliação
    carregarHistorico();
    setPaginaAtual(Pagina.RESULTADOS);
  };

  const handleSelecionarHistorico = (resultado: ResultadoReconciliacao) => {
    setResultadoAtual(resultado);
    setPaginaAtual(Pagina.RESULTADOS);
  };

  const handleToggleTratadoGlobal = (id: string) => {
    setHistoricoReconciliacoes(prev => prev.map(item =>
      item.id === id ? { ...item, tratado: !item.tratado } : item
    ));
    // TODO: Persistir estado 'tratado' no backend se necessário (PUT /api/history/:id)
  };

  const handleApagarHistorico = async (id: string) => {
    try {
      await apagarReconciliacao(id);
      await carregarHistorico(); // Recarregar lista
    } catch (e) {
      alert('Erro ao apagar registo.');
    }
  };

  const handleAtualizarNome = async (id: string, nome: string) => {
    try {
      await atualizarNomeReconciliacao(id, nome);
      await carregarHistorico();
    } catch (e) {
      alert('Erro ao atualizar nome.');
    }
  };

  const handleGuardarAlteracoesResultado = (resultadoAtualizado: ResultadoReconciliacao) => {
    setHistoricoReconciliacoes(prev => prev.map(item =>
      item.id === resultadoAtualizado.id ? resultadoAtualizado : item
    ));
    setResultadoAtual(resultadoAtualizado);
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
            onVerNovaRecon={() => setPaginaAtual(Pagina.NOVA_RECON)}
            historicoRecente={historicoReconciliacoes}
            onSelecionarHistorico={handleSelecionarHistorico}
          />
        );
      case Pagina.UTILIZADORES:
        return <UsersPage />;
      case Pagina.NOVA_RECON:
        return <NewReconciliationPage onConcluir={handleReconciliacaoCompleta} />;
      case Pagina.UPLOAD:
        return <UploadPage />;
      case Pagina.VERIFICACAO:
        return <VerificationPage />;
      case Pagina.ANALISE:
        return <AnalysisPage />;
      case Pagina.RESULTADOS:
        return resultadoAtual ? (
          <ResultsPage
            resultado={resultadoAtual}
            onVoltar={() => setPaginaAtual(Pagina.HISTORICO)}
            onGuardar={handleGuardarAlteracoesResultado}
          />
        ) : (
          <DashboardPage
            onVerNovaRecon={() => setPaginaAtual(Pagina.NOVA_RECON)}
            historicoRecente={historicoReconciliacoes}
            onSelecionarHistorico={handleSelecionarHistorico}
          />
        );
      case Pagina.HISTORICO:
        return (
          <HistoryPage
            historico={historicoReconciliacoes}
            onSelecionarHistorico={handleSelecionarHistorico}
            onToggleTratado={handleToggleTratadoGlobal}
            onApagar={handleApagarHistorico}
            onAtualizarNome={handleAtualizarNome}
          />
        );
      default:
        return (
          <DashboardPage
            onVerNovaRecon={() => setPaginaAtual(Pagina.NOVA_RECON)}
            historicoRecente={historicoReconciliacoes}
            onSelecionarHistorico={handleSelecionarHistorico}
          />
        );
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
    case Pagina.NOVA_RECON: return 'Nova Reconciliação';
    case Pagina.UPLOAD: return 'Importar Movimentos';
    case Pagina.VERIFICACAO: return 'Verificação de Integridade';
    case Pagina.ANALISE: return 'Análise Global';
    case Pagina.RESULTADOS: return 'Resultados da Reconciliação';
    case Pagina.HISTORICO: return 'Histórico';
    default: return '';
  }
}

export default App;
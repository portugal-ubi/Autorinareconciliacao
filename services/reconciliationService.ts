import { Transacao, ResultadoReconciliacao } from '../types';

const API_URL = '/api';

export const lerFicheiroExcel = async (file: File): Promise<any> => {
  // Just a helper to show preview if needed, but actual processing is on backend now.
  // We can keep this simple or just return file since backend does the heavy lifting.
  // For now, let's keep it to allow UI to show something before upload if needed,
  // BUT the actual reconciliation must use the backend.
  return new Promise((resolve, reject) => {
    // This function might be deprecated or used just for preview.
    // Let's return a dummy placeholder or minimal parse if needed.
    // Given the requirement to move logic to backend, we should trust the backend response.
    resolve([]);
  });
};

export const processarReconciliacao = async (
  fileBanco: File,
  fileContabilidade: File
): Promise<ResultadoReconciliacao> => {
  const formData = new FormData();
  formData.append('banco', fileBanco);
  formData.append('phc', fileContabilidade);

  try {
    const response = await fetch(`${API_URL}/reconcile`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro na reconciliação: ${response.statusText}`);
    }

    const data: ResultadoReconciliacao = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao chamar API:", error);
    throw error;
  }
};

// Gera histórico inicial para popular o dashboard (Mock Data for UI testing/demo)
export const gerarHistoricoInicial = (): ResultadoReconciliacao[] => {
  // Keep existing mock data generation for Dashboard visual population if backend is empty
  // ... (Similar to previous implementation, keeping it for UI robustness)
  const historico: ResultadoReconciliacao[] = [];
  for (let i = 1; i <= 3; i++) {
    const data = new Date();
    data.setDate(data.getDate() - i);

    const apenasBanco = gerarDadosSimulados(5 + i, 0);
    const apenasContabilidade = gerarDadosSimulados(2 + i, 0);
    const reconciliados = [];
    for (let j = 0; j < 5; j++) {
      reconciliados.push({
        id: `rec-${i}-${j}`,
        valor: 100 * j + 50,
        dataBanco: data.toISOString().split('T')[0],
        dataContabilidade: data.toISOString().split('T')[0],
        descBanco: `Movimento Banco ${j}`,
        descContabilidade: `Movimento PHC ${j}`,
        tratado: j % 2 === 0
      });
    }

    historico.push({
      id: `hist-${i}`,
      reconciliados: reconciliados,
      apenasBanco: apenasBanco,
      apenasContabilidade: apenasContabilidade,
      resumo: {
        totalReconciliado: reconciliados.length,
        totalApenasBanco: apenasBanco.length,
        totalApenasContabilidade: apenasContabilidade.length,
        valorReconciliado: reconciliados.reduce((acc, curr) => acc + curr.valor, 0),
        valorApenasBanco: apenasBanco.reduce((acc, curr) => acc + curr.valor, 0),
        valorApenasContabilidade: apenasContabilidade.reduce((acc, curr) => acc + curr.valor, 0),
      },
      carimboTempo: data.toISOString(),
      tratado: i > 1
    });
  }
  return historico;
};

export const gerarDadosSimulados = (quantidade: number, variancia: number): Transacao[] => {
  const dados: Transacao[] = [];
  const descricoes = ['Transferência', 'Pagamento', 'Taxa de Serviço', 'Fatura #123', 'Depósito', 'Levantamento'];

  for (let i = 0; i < quantidade; i++) {
    const valor = Math.floor(Math.random() * 1000) + 50;
    dados.push({
      id: Math.random().toString(36).substr(2, 9),
      data: new Date().toISOString().split('T')[0],
      descricao: descricoes[Math.floor(Math.random() * descricoes.length)],
      valor: parseFloat(valor.toFixed(2)),
      tratado: false
    });
  }
  return dados;
};
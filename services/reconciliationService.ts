import { ResultadoReconciliacao } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const lerFicheiroExcel = async (file: File): Promise<any> => {
  return new Promise((resolve) => resolve([]));
};

export const processarReconciliacao = async (
  fileBanco: File,
  fileContabilidade: File
): Promise<ResultadoReconciliacao> => {
  const formData = new FormData();
  formData.append('banco', fileBanco);
  formData.append('phc', fileContabilidade);

  try {
    const response = await fetch(`${API_URL}/api/reconcile`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erro na reconciliação: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao chamar API:", error);
    throw error;
  }
};

export const obterHistorico = async (): Promise<ResultadoReconciliacao[]> => {
  try {
    const response = await fetch(`${API_URL}/api/history`);
    if (!response.ok) {
      throw new Error('Erro ao obter histórico');
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao obter histórico:", error);
    return [];
  }
};

export const apagarReconciliacao = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/history/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erro ao apagar reconciliação');
  }
};

export const gerarHistoricoInicial = (): ResultadoReconciliacao[] => {
  return [];
};

export const atualizarNomeReconciliacao = async (id: string, nome: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/history/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome }),
  });

  if (!response.ok) {
    throw new Error('Erro ao atualizar nome da reconciliação');
  }
};
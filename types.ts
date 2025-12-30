export interface Utilizador {
  id: string;
  nome: string;
  email: string;
  funcao: 'admin' | 'utilizador';
}

export interface Transacao {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  referencia?: string;
  tratado?: boolean; // Novo: controlo individual
}

export interface TransacaoCorrespondida {
  id: string;
  valor: number;
  dataBanco: string;
  dataContabilidade: string;
  descBanco: string;
  descContabilidade: string;
  tratado?: boolean; // Novo: controlo individual
}

export interface ResultadoReconciliacao {
  id: string;
  reconciliados: TransacaoCorrespondida[];
  apenasBanco: Transacao[];
  apenasContabilidade: Transacao[];
  resumo: {
    totalReconciliado: number;
    totalApenasBanco: number;
    totalApenasContabilidade: number;
    valorReconciliado: number;
    valorApenasBanco: number;
    valorApenasContabilidade: number;
  };
  carimboTempo: string;
  tratado: boolean; // Estado geral da reconciliação
  nome?: string; // Nome personalizado para identificação
}

export enum Pagina {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  UTILIZADORES = 'UTILIZADORES',
  UPLOAD = 'UPLOAD',
  VERIFICACAO = 'VERIFICACAO',
  ANALISE = 'ANALISE'
}
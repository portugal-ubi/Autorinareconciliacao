import * as XLSX from 'xlsx';

export interface Transacao {
    id: string;
    data: string;
    descricao: string;
    valor: number;
    tratado: boolean;
    notas?: string;
    originalRow?: any;
}

interface TransacaoCorrespondida {
    id: string;
    bankId: string;
    phcId: string;
    valor: number;
    dataBanco: string;
    dataContabilidade: string;
    descBanco: string;
    descContabilidade: string;
    tratado: boolean;
    notas?: string;
}

interface ResultadoReconciliacao {
    id: string;
    reconciliados: TransacaoCorrespondida[];
    apenasBanco: Transacao[];
    apenasContabilidade: Transacao[];
    resumo: any;
    carimboTempo: string;
    tratado: boolean;
}

export const parseExcel = (buffer: Buffer): Transacao[] => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to array of arrays to inspect structure first
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Detect format
    let headerRowIndex = 0;
    let type = 'generic'; // 'generic', 'bank_novo', 'phc_novo'


    // Look for Bank specific headers
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const rowStr = JSON.stringify(rawData[i]);
        if (rowStr.includes('Data de Movimento') && rowStr.includes('Montante')) {
            headerRowIndex = i;
            type = 'bank_novo';
            break;
        }
        // PHC Detection (Dezembro.xlsx)
        // Headers: "Documento", "Data      ", "Saldo               " (lots of whitespace)
        // We look for 'Saldo' and 'Data' roughly
        if (rowStr.includes('Saldo') && rowStr.includes('Data') && rowStr.includes('Documento')) {
            headerRowIndex = i;
            type = 'phc_dezembro';
            break;
        }
    }

    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false, range: headerRowIndex });

    return jsonData.map((row, index) => {
        let data = '';
        let descricao = 'Sem descrição';
        let valor: number = 0;

        // Clean keys for PHC (trim whitespace)
        if (type === 'phc_dezembro') {
            const cleanRow: any = {};
            Object.keys(row).forEach(k => {
                cleanRow[k.trim()] = row[k];
            });

            // Map PHC fields
            // Data format: 02.01.2025
            data = cleanRow['Data'] || '';
            const desc = cleanRow['Descricao'] || cleanRow['Descrição'] || '';
            const motivo = cleanRow['Movimento'] || ''; // e.g. "Talão de Depósito"

            // Combine fields for better description
            descricao = `${motivo} ${desc}`.trim();
            if (descricao === '') descricao = 'Sem descrição';

            // Value is in 'Saldo'
            valor = cleanValue(cleanRow['Saldo']);

        } else if (type === 'bank_novo') {
            // Bank Format: Data de Movimento | Descrição | Montante | D/C
            data = row['Data de Movimento'] || new Date().toISOString();
            descricao = row['Descrição'] || 'Sem descrição';

            let rawVal = cleanValue(row['Montante']);
            const dc = row['D/C'];
            if (dc === 'D') {
                valor = -Math.abs(rawVal);
            } else {
                valor = Math.abs(rawVal);
            }
        } else {
            // Generic / Legacy Logic
            // PHC often has 'Entidade' which is better than 'Descrição'
            data = row['Data'] || row['Date'] || row['Movimento'] || row['data'] || new Date().toISOString();

            const desc = row['Descrição'] || row['Descricao'] || row['Description'] || row['Histórico'] || row['Historico'];
            const entidade = row['Entidade'];

            if (entidade) {
                descricao = `${entidade} ${desc ? '(' + desc + ')' : ''}`.trim();
            } else {
                descricao = desc || 'Sem descrição';
            }

            if (row['Valor'] !== undefined) valor = cleanValue(row['Valor']);
            else if (row['Amount'] !== undefined) valor = cleanValue(row['Amount']);
            else if (row['Montante'] !== undefined) valor = cleanValue(row['Montante']);
            else {
                const debito = row['Débito'] || row['Debito'] || row['Debit'] || 0;
                const credito = row['Crédito'] || row['Credito'] || row['Credit'] || 0;
                valor = cleanValue(credito) - cleanValue(debito);
                if (valor === 0 && (debito !== 0 || credito !== 0)) {
                    valor = cleanValue(credito) || (cleanValue(debito) * -1);
                }
            }
        }

        // Normalize Date (DD.MM.YYYY handling)
        try {
            if (typeof data === 'string') {
                data = data.trim();
                if (data.includes('/')) {
                    const parts = data.split('/');
                    if (parts.length === 3) {
                        data = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                } else if (data.includes('.')) {
                    // Check for DD.MM.YYYY
                    const parts = data.split('.');
                    if (parts.length === 3) {
                        data = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
            }
            const dateObj = new Date(data);
            if (!isNaN(dateObj.getTime())) data = dateObj.toISOString().split('T')[0];
        } catch (e) { /* ignore */ }

        // Final validation
        if (!data || data.trim() === '' || data.includes('.  .')) return null;
        const finalDate = new Date(data);
        if (isNaN(finalDate.getTime())) return null;

        return {
            id: `row-${index}-${Math.random().toString(36).substr(2, 5)}`,
            data: data,
            descricao: String(descricao).trim(),
            valor: Number(valor),
            tratado: false,
            originalRow: row
        };
    }).filter(t => t !== null && t.valor !== 0) as Transacao[];
};

export const cleanValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        let clean = val.replace(/[€$ ]/g, '');
        if (clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g, '').replace(',', '.');
        else if (clean.includes(',')) clean = clean.replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

export const matchTransactions = (dadosBanco: Transacao[], dadosContabilidade: Transacao[]): ResultadoReconciliacao => {
    const reconciliados: TransacaoCorrespondida[] = [];
    const apenasBanco: Transacao[] = [];
    // Mutable copy
    const poolContabilidade = [...dadosContabilidade];

    const sortDate = (a: Transacao, b: Transacao) => new Date(a.data).getTime() - new Date(b.data).getTime();
    dadosBanco.sort(sortDate);
    poolContabilidade.sort(sortDate);

    dadosBanco.forEach(txBanco => {
        const dataBancoMs = new Date(txBanco.data).getTime();
        const TOLERANCE_DAYS = 15;
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const MAX_DIFF_MS = TOLERANCE_DAYS * MS_PER_DAY;

        // 1. Exact Value Match (+/- 0.01) AND Date Tolerance
        let candidatos = poolContabilidade
            .map((tx, index) => ({ tx, index }))
            .filter(item => {
                const valMatch = Math.abs(item.tx.valor - txBanco.valor) < 0.01;
                if (!valMatch) return false;

                const dataPhcMs = new Date(item.tx.data).getTime();
                const diffMs = Math.abs(dataPhcMs - dataBancoMs);
                return diffMs <= MAX_DIFF_MS;
            });

        // 2. Fallback: Absolute Value Match? 
        // Only if exact match failed. But be careful. 
        // If the bank has -100 and PHC has 100, is it a match? 
        // Usually NO, unless it's a correction. 
        // Let's REMOVE the absolute value fallback 
        // or make it very specific (maybe user wants it?). 
        // Given user complaint about "bad calculation", let's be stricter.
        // If they want to match signs reversed, they usually explicitly ask.
        // I will commented out the absolute fallback for now or remove it.

        /* 
        if (candidatos.length === 0) {
           // Old logic checked Math.abs(abs(a) - abs(b)).
           // This implies -100 matches 100. This is risky.
        } 
        */

        if (candidatos.length > 0) {
            // Tie-breaker: Date proximity
            let melhorMatch = candidatos[0];
            if (candidatos.length > 1) {
                candidatos.sort((a, b) => {
                    const diffA = Math.abs(new Date(a.tx.data).getTime() - dataBancoMs);
                    const diffB = Math.abs(new Date(b.tx.data).getTime() - dataBancoMs);
                    return diffA - diffB;
                });
                melhorMatch = candidatos[0];
            }

            reconciliados.push({
                id: `${txBanco.id}||${melhorMatch.tx.id}`,
                bankId: txBanco.id,
                phcId: melhorMatch.tx.id,
                valor: txBanco.valor,
                dataBanco: txBanco.data,
                dataContabilidade: melhorMatch.tx.data,
                descBanco: txBanco.descricao,
                descContabilidade: melhorMatch.tx.descricao,
                tratado: txBanco.tratado && melhorMatch.tx.tratado,
                notas: txBanco.notas || melhorMatch.tx.notas
            });

            // Remove matched item from pool
            const indexReal = poolContabilidade.indexOf(melhorMatch.tx);
            if (indexReal > -1) poolContabilidade.splice(indexReal, 1);
        } else {
            apenasBanco.push(txBanco);
        }
    });

    const apenasContabilidade = poolContabilidade;

    return {
        id: Math.random().toString(36).substr(2, 9),
        reconciliados,
        apenasBanco,
        apenasContabilidade,
        resumo: {
            totalReconciliado: reconciliados.length,
            totalApenasBanco: apenasBanco.length,
            totalApenasContabilidade: apenasContabilidade.length,
            valorReconciliado: reconciliados.reduce((s, i) => s + i.valor, 0),
            valorApenasBanco: apenasBanco.reduce((s, i) => s + i.valor, 0),
            valorApenasContabilidade: apenasContabilidade.reduce((s, i) => s + i.valor, 0),
        },
        carimboTempo: new Date().toISOString(),
        tratado: false
    };
};

export const processReconciliation = async (bancoBuffer: Buffer, phcBuffer: Buffer): Promise<ResultadoReconciliacao> => {
    const dadosBanco = parseExcel(bancoBuffer);
    const dadosContabilidade = parseExcel(phcBuffer);
    return matchTransactions(dadosBanco, dadosContabilidade);
};

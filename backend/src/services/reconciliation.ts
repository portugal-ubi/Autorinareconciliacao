import * as XLSX from 'xlsx';

interface Transacao {
    id: string;
    data: string;
    descricao: string;
    valor: number;
    tratado: boolean;
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
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    return jsonData.map((row, index) => {
        let data = row['Data'] || row['Date'] || row['Movimento'] || row['data'] || new Date().toISOString();
        const descricao = row['Descrição'] || row['Descricao'] || row['Description'] || row['Histórico'] || row['Historico'] || 'Sem descrição';
        let valor: number = 0;

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

        // Normalize Date
        try {
            if (typeof data === 'string' && data.includes('/')) {
                const parts = data.split('/');
                if (parts.length === 3) data = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            const dateObj = new Date(data);
            if (!isNaN(dateObj.getTime())) data = dateObj.toISOString().split('T')[0];
        } catch (e) { /* ignore */ }

        return {
            id: `row-${index}-${Math.random().toString(36).substr(2, 5)}`,
            data: data,
            descricao: String(descricao),
            valor: Number(valor),
            tratado: false,
            originalRow: row
        };
    }).filter(t => t.valor !== 0);
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
        // 1. Exact Match Check (+/- 0.01 tolerance)
        let candidatos = poolContabilidade
            .map((tx, index) => ({ tx, index }))
            .filter(item => Math.abs(item.tx.valor - txBanco.valor) < 0.01);

        // 2. Robust Absolute Value Check (If no exact match found)
        if (candidatos.length === 0) {
            candidatos = poolContabilidade
                .map((tx, index) => ({ tx, index }))
                .filter(item => Math.abs(Math.abs(item.tx.valor) - Math.abs(txBanco.valor)) < 0.01);
        }

        if (candidatos.length > 0) {
            // Tie-breaker: Date proximity
            let melhorMatch = candidatos[0];
            if (candidatos.length > 1) {
                const dataBancoMs = new Date(txBanco.data).getTime();
                candidatos.sort((a, b) => {
                    const diffA = Math.abs(new Date(a.tx.data).getTime() - dataBancoMs);
                    const diffB = Math.abs(new Date(b.tx.data).getTime() - dataBancoMs);
                    return diffA - diffB;
                });
                melhorMatch = candidatos[0];
            }

            id: `${txBanco.id}||${melhorMatch.tx.id}`, // Use separator that won't conflict with UUIDs easily, or better yet, rely on explicit IDs
                bankId: txBanco.id,
                    phcId: melhorMatch.tx.id,
                        valor: txBanco.valor,
                            dataBanco: txBanco.data,
                                dataContabilidade: melhorMatch.tx.data,
                                    descBanco: txBanco.descricao,
                                        descContabilidade: melhorMatch.tx.descricao,
                                            tratado: txBanco.tratado && melhorMatch.tx.tratado // Consider treated only if both are treated

            // Remove matched item from pool using original reference/index
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

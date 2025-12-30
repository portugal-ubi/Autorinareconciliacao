import { AppDataSource } from "..";
import { BankTransaction } from "../entities/BankTransaction";
import { PhcTransaction } from "../entities/PhcTransaction";
import { parseExcel, matchTransactions } from "./reconciliation";
import * as crypto from 'crypto';

const generateHash = (date: string, amount: number, desc: string): string => {
    return crypto.createHash('md5').update(`${date}|${amount}|${desc}`).digest('hex');
};

export const transactionService = {
    async uploadBank(buffer: Buffer, originalFilename: string) {
        const repo = AppDataSource.getRepository(BankTransaction);
        const transactions = parseExcel(buffer);
        let added = 0;
        let skipped = 0;

        for (const t of transactions) {
            const hash = generateHash(t.data, t.valor, t.descricao);

            // Check if exists
            const exists = await repo.findOneBy({ hash });
            if (!exists) {
                const newTx = new BankTransaction();
                newTx.data = t.data;
                newTx.valor = t.valor;
                newTx.descricao = t.descricao;
                newTx.hash = hash;
                newTx.arquivo_origem = originalFilename;
                await repo.save(newTx);
                added++;
            } else {
                skipped++;
            }
        }
        return { added, skipped, total: transactions.length };
    },

    async uploadPhc(buffer: Buffer, originalFilename: string) {
        const repo = AppDataSource.getRepository(PhcTransaction);
        const transactions = parseExcel(buffer);
        let added = 0;
        let skipped = 0;

        for (const t of transactions) {
            const hash = generateHash(t.data, t.valor, t.descricao);

            const exists = await repo.findOneBy({ hash });
            if (!exists) {
                const newTx = new PhcTransaction();
                newTx.data = t.data;
                newTx.valor = t.valor;
                newTx.descricao = t.descricao;
                newTx.hash = hash;
                newTx.arquivo_origem = originalFilename;
                await repo.save(newTx);
                added++;
            } else {
                skipped++;
            }
        }
        return { added, skipped, total: transactions.length };
    },

    async getStatus(year?: number) {
        const bankRepo = AppDataSource.getRepository(BankTransaction);
        const phcRepo = AppDataSource.getRepository(PhcTransaction);

        let bankQuery = bankRepo.createQueryBuilder("bank");
        let phcQuery = phcRepo.createQueryBuilder("phc");

        if (year) {
            bankQuery = bankQuery.where("YEAR(bank.data) = :year", { year });
            phcQuery = phcQuery.where("YEAR(phc.data) = :year", { year });
        }

        const bankStats = await bankQuery
            .select("MIN(bank.data)", "minDate")
            .addSelect("MAX(bank.data)", "maxDate")
            .addSelect("COUNT(*)", "count")
            .getRawOne();

        const phcStats = await phcQuery
            .select("MIN(phc.data)", "minDate")
            .addSelect("MAX(phc.data)", "maxDate")
            .addSelect("COUNT(*)", "count")
            .getRawOne();

        return { bank: bankStats, phc: phcStats };
    },

    async reconcileGlobal(startDate: string, endDate: string) {
        // Fetch data
        const bankRepo = AppDataSource.getRepository(BankTransaction);
        const phcRepo = AppDataSource.getRepository(PhcTransaction);

        const bankTx = await bankRepo.createQueryBuilder("t")
            .where("t.data BETWEEN :start AND :end", { start: startDate, end: endDate })
            .getMany();

        const phcTx = await phcRepo.createQueryBuilder("t")
            .where("t.data BETWEEN :start AND :end", { start: startDate, end: endDate })
            .getMany();

        // Convert to common format expected by reconciliation logic
        // We need to map entities to the interface used in reconciliation.ts, 
        // BUT reconciliation.ts uses 'parseExcel' result which is 'Transacao'.
        // Let's manually map or cast.

        const mapToTransacao = (item: any) => ({
            id: item.id, // Use UUID from DB
            data: typeof item.data === 'string' ? item.data : item.data.toISOString().split('T')[0],
            descricao: item.descricao,
            valor: Number(item.valor),
            tratado: false,
            originalRow: item
        });

        const dadosBanco = bankTx.map(mapToTransacao);
        const dadosContabilidade = phcTx.map(mapToTransacao);

        return matchTransactions(dadosBanco, dadosContabilidade);
    },

    async verify(type: 'bank' | 'phc', buffer: Buffer) {
        const repo = type === 'bank' ? AppDataSource.getRepository(BankTransaction) : AppDataSource.getRepository(PhcTransaction);
        const fileData = parseExcel(buffer);

        // Find existing range covered by file to optimize query? 
        // Or just check each hash? Checking each hash is safer for now.

        const missingInDb = [];
        const extraInDb = []; // This is harder because we need to know the range of the file.

        // For "Missing in DB", we check if file rows exist in DB.
        for (const row of fileData) {
            const hash = generateHash(row.data, row.valor, row.descricao);
            const exists = await repo.findOneBy({ hash });
            if (!exists) {
                missingInDb.push(row);
            }
        }

        // For "Extra in DB" (Present in DB but missing in File for the same period)
        // We need to determine the date range of the file.
        if (fileData.length > 0) {
            const dates = fileData.map(d => new Date(d.data).getTime());
            const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
            const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];

            // Fetch all DB records in this range
            const dbRecords = await repo.createQueryBuilder("t")
                .where("t.data >= :minDate AND t.data <= :maxDate", { minDate, maxDate })
                .getMany();

            for (const dbRow of dbRecords) {
                const dbHash = dbRow.hash;
                // Check if this hash exists in the processed fileData (we need to re-hash file data or keep a Set)
                // Let's create a Set of file hashes for O(1) lookup
                const fileHashes = new Set(fileData.map(r => generateHash(r.data, r.valor, r.descricao)));

                if (!fileHashes.has(dbHash)) {
                    extraInDb.push(dbRow);
                }
            }
        }

        return {
            missingInDb,
            extraInDb
        };
    },

    async importTransactions(type: 'bank' | 'phc', transactions: any[]) {
        const repo = type === 'bank' ? AppDataSource.getRepository(BankTransaction) : AppDataSource.getRepository(PhcTransaction);
        let imported = 0;

        for (const t of transactions) {
            const hash = generateHash(t.data, t.valor, t.descricao);

            // Double check existence to avoid duplicates if user clicks twice
            const exists = await repo.findOneBy({ hash });

            if (!exists) {
                const newTx = type === 'bank' ? new BankTransaction() : new PhcTransaction();
                newTx.data = t.data;
                newTx.valor = t.valor;
                newTx.descricao = t.descricao;
                newTx.hash = hash;
                newTx.arquivo_origem = 'Importado via Verificação';

                await repo.save(newTx);
                imported++;
            }
        }
        return { imported };
    },

    async updateStatus(type: 'bank' | 'phc', ids: string[], tratado: boolean) {
        const repo = type === 'bank' ? AppDataSource.getRepository(BankTransaction) : AppDataSource.getRepository(PhcTransaction);

        if (ids.length === 0) return { updated: 0 };

        const result = await repo.createQueryBuilder()
            .update()
            .set({ tratado: tratado })
            .where("id IN (:...ids)", { ids })
            .execute();

        return { updated: result.affected };
    }
};

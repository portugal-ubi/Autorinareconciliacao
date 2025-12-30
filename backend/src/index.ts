import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { DataSource } from 'typeorm';
import { processReconciliation } from './services/reconciliation';
import { Reconciliation } from './entities/Reconciliation';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database Setup
export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "db",
    port: 3306,
    username: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "recon_db",
    synchronize: true, // Auto-create tables (dev only)
    logging: false,
    entities: [Reconciliation],
    subscribers: [],
    migrations: [],
});

const upload = multer({ storage: multer.memoryStorage() });

// 1. RECONCILE & SAVE
app.post('/api/reconcile', upload.fields([{ name: 'banco' }, { name: 'phc' }]), async (req, res) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files['banco'] || !files['phc']) {
            return res.status(400).json({ error: 'Both files are required' });
        }

        const bancoBuffer = files['banco'][0].buffer;
        const phcBuffer = files['phc'][0].buffer;

        // Process logic
        const results = await processReconciliation(bancoBuffer, phcBuffer);

        // Save to DB
        const reconRepo = AppDataSource.getRepository(Reconciliation);
        const newRecon = new Reconciliation();
        newRecon.id = results.id; // Use generated ID or let DB generate? Logic uses random ID, lets keep it for now but UUID is better. 
        // Actually, let's let DB generate UUID if possible, but our frontend expects ID in result. 
        // Let's overwrite the random ID with the one DB will give or just use the one we generated.
        // For simplicity, we use the ID from the logic (which is random string), but we defined UUID in entity.
        // Let's rely on logic ID for now but mapped to string column, OR generic UUID.
        // Wait, entity has @PrimaryGeneratedColumn("uuid"). logic generates `Math.random...`.
        // Let's let TypeORM generate the ID and update the result object.

        newRecon.summary = results.resumo;
        newRecon.data = results; // Store full object
        newRecon.tratado = false;

        const saved = await reconRepo.save(newRecon);

        // Return the saved object structure (which might have a new UUID if we omitted it)
        // Ensure result.id matches saved.id
        results.id = saved.id;

        res.json(results);
    } catch (error) {
        console.error("Error processing reconciliation:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. GET HISTORY
app.get('/api/history', async (req, res) => {
    try {
        const reconRepo = AppDataSource.getRepository(Reconciliation);
        const history = await reconRepo.find({
            order: { timestamp: 'DESC' }
        });

        // Map back to the expected frontend structure if needed, or just return the full data blob
        // The frontend expects a list of `ResultadoReconciliacao`.
        // Our `data` column holds exactly that.
        const mappedHistory = history.map(h => ({
            ...h.data,
            id: h.id, // Ensure top-level ID is the DB ID
            // We might want to sync 'tratado' status if it changed
            tratado: h.tratado,
            nome: h.name // Map DB name to frontend 'nome'
        }));

        res.json(mappedHistory);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. DELETE HISTORY
app.delete('/api/history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reconRepo = AppDataSource.getRepository(Reconciliation);
        const result = await reconRepo.delete(id);

        if (result.affected === 0) {
            return res.status(404).json({ error: 'Reconciliation not found' });
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("Error deleting history:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. UPDATE NAME
app.patch('/api/history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome } = req.body; // Expect 'nome' from frontend

        const reconRepo = AppDataSource.getRepository(Reconciliation);
        const recon = await reconRepo.findOneBy({ id });

        if (!recon) {
            return res.status(404).json({ error: 'Reconciliation not found' });
        }

        recon.name = nome;
        await reconRepo.save(recon);

        res.json({ message: 'Updated successfully', nome: recon.name });
    } catch (error) {
        console.error("Error updating history:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err);
    });

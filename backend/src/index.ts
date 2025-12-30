import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { DataSource } from 'typeorm';
import { processReconciliation } from './services/reconciliation';

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
    synchronize: true, // Use carefully in production
    logging: false,
    entities: [], // We will add entities later if needed, for now we might handle data in memory or simple structures
    subscribers: [],
    migrations: [],
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/reconcile', upload.fields([{ name: 'banco' }, { name: 'phc' }]), async (req, res) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files['banco'] || !files['phc']) {
            return res.status(400).json({ error: 'Both files are required' });
        }

        const bancoBuffer = files['banco'][0].buffer;
        const phcBuffer = files['phc'][0].buffer;

        const results = await processReconciliation(bancoBuffer, phcBuffer);

        res.json(results);
    } catch (error) {
        console.error("Error processing reconciliation:", error);
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

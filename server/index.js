import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Create tables
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT
);`);

db.exec(`CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  data TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);`);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Register
app.post('/api/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, password, name);
        res.json({ message: 'User registered successfully', user: { id: result.lastInsertRowid, email, name } });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'User already exists' });
        }
        return res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const user = db.prepare('SELECT id, email, name, password FROM users WHERE email = ?').get(email);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get User Model
app.get('/api/models', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    try {
        const row = db.prepare('SELECT data, updated_at FROM models WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(userId);
        if (row && row.data) {
            res.json({ model: JSON.parse(row.data), updatedAt: row.updated_at });
        } else {
            res.json({ model: null, updatedAt: null });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Save User Model
app.post('/api/models', (req, res) => {
    const { userId, modelData } = req.body;
    if (!userId || !modelData) {
        return res.status(400).json({ error: 'User ID and model data required' });
    }
    try {
        const dataStr = JSON.stringify(modelData);
        const existing = db.prepare('SELECT id FROM models WHERE user_id = ?').get(userId);
        if (existing) {
            db.prepare('UPDATE models SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(dataStr, userId);
        } else {
            db.prepare('INSERT INTO models (user_id, data) VALUES (?, ?)').run(userId, dataStr);
        }
        res.json({ message: 'Model saved successfully' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err.message);
});

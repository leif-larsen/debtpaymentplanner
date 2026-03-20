import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'db.sqlite')

// Ensure the data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS debts (
    id                      TEXT PRIMARY KEY,
    debt_type               TEXT NOT NULL DEFAULT 'installment',
    name                    TEXT NOT NULL,
    balance                 REAL NOT NULL,
    interest_rate           REAL NOT NULL,
    minimum_payment_percent REAL,
    minimum_payment         REAL NOT NULL,
    monthly_payment         REAL NOT NULL,
    start_date              TEXT NOT NULL,
    notes                   TEXT,
    color                   TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id       TEXT PRIMARY KEY,
    debt_id  TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    date     TEXT NOT NULL,
    amount   REAL NOT NULL,
    type     TEXT NOT NULL CHECK (type IN ('payment', 'charge')),
    note     TEXT
  );
`)

export default db

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize the database in the project root
const dbPath = path.join(process.cwd(), 'app.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('journal_mode = WAL');

// Initialize schema if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    accessToken TEXT,
    refreshToken TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ProcessedEmails (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    processedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES Users(id)
  );
`);

export default db;

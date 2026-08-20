import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        accessToken TEXT,
        refreshToken TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ProcessedEmails (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        messageId VARCHAR(255) NOT NULL,
        processedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES Users(id)
      );
    `);
    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
};

export default pool;

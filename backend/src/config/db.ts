import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../../database.sqlite');

// Verbose mode for better debugging
const sqlite = sqlite3.verbose();

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Promisified query helper (for SELECT returns multiple rows)
export const query = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

// Promisified get helper (for SELECT returns a single row)
export const get = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
};

// Promisified run helper (for INSERT, UPDATE, DELETE)
export const run = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Database Initialization Flow
export const initDatabase = async (): Promise<void> => {
  // Create applications table
  await run(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL,
      applied_date TEXT NOT NULL,
      note TEXT
    )
  `);

  // Check if applications table is empty to seed initial data
  const countRow = await get<{ count: number }>('SELECT COUNT(*) as count FROM applications');
  if (countRow && countRow.count === 0) {
    console.log('Applications table is empty. Seeding initial mock data...');
    const seedData = [
      {
        id: 'app-1',
        company_name: 'Google',
        position: 'Frontend Engineer',
        status: 'applied',
        applied_date: '2026-07-10',
        note: 'Applied through referral. Waiting for HR response.'
      },
      {
        id: 'app-2',
        company_name: 'Meta',
        position: 'React Developer',
        status: 'interview',
        applied_date: '2026-07-08',
        note: 'Passed OA. Tech screen scheduled for next Monday.'
      },
      {
        id: 'app-3',
        company_name: 'TSMC',
        position: 'Software Engineer',
        status: 'offer',
        applied_date: '2026-07-01',
        note: 'Received official offer letter. Package under review.'
      },
      {
        id: 'app-4',
        company_name: 'Microsoft',
        position: 'Full Stack Developer',
        status: 'rejected',
        applied_date: '2026-06-25',
        note: 'Resume screening rejected. Try again in 6 months.'
      },
      {
        id: 'app-5',
        company_name: 'Netflix',
        position: 'Senior UI Engineer',
        status: 'applied',
        applied_date: '2026-07-12',
        note: 'Applied online via career portal.'
      }
    ];

    for (const app of seedData) {
      await run(
        `INSERT INTO applications (id, company_name, position, status, applied_date, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [app.id, app.company_name, app.position, app.status, app.applied_date, app.note]
      );
    }
    console.log('Database successfully seeded with 5 mock applications.');
  }
};

export default db;

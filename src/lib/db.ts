import fs from 'fs';
import path from 'path';

export const DATA_FILE = path.join(process.cwd(), 'data.json');

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  rating: number;
  voterName: string;
  sessionId: string;
  ipAddress: string;
  teamId: string;
  createdAt: string;
}

export interface Database {
  users: User[];
  teams: Team[];
  votes: Vote[];
}

// In-memory cache to prevent constant disk reads
let dbCache: Database | null = null;
let lastModified: number = 0;

export function getDb(): Database {
  try {
    const stats = fs.statSync(DATA_FILE);
    if (dbCache && stats.mtimeMs === lastModified) {
      return dbCache;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    dbCache = JSON.parse(data);
    lastModified = stats.mtimeMs;
    return dbCache!;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const defaultDb: Database = { users: [], teams: [], votes: [] };
      saveDb(defaultDb);
      return defaultDb;
    }
    throw err;
  }
}

export function saveDb(data: Database) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  dbCache = data;
  lastModified = fs.statSync(DATA_FILE).mtimeMs;
}

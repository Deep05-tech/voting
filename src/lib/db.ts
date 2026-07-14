import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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

let cachedDb: Database | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5000; // 5 seconds cache

async function getDoc() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID as string, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

export async function getDb(): Promise<Database> {
  const now = Date.now();
  if (cachedDb && (now - lastFetchTime) < CACHE_TTL) {
    return JSON.parse(JSON.stringify(cachedDb)); // return deep copy
  }

  const doc = await getDoc();
  
  const usersSheet = doc.sheetsByTitle['Users'];
  const teamsSheet = doc.sheetsByTitle['Teams'];
  const votesSheet = doc.sheetsByTitle['Votes'];

  const userRows = usersSheet ? await usersSheet.getRows() : [];
  const teamRows = teamsSheet ? await teamsSheet.getRows() : [];
  const voteRows = votesSheet ? await votesSheet.getRows() : [];

  const users: User[] = userRows.map(r => ({
    id: r.get('id'),
    name: r.get('name'),
    username: r.get('username'),
    password: r.get('password'),
    isAdmin: r.get('isAdmin') === 'true' || r.get('isAdmin') === 'TRUE',
    createdAt: r.get('createdAt')
  }));

  const teams: Team[] = teamRows.map(r => ({
    id: r.get('id'),
    name: r.get('name'),
    createdAt: r.get('createdAt')
  }));

  const votes: Vote[] = voteRows.map(r => ({
    id: r.get('id'),
    rating: parseInt(r.get('rating') || '0', 10),
    voterName: r.get('voterName'),
    sessionId: r.get('sessionId'),
    ipAddress: r.get('ipAddress'),
    teamId: r.get('teamId'),
    createdAt: r.get('createdAt')
  }));

  cachedDb = { users, teams, votes };
  lastFetchTime = now;
  return JSON.parse(JSON.stringify(cachedDb));
}

export async function saveDb(data: Database): Promise<void> {
  const doc = await getDoc();
  
  const usersSheet = doc.sheetsByTitle['Users'];
  const teamsSheet = doc.sheetsByTitle['Teams'];
  const votesSheet = doc.sheetsByTitle['Votes'];

  // This is a naive save implementation for a prototype. 
  // It clears the sheets and rewrites them entirely to ensure sync.
  
  if (usersSheet) {
    await usersSheet.clearRows();
    if (data.users.length > 0) {
      await usersSheet.addRows(data.users.map(u => ({ ...u, isAdmin: u.isAdmin.toString() })));
    }
  }

  if (teamsSheet) {
    await teamsSheet.clearRows();
    if (data.teams.length > 0) {
      await teamsSheet.addRows(data.teams as any[]);
    }
  }

  if (votesSheet) {
    await votesSheet.clearRows();
    if (data.votes.length > 0) {
      await votesSheet.addRows(data.votes as any[]);
    }
  }

  cachedDb = JSON.parse(JSON.stringify(data));
  lastFetchTime = Date.now();
}

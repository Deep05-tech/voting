import { NextResponse } from 'next/server';
import { getDb, saveDb, Team } from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = getDb();
    // sort by createdAt
    const teams = [...db.teams].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = getDb();
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString()
    };
    db.teams.push(newTeam);
    saveDb(db);
    
    return NextResponse.json(newTeam);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const db = getDb();
    
    // Delete associated votes first
    db.votes = db.votes.filter(v => v.teamId !== id);
    
    // Delete the team
    db.teams = db.teams.filter(t => t.id !== id);
    
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}

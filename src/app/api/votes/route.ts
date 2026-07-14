import { NextResponse } from 'next/server';
import { getDb, saveDb, Vote } from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // We need to attach team info to each vote to match the old Prisma relation structure
    const votesWithTeams = [...db.votes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(v => {
        const team = db.teams.find(t => t.id === v.teamId);
        return {
          ...v,
          team: { name: team ? team.name : 'Unknown Team' }
        };
      });
      
    return NextResponse.json(votesWithTeams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { votes, voterName, sessionId } = await request.json();
    
    if (!voterName || !sessionId || !votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
    const db = getDb();

    // Check if session ID has already voted to prevent duplicate bulk submit
    const existingVote = db.votes.find(v => v.sessionId === sessionId);
    if (existingVote) {
      return NextResponse.json({ error: 'You have already submitted your votes.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    
    const newVotes: Vote[] = votes.map((v: any) => ({
      id: crypto.randomUUID(),
      rating: v.rating,
      teamId: v.teamId,
      voterName,
      sessionId,
      ipAddress,
      createdAt: timestamp
    }));

    db.votes.push(...newVotes);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cast votes:', error);
    return NextResponse.json({ error: 'Failed to cast votes' }, { status: 500 });
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
      return NextResponse.json({ error: 'Vote ID is required' }, { status: 400 });
    }

    const db = getDb();
    db.votes = db.votes.filter(v => v.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vote' }, { status: 500 });
  }
}

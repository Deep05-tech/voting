import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const votes = await prisma.vote.findMany({
      include: {
        team: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(votes);
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

    // Check if session ID has already voted for any of these teams to prevent duplicate bulk submit
    const existingVote = await prisma.vote.findFirst({
      where: {
        sessionId,
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: 'You have already submitted your votes.' }, { status: 400 });
    }

    // Prepare data for bulk insert
    const dataToInsert = votes.map((v: any) => ({
      rating: v.rating,
      teamId: v.teamId,
      voterName,
      sessionId,
      ipAddress
    }));

    // Insert all in a transaction
    await prisma.$transaction(
      dataToInsert.map((data: any) => prisma.vote.create({ data }))
    );

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

    await prisma.vote.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vote' }, { status: 500 });
  }
}

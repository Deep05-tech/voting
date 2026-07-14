import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { createdAt: 'asc' },
    });
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

    const team = await prisma.team.create({
      data: { name, videoUrl: '' },
    });
    return NextResponse.json(team);
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

    // Delete associated votes first
    await prisma.vote.deleteMany({
      where: { teamId: id }
    });

    // Delete the team
    await prisma.team.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}

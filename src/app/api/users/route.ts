import { NextResponse } from 'next/server';
import { getDb, saveDb, User } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const users = [...db.users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(u => ({ id: u.id, name: u.name, username: u.username, isAdmin: u.isAdmin, createdAt: u.createdAt }));
      
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, username, password, isAdmin } = await request.json();
    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const existingUser = db.users.find(u => u.username === username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      username,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    saveDb(db);
    
    return NextResponse.json({ id: newUser.id, name: newUser.name, username: newUser.username, isAdmin: newUser.isAdmin });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
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
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();
    const userToDelete = db.users.find(u => u.id === id);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (userToDelete.username === 'admin') {
      return NextResponse.json({ error: 'Cannot delete the primary admin account' }, { status: 400 });
    }

    db.users = db.users.filter(u => u.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

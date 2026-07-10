'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('voterName');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('hasVoted');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>Prompt Party 2.0</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user && (
            <span style={{ color: 'var(--text-secondary)' }}>
              Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user.name || user.username}</strong>
            </span>
          )}
          {user?.isAdmin && (
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
              onClick={() => router.push('/admin')}
            >
              Admin
            </button>
          )}
          <button 
            className="btn btn-danger" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
            onClick={handleLogout}
          >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

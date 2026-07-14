'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // If they already entered their name, just redirect them to dashboard
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('voterName');
      if (storedName) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleStartVoting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }

    // Generate a unique session ID for this browser if one doesn't exist
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('sessionId', sessionId);
    }
    
    localStorage.setItem('voterName', name.trim());
    router.push('/dashboard');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Prompt Party 2.0</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Welcome to the Video Voting Portal!</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleStartVoting}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="name" style={{ fontSize: '1rem' }}>Enter Your Full Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              style={{ fontSize: '1.1rem', padding: '1rem' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
          >
            Start Voting
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
           <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Admin Login</button>
        </div>
      </div>
    </div>
  );
}

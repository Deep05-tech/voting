'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});
  const [voterName, setVoterName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Check credentials and status
    const storedName = localStorage.getItem('voterName');
    const storedSession = localStorage.getItem('sessionId');
    const votedStatus = localStorage.getItem('hasVoted');

    if (!storedName || !storedSession) {
      router.push('/');
      return;
    }

    setVoterName(storedName);
    setSessionId(storedSession);

    if (votedStatus === 'true') {
      setHasVoted(true);
    }

    // Load teams
    fetch('/api/teams')
      .then(r => r.json())
      .then(data => {
        setTeams(data);
        setLoading(false);
      });
  }, [router]);

  const handleRate = (teamId: string, rating: number) => {
    setLocalVotes(prev => ({
      ...prev,
      [teamId]: rating
    }));
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    try {
      const votesArray = Object.entries(localVotes).map(([teamId, rating]) => ({
        teamId,
        rating
      }));

      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          votes: votesArray,
          voterName,
          sessionId
        }),
      });

      if (res.ok) {
        localStorage.setItem('hasVoted', 'true');
        setHasVoted(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit votes. You may have already voted.');
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><span className="loader" style={{ width: '40px', height: '40px' }} /></div>;
  }

  // If already voted
  if (hasVoted) {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '4rem 2rem' }}>
            <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Thank You, {voterName}!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your votes have been successfully submitted and recorded securely.</p>
          </div>
        </div>
      </>
    );
  }

  const votedCount = Object.keys(localVotes).length;
  const totalTeams = teams.length;
  const allVoted = totalTeams > 0 && votedCount === totalTeams;

  return (
    <>
      <Navbar />
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Voting Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Hi <strong>{voterName}</strong>, please rate all {totalTeams} teams before submitting.</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 'max-content' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Progress</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: allVoted ? 'var(--success)' : 'inherit' }}>
                Completed: {votedCount}/{totalTeams} teams rated
              </div>
            </div>
            <button 
              className="btn btn-primary"
              disabled={!allVoted || submitting}
              onClick={handleSubmitAll}
              style={{ opacity: allVoted ? 1 : 0.5 }}
            >
              {submitting ? <span className="loader" style={{width: '20px', height: '20px', borderWidth: '2px'}}/> : 'Submit All Votes'}
            </button>
          </div>
        </div>

        <div className="team-grid">
          {teams.map(team => {
            const currentRating = localVotes[team.id];
            return (
              <div key={team.id} className="glass-card team-card" style={{ border: currentRating !== undefined ? '1px solid rgba(34, 197, 94, 0.4)' : undefined, padding: '2rem' }}>
                <div className="team-card-content" style={{ padding: 0 }}>
                  <h3 className="team-title" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}>{team.name}</h3>
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1rem', color: currentRating !== undefined ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {currentRating !== undefined ? 'Rated' : 'Rate this team:'}
                      </span>
                      <div className="star-rating" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'center' }}>
                        {[0, 1, 2, 3, 4, 5].map(score => (
                          <button 
                            key={score}
                            className={`btn ${currentRating === score ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ 
                              padding: '0.5rem 1rem', 
                              minWidth: '40px', 
                              borderRadius: '8px',
                              opacity: currentRating !== undefined && currentRating !== score ? 0.5 : 1
                            }}
                            onClick={() => handleRate(team.id, score)}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {teams.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No teams have been added yet.</p>
          </div>
        )}
      </main>
    </>
  );
}

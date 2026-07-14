'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});
  const [voterName, setVoterName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
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
    
    // Auto advance after short delay if not at the end
    if (currentIndex < teams.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 400);
    }
  };

  const handleNext = () => {
    if (currentIndex < teams.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsReviewing(true);
    }
  };

  const handlePrev = () => {
    if (isReviewing) {
      setIsReviewing(false);
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
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

  if (teams.length === 0) {
    return (
      <>
        <Navbar />
        <main className="container">
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No teams have been added yet.</p>
          </div>
        </main>
      </>
    );
  }

  const votedCount = Object.keys(localVotes).length;
  const totalTeams = teams.length;
  const currentTeam = teams[currentIndex];
  const currentRating = localVotes[currentTeam?.id];

  return (
    <>
      <Navbar />
      <main className="container" style={{ maxWidth: '800px', paddingBottom: '6rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Voting Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Hi <strong>{voterName}</strong>, rate the teams below.</p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem', background: 'var(--glass-bg)', borderRadius: '99px', padding: '0.25rem' }}>
          <div 
            style={{ 
              height: '8px', 
              borderRadius: '99px', 
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
              width: `${(votedCount / totalTeams) * 100}%`,
              transition: 'width 0.3s ease'
            }} 
          />
        </div>

        {!isReviewing ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '2rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Team {currentIndex + 1} of {totalTeams}
            </div>
            
            <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>{currentTeam.name}</h2>
            
            <div style={{ marginTop: 'auto', marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: currentRating !== undefined ? 'var(--success)' : 'inherit' }}>
                {currentRating !== undefined ? 'You rated this team:' : 'Select your rating:'}
              </p>
              
              <div className="star-rating" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4, 5].map(score => (
                  <button 
                    key={score}
                    className={`btn ${currentRating === score ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      padding: '1rem', 
                      minWidth: '60px', 
                      fontSize: '1.25rem',
                      borderRadius: '12px',
                      opacity: currentRating !== undefined && currentRating !== score ? 0.5 : 1
                    }}
                    onClick={() => handleRate(currentTeam.id, score)}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Review Your Votes</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {teams.map((team, idx) => {
                const rating = localVotes[team.id];
                return (
                  <div key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: rating === undefined ? '1px solid var(--error)' : '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Team {idx + 1}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{team.name}</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rating !== undefined ? '#fbbf24' : 'var(--error)' }}>
                      {rating !== undefined ? `${rating} / 5` : 'Missing'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {votedCount < totalTeams && (
              <div className="alert alert-error" style={{ textAlign: 'center' }}>
                You must rate all teams before you can submit!
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handlePrev} 
            disabled={!isReviewing && currentIndex === 0}
            style={{ opacity: (!isReviewing && currentIndex === 0) ? 0 : 1 }}
          >
            <ChevronLeft size={20} style={{ marginRight: '0.5rem' }} /> Back
          </button>

          {!isReviewing ? (
            <button 
              className="btn btn-primary" 
              onClick={handleNext}
            >
              {currentIndex === teams.length - 1 ? 'Review Votes' : 'Next Team'} <ChevronRight size={20} style={{ marginLeft: '0.5rem' }} />
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmitAll}
              disabled={votedCount < totalTeams || submitting}
              style={{ background: votedCount === totalTeams ? 'var(--success)' : '' }}
            >
              {submitting ? <span className="loader" style={{width: '20px', height: '20px', borderWidth: '2px'}}/> : <><Send size={18} style={{ marginRight: '0.5rem' }}/> Submit All Votes</>}
            </button>
          )}
        </div>
      </main>
    </>
  );
}

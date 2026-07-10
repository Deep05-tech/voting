'use client';

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('summary');
  
  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  
  const [newTeamName, setNewTeamName] = useState('');

  // Filter States
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? All associated votes will also be deleted.')) return;
    const res = await fetch(`/api/teams?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      alert('Failed to delete team');
    }
  };

  const handleDeleteVote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vote?')) return;
    const res = await fetch(`/api/votes?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      alert('Failed to delete vote');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (username === 'admin') {
      alert('You cannot delete the primary admin account.');
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData();
    } else {
      const d = await res.json();
      alert(d.error || 'Failed to delete user');
    }
  };

  const filteredVotes = selectedTeamFilter === 'ALL' 
    ? votes 
    : votes.filter(v => v.teamId === selectedTeamFilter);

  const fetchData = async () => {
    setLoading(true);
    const [uRes, tRes, vRes] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
      fetch('/api/votes').then(r => r.json()),
    ]);
    if (uRes && !uRes.error) setUsers(uRes);
    if (tRes && !tRes.error) setTeams(tRes);
    if (vRes && !vRes.error) setVotes(vRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newUserName, username: newUserUsername, password: newUserPassword, isAdmin: newUserIsAdmin }),
    });
    if (res.ok) {
      setNewUserName(''); setNewUserUsername(''); setNewUserPassword(''); setNewUserIsAdmin(false);
      fetchData();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeamName }),
    });
    if (res.ok) {
      setNewTeamName('');
      fetchData();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Voting Summary
    const summaryData = teams.map(team => {
      const teamVotes = votes.filter(v => v.teamId === team.id);
      const totalVotes = teamVotes.length;
      const averageScore = totalVotes > 0 ? (teamVotes.reduce((acc, v) => acc + v.rating, 0) / totalVotes).toFixed(2) : 0;
      return {
        'Team Name': team.name,
        'Total Votes': totalVotes,
        'Average Score': averageScore
      };
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Voting Summary');

    // Sheet 2: Detailed Voting Data
    const detailedData = votes.map(v => ({
      'Voter Name': v.voterName,
      'Team Name': v.team.name,
      'Rating': v.rating,
      'Timestamp': new Date(v.createdAt).toLocaleString()
    }));
    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Voting Data');

    // Export
    XLSX.writeFile(wb, 'PromptParty_VotingResults.xlsx');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><span className="loader" style={{ width: '40px', height: '40px' }} /></div>;

  return (
    <>
      <Navbar />
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Admin Dashboard</h1>
          <button className="btn btn-primary" onClick={handleExportExcel}>
            Export Voting Results
          </button>
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Voting Summary</div>
          <div className={`tab ${activeTab === 'detailed' ? 'active' : ''}`} onClick={() => setActiveTab('detailed')}>Detailed Votes</div>
          <div className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Manage Admins</div>
          <div className={`tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>Manage Teams</div>
        </div>

        {activeTab === 'summary' && (
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem' }}>Voting Summary</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Total Votes</th>
                    <th>Average Score</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => {
                    const teamVotes = votes.filter(v => v.teamId === team.id);
                    const totalVotes = teamVotes.length;
                    const averageScore = totalVotes > 0 ? (teamVotes.reduce((acc, v) => acc + v.rating, 0) / totalVotes).toFixed(2) : '0.00';
                    return (
                      <tr key={team.id}>
                        <td>{team.name}</td>
                        <td>{totalVotes}</td>
                        <td>{averageScore}</td>
                      </tr>
                    );
                  })}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No teams found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Detailed Voting Data</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ color: 'var(--text-secondary)' }}>Filter by Team:</label>
                <select 
                  className="form-input" 
                  style={{ width: '200px', padding: '0.5rem' }}
                  value={selectedTeamFilter}
                  onChange={e => setSelectedTeamFilter(e.target.value)}
                >
                  <option value="ALL">All Teams</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Voter Name</th>
                    <th>Team Name</th>
                    <th>Rating</th>
                    <th>Submission Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVotes.map(v => (
                    <tr key={v.id}>
                      <td>{v.voterName}</td>
                      <td>{v.team.name}</td>
                      <td>{v.rating} ⭐</td>
                      <td>{new Date(v.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteVote(v.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filteredVotes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No votes recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Add Voter</h3>
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Username / Email</label>
                  <input type="text" className="form-input" value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="isAdmin" checked={newUserIsAdmin} onChange={e => setNewUserIsAdmin(e.target.checked)} />
                  <label htmlFor="isAdmin">Is Admin</label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create User</button>
              </form>
            </div>
            
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem' }}>All Users</h3>
              <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.username}</td>
                        <td>{u.isAdmin ? <span className="badge badge-success">Admin</span> : <span className="badge" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}>Voter</span>}</td>
                        <td>
                          {u.username !== 'admin' && (
                            <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteUser(u.id, u.username)}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Add Team</h3>
              <form onSubmit={handleCreateTeam}>
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input type="text" className="form-input" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Team</button>
              </form>
            </div>
            
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem' }}>All Teams</h3>
              <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map(t => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>
                          <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDeleteTeam(t.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}

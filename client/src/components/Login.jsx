import { useState } from 'react';
import { api } from '../api';

const DEMO_ACCOUNTS = [
  { email: 'alice@ajaia.dev', name: 'Alice', role: 'Owner' },
  { email: 'bob@ajaia.dev', name: 'Bob', role: 'Collaborator' },
  { email: 'carol@ajaia.dev', name: 'Carol', role: 'Reviewer' },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('alice@ajaia.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account) => {
    setEmail(account.email);
    setPassword('password123');
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <div className="login-hero">
          <span className="hero-icon">📄</span>
          <h1>Ajaia Docs</h1>
          <p className="hero-tagline">
            A lightweight collaborative document editor — create, edit, share, and import
            documents with rich formatting.
          </p>
          <ul className="hero-features">
            <li>Rich-text editing with auto-save</li>
            <li>Share with edit, comment, or view permissions</li>
            <li>Comments, suggestions, version history, PDF export</li>
          </ul>
        </div>

        <div className="login-card">
          <h2>Sign in</h2>
          <p className="login-subtitle">Use a demo account to explore the app</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="demo-accounts">
            <p className="demo-label">Quick login</p>
            <div className="demo-chips">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className="chip"
                  onClick={() => quickLogin(a)}
                >
                  {a.name} <span className="chip-role">{a.role}</span>
                </button>
              ))}
            </div>
            <p className="demo-password">Password for all: <code>password123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

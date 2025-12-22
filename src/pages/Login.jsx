import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError('Failed to ' + (isSignup ? 'sign up' : 'login') + ': ' + err.message);
    }
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', gap: '20px' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--primary)' }}>Fridgy Login</h2>
      {error && <div style={{ background: '#ffebee', color: 'var(--danger)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }}
          />
        </div>
        <button type="submit" className="btn">
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        {isSignup ? 'Already have an account?' : 'Need an account?'}
        <button 
          onClick={() => setIsSignup(!isSignup)} 
          style={{ background: 'none', color: 'var(--primary)', fontWeight: 'bold', marginLeft: '5px' }}
        >
          {isSignup ? 'Login' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}

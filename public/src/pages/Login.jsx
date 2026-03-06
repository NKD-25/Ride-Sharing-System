import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { clearAuth } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    login(email.toLowerCase(), password)
      .then(() => {
        alert('Logged in');
        navigate('/');
      })
      .catch(err => {
        alert(err.message || 'Login failed');
      });
  }

  return (
    <main className="container form-page">
      <form className="form" onSubmit={handleSubmit}>
        <h2>Log In</h2>
        <div className="form-group">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </div>
        <button className="btn">Log In</button>
      </form>
    </main>
  );
}

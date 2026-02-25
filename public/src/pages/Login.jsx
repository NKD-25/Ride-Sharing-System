import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, setCurrentUser } from '../utils/storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
    if (!user) { alert('Invalid email or password'); return; }
    setCurrentUser(user);
    alert('Logged in');
    navigate('/profile');
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

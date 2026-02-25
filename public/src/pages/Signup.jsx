import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, saveUsers } from '../utils/storage';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirm) { alert('All fields are required.'); return; }
    if (password !== confirm) { alert('Passwords do not match.'); return; }
    const users = getUsers();
    if (users.find(u => u.email === email.toLowerCase())) { alert('Email already registered. Please log in.'); return; }
    const newUser = { firstName, lastName, email: email.toLowerCase(), password };
    users.push(newUser);
    saveUsers(users);
    alert('Sign up successful! Redirecting to log in...');
    navigate('/login');
  }

  return (
    <main className="container form-page">
      <form className="form" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        <div className="form-group"><label>First Name</label><input value={firstName} onChange={e=>setFirstName(e.target.value)} required /></div>
        <div className="form-group"><label>Last Name</label><input value={lastName} onChange={e=>setLastName(e.target.value)} required /></div>
        <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <div className="form-group"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
        <div className="form-group"><label>Confirm Password</label><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required /></div>
        <button className="btn">Sign Up</button>
      </form>
    </main>
  );
}

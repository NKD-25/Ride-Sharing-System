import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../utils/api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) { alert("Passwords do not match"); return; }
    register({ name, email, password, gender })
      .then(() => { alert('Registration successful! Please log in.'); navigate('/login'); })
      .catch(err => alert(err.message || 'Registration failed'));
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Join RideShare</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group"><label>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} required /></div>
          <div className="form-group"><label>Email Address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div className="form-group"><label>Gender</label>
            <select value={gender} onChange={e=>setGender(e.target.value)} required>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          <div className="form-group"><label>Confirm Password</label><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required /></div>
          <button type="submit" className="btn primary block">Sign Up</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Log In</Link></p>
      </div>
    </div>
  );
}

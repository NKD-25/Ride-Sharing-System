import React, { useEffect, useState } from 'react';
import { getCurrentUser, getDrivers, logout } from '../utils/storage';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(getCurrentUser());
  const [driverInfo, setDriverInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    const drivers = getDrivers();
    const mine = drivers.find(d => d.email === u.email);
    if (mine) setDriverInfo(mine);
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!user) return null;

  return (
    <main className="container form-page">
      <div className="form">
        <h2>My Profile</h2>
        <p>Welcome, <span>{user.firstName} {user.lastName}</span>!</p>
        <p>You are logged in as <strong>{user.email}</strong>.</p>
        {driverInfo && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Driver profile:</strong><br/>
            Name: {driverInfo.name}<br/>
            Phone: {driverInfo.phone}<br/>
            License: {driverInfo.license}<br/>
            Vehicle: {driverInfo.vehicle}
          </div>
        )}
        <button className="btn" onClick={handleLogout}>Logout</button>
      </div>
    </main>
  );
}

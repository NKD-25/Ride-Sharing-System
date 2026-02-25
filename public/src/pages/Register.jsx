import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrivers, saveDrivers } from '../utils/storage';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [vehicle, setVehicle] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !phone || !license || !vehicle) { alert('All fields are required.'); return; }
    const drivers = getDrivers();
    drivers.push({ name, email: email.toLowerCase(), phone, license, vehicle });
    saveDrivers(drivers);
    alert('Registered as driver!');
    navigate('/');
  }

  return (
    <main className="container form-page">
      <form className="form" onSubmit={handleSubmit}>
        <h2>Driver Registration</h2>
        <div className="form-group"><label>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} required /></div>
        <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <div className="form-group"><label>Phone Number</label><input value={phone} onChange={e=>setPhone(e.target.value)} required /></div>
        <div className="form-group"><label>Driver's License #</label><input value={license} onChange={e=>setLicense(e.target.value)} required /></div>
        <div className="form-group"><label>Vehicle Model</label><input value={vehicle} onChange={e=>setVehicle(e.target.value)} required /></div>
        <button className="btn">Register</button>
      </form>
    </main>
  );
}

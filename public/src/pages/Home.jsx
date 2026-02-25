import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getRides, getDrivers, getCurrentUser, createRide, bookRide, cancelBooking, deleteRideById, seedDemoRides, seatsLeft, logout } from '../utils/storage';

export default function Home() {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [passengers, setPassengers] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);

  const initialForm = { rideFrom:'', rideTo:'', rideDate:'', rideTime:'', rideSeats:1, ridePrice:0, ridePickup:'', rideNotes:'', editingId:'' };
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    seedDemoRides();
    refresh();
  }, []);

  useEffect(() => {
    // update auth state when location changes (login/logout)
    setCurrentUser(getCurrentUser());
  }, [location]);

  function refresh() {
    setRides(getRides().slice().sort((a,b)=> (b.createdAt||0)-(a.createdAt||0)));
    setDrivers(getDrivers());
    setCurrentUser(getCurrentUser());
  }

  const filtered = rides.filter(r => {
    if (search) { const s = search.toLowerCase(); if (!((r.from||'').toLowerCase().includes(s)||(r.to||'').toLowerCase().includes(s))) return false; }
    if (dateFilter && r.date !== dateFilter) return false;
    if (priceMin && Number(r.price||0) < Number(priceMin)) return false;
    if (priceMax && Number(r.price||0) > Number(priceMax)) return false;
    if (passengers && seatsLeft(r) < Number(passengers)) return false;
    return true;
  });

  function handleCreate(e) {
    e.preventDefault();
    if (!currentUser) { if (confirm('You must be logged in to create a ride. Go to login?')) window.location.href = '/login'; return; }
    const isDriver = drivers.find(d => d.email === currentUser.email);
    if (!isDriver) { if (confirm('You need to register as a driver to create rides. Register now?')) window.location.href = '/register'; return; }
    const data = { from: form.rideFrom, to: form.rideTo, date: form.rideDate, time: form.rideTime, seats: Number(form.rideSeats), price: Number(form.ridePrice), notes: form.rideNotes, pickup: form.ridePickup };
    if (form.editingId) {
      // simple update
      // updateRide is performed in storage via updateRide when editing is implemented there
      alert('Editing rides in-place is not supported in this simplified UI.');
    } else {
      createRide(data);
    }
    setForm(initialForm);
    refresh();
  }

  function handleBook(id) {
    try { bookRide(id); alert('Booked'); refresh(); } catch (err) { alert(err.message || 'Unable to book'); }
  }
  function handleCancel(id) { try { cancelBooking(id); alert('Cancelled'); refresh(); } catch (err) { alert(err.message || 'Unable to cancel'); } }
  function handleDelete(id) { if (!confirm('Delete this ride?')) return; if (deleteRideById(id)) { alert('Deleted'); refresh(); } else alert('Delete failed'); }

  return (
    <main className="container">
      <section className="hero">
        {currentUser ? (
          <>
            <h2>Welcome back, {currentUser.firstName}!</h2>
            <p>Ready for another ride? Check your profile or log out.</p>
            <div className="buttons">
              <Link className="btn" to="/profile">Profile</Link>
              <button className="btn" onClick={() => { logout(); setCurrentUser(null); navigate('/'); }}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <h2>Welcome to RideShare</h2>
            <p>Get a ride when you need it. Register as a driver or sign up as a rider!</p>
            <div className="buttons">
              <Link className="btn" to="/signup">Sign Up</Link>
              <Link className="btn" to="/login">Log In</Link>
            </div>
          </>
        )}
      </section>
      <section className="ride-app">
        <div className="ride-left">
          <div className="filters">
            <div className="search-bar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search from or to" /></div>
            <div className="filter-row">
              <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} />
              <input type="number" min="0" placeholder="Min price" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
              <input type="number" min="0" placeholder="Max price" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
              <input type="number" min="1" placeholder="Passengers" value={passengers} onChange={e=>setPassengers(e.target.value)} />
            </div>
          </div>
          <h3>Available Rides</h3>
          <div className="rides-list">
            {filtered.length === 0 && <p>No rides available.</p>}
            {filtered.map(r => {
              const left = seatsLeft(r);
              const drv = drivers.find(d => d.email === r.driverEmail);
              const driverName = drv ? drv.name : r.driverEmail;
              const current = currentUser;
              const alreadyBooked = current && (r.bookings || []).some(b => b.email === current.email);
              const isOwner = current && r.driverEmail === current.email;
              return (
                <div key={r.id} className="ride-card">
                  <div className="ride-route"><strong>{r.from}</strong> → <strong>{r.to}</strong></div>
                  <div className="ride-meta">{r.date} @ {r.time} · {left} seats · ₹{r.price}</div>
                  <div className="ride-driver">Driver: {driverName}</div>
                  <div className="ride-actions">
                    <button className="btn small" onClick={() => setSelectedRide(r)}>Details</button>
                    {isOwner ? (
                      <>
                        <button className="btn small" onClick={() => alert('Edit in UI not implemented')}>Edit</button>
                        <button className="btn small" onClick={() => handleDelete(r.id)}>Delete</button>
                      </>
                    ) : (
                      alreadyBooked ? <button className="btn small" onClick={()=>handleCancel(r.id)}>Cancel</button>
                      : left <= 0 ? <span className="full-label">Full</span>
                      : <button className="btn small" onClick={()=>handleBook(r.id)}>Book</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <aside className="ride-right">
          <div className="card create-ride">
            <h3>Create a Ride</h3>
            <form id="createRideForm" className="form" onSubmit={handleCreate}>
              <div className="form-group"><label>From</label><input value={form.rideFrom} onChange={e=>setForm({...form, rideFrom: e.target.value})} required /></div>
              <div className="form-group"><label>To</label><input value={form.rideTo} onChange={e=>setForm({...form, rideTo: e.target.value})} required /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.rideDate} onChange={e=>setForm({...form, rideDate: e.target.value})} required /></div>
              <div className="form-group"><label>Time</label><input type="time" value={form.rideTime} onChange={e=>setForm({...form, rideTime: e.target.value})} required /></div>
              <div className="form-group"><label>Seats</label><input type="number" min="1" value={form.rideSeats} onChange={e=>setForm({...form, rideSeats: e.target.value})} required /></div>
              <div className="form-group"><label>Price (₹)</label><input type="number" min="0" step="0.01" value={form.ridePrice} onChange={e=>setForm({...form, ridePrice: e.target.value})} /></div>
              <div className="form-group"><label>Pickup Points</label><input value={form.ridePickup} onChange={e=>setForm({...form, ridePickup: e.target.value})} /></div>
              <div className="form-group"><label>Notes</label><textarea value={form.rideNotes} onChange={e=>setForm({...form, rideNotes: e.target.value})} /></div>
              <button type="submit" className="btn">Create Ride</button>
            </form>
          </div>
          <div className="card my-rides">
            <h3>My Rides / Bookings</h3>
            <div id="myRides">
              {/* Simple list */}
              {rides.filter(r => (currentUser && r.driverEmail === currentUser.email)).map(r => (
                <div key={r.id} className="ride-card small">
                  <div className="ride-route"><strong>{r.from}</strong> → <strong>{r.to}</strong></div>
                  <div className="ride-meta">{r.date} @ {r.time} · {seatsLeft(r)} seats left</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {/* Modal */}
      {selectedRide && (
        <div id="rideModal" className="modal" aria-hidden="false">
          <div className="modal-inner">
            <button className="modal-close" onClick={()=>setSelectedRide(null)}>&times;</button>
            <div className="modal-content">
              <h3>Ride Details</h3>
              <p><strong>Route:</strong> {selectedRide.from} → {selectedRide.to}</p>
              <p><strong>Date / Time:</strong> {selectedRide.date} @ {selectedRide.time}</p>
              <p><strong>Seats left:</strong> {seatsLeft(selectedRide)}</p>
              <p><strong>Price:</strong> ₹{selectedRide.price}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

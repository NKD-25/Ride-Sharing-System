import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, clearAuth, getRides as apiGetRides, createRide as apiCreateRide, bookRide as apiBookRide, getDriverBookings, getRiderBookings, updateBookingStatus, cancelBooking as apiCancelBooking, deleteRide as apiDeleteRide } from '../utils/api';

export default function Home() {
  const [rides, setRides] = useState([]);
  const [authState, setAuthState] = useState(getAuth());
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [passengers, setPassengers] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [driverRequests, setDriverRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);

  const initialForm = { rideFrom:'', rideTo:'', rideDate:'', rideSeats:1, ridePrice:0, editingId:'' };
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadRides();
    refreshBookings();
  }, []);

  useEffect(() => {
    setAuthState(getAuth());
    refreshBookings();
  }, [location]);

  useEffect(() => {
    refreshBookings();
  }, [authState]);

  async function loadRides() {
    try {
      const list = await apiGetRides();
      setRides(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setRides([]);
    }
  }

  async function refreshBookings() {
    const auth = getAuth();
    if (!auth) { setDriverRequests([]); setMyBookings([]); return; }
    if (auth.role === 'driver') {
      try { const reqs = await getDriverBookings(); setDriverRequests(reqs || []); } catch { setDriverRequests([]); }
    } else {
      try { const mine = await getRiderBookings(); setMyBookings(mine || []); } catch { setMyBookings([]); }
    }
  }

  const filtered = rides.filter(r => {
    const today = new Date().toISOString().slice(0,10);
    if (r.date && r.date < today) return false;
    if (Number(r.availableSeats||0) <= 0) return false;
    if (search) { const s = search.toLowerCase(); if (!((r.from||'').toLowerCase().includes(s)||(r.to||'').toLowerCase().includes(s))) return false; }
    if (dateFilter && r.date !== dateFilter) return false;
    if (priceMin && Number(r.price||0) < Number(priceMin)) return false;
    if (priceMax && Number(r.price||0) > Number(priceMax)) return false;
    if (passengers && Number(r.availableSeats||0) < Number(passengers)) return false;
    return true;
  });

  function handleCreate(e) {
    e.preventDefault();
    const auth = getAuth();
    if (!auth) { if (confirm('You must be logged in to create a ride. Go to login?')) window.location.href = '/login'; return; }
    if (auth.role !== 'driver') { alert('You need to register as a driver to create rides.'); return; }
    const data = { from: form.rideFrom, to: form.rideTo, date: form.rideDate, price: Number(form.ridePrice), availableSeats: Number(form.rideSeats) };
    apiCreateRide(data)
      .then(() => { alert('Ride created'); setForm(initialForm); loadRides(); })
      .catch(err => alert(err.message || 'Unable to create ride'));
  }

  function handleBook(id) {
    apiBookRide(id)
      .then(() => { alert('Booked (status: pending)'); refreshBookings(); })
      .catch(err => alert(err.message || 'Unable to book'));
  }
  async function handleAccept(bookingId) {
    try { await updateBookingStatus(bookingId, 'accepted'); alert('Accepted'); refreshBookings(); } catch (err) { alert(err.message || 'Unable to accept'); }
  }
  async function handleReject(bookingId) {
    try { await updateBookingStatus(bookingId, 'rejected'); alert('Rejected'); refreshBookings(); } catch (err) { alert(err.message || 'Unable to reject'); }
  }
  async function handleCancelBooking(bookingId) {
    try { await apiCancelBooking(bookingId); alert('Cancelled'); await refreshBookings(); await loadRides(); } catch (err) { alert(err.message || 'Unable to cancel'); }
  }
  async function handleCancelRide(rideId) {
    const ok = confirm('Cancel this ride? This will cancel related bookings.');
    if (!ok) return;
    try { await apiDeleteRide(rideId); alert('Ride cancelled'); await loadRides(); await refreshBookings(); } catch (err) { alert(err.message || 'Unable to cancel ride'); }
  }

  return (
    <main className="container">
      <section className="hero">
        {authState ? (
          <>
            <h2>Welcome!</h2>
            <p>You are logged in as {authState.role === 'driver' ? 'Driver' : 'Client'}.</p>
            <div className="buttons">
              <button className="btn" onClick={() => { clearAuth(); setAuthState(null); navigate('/'); }}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <h2>Welcome to RideShare</h2>
            <p>Register as a driver or client, then log in to continue.</p>
            <div className="buttons">
              <Link className="btn" to="/login">Log In</Link>
              <Link className="btn" to="/register">Register</Link>
            </div>
          </>
        )}
      </section>
      <section className="ride-app">
        <div className="ride-left">
          <div className="filters">
            <div className="search-bar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search from or to" /></div>
            {authState && authState.role === 'driver' && (
              <div className="filter-row">
                <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} />
                <input type="number" min="0" placeholder="Min price" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
                <input type="number" min="0" placeholder="Max price" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
                <input type="number" min="1" placeholder="Passengers" value={passengers} onChange={e=>setPassengers(e.target.value)} />
              </div>
            )}
          </div>
          <h3>Available Rides</h3>
          <div className="rides-list">
            {filtered.length === 0 && <p>No rides available.</p>}
            {filtered.map(r => {
              const left = Number(r.availableSeats || 0);
              const auth = getAuth();
              const bookedMine = auth && myBookings.some(b => b.rideId === r.id);
              const today = new Date().toISOString().slice(0,10);
              const ridesById = Object.fromEntries(rides.map(x => [x.id, x]));
              const hasAcceptedFuture = myBookings.some(b => {
                const rr = ridesById[b.rideId];
                return b.status === 'accepted' && rr && rr.date && rr.date >= today;
              });
              const myBooking = myBookings.find(b => b.rideId === r.id);
              return (
                <div key={r.id} className="ride-card">
                  <div className="ride-route"><strong>{r.from}</strong> → <strong>{r.to}</strong></div>
                  <div className="ride-meta">{r.date} · {left} seats · ₹{r.price}</div>
                  <div className="ride-actions">
                    <button className="btn small" onClick={() => setSelectedRide(r)}>Details</button>
                    {auth ? (
                      auth.role === 'driver'
                        ? (
                          <>
                            <span className="full-label">Driver</span>
                            {auth.userId === r.driverId && <button className="btn small" onClick={()=>handleCancelRide(r.id)}>Cancel Ride</button>}
                          </>
                        )
                        : myBooking ? (
                            <>
                              <span className="full-label">Status: {myBooking.status}</span>
                              <button className="btn small" onClick={()=>handleCancelBooking(myBooking.id)}>Cancel</button>
                            </>
                          )
                          : hasAcceptedFuture ? <span className="full-label">You have an accepted ride</span>
                          : left <= 0 ? <span className="full-label">Full</span>
                          : <button className="btn small" onClick={()=>handleBook(r.id)}>Book</button>
                    ) : <Link className="btn small" to="/login">Log in to book</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <aside className="ride-right">
          {authState && authState.role === 'driver' && (
            <div className="card create-ride">
              <h3>Create a Ride</h3>
              <form id="createRideForm" className="form" onSubmit={handleCreate}>
                <div className="form-group"><label>From</label><input value={form.rideFrom} onChange={e=>setForm({...form, rideFrom: e.target.value})} required /></div>
                <div className="form-group"><label>To</label><input value={form.rideTo} onChange={e=>setForm({...form, rideTo: e.target.value})} required /></div>
                <div className="form-group"><label>Date</label><input type="date" value={form.rideDate} onChange={e=>setForm({...form, rideDate: e.target.value})} required /></div>
                <div className="form-group"><label>Seats</label><input type="number" min="1" value={form.rideSeats} onChange={e=>setForm({...form, rideSeats: e.target.value})} required /></div>
                <div className="form-group"><label>Price (₹)</label><input type="number" min="0" step="0.01" value={form.ridePrice} onChange={e=>setForm({...form, ridePrice: e.target.value})} /></div>
                <button type="submit" className="btn">Create Ride</button>
              </form>
            </div>
          )}
          {authState && authState.role === 'driver' && (
            <div className="card my-rides">
              <h3>Booking Requests</h3>
              <div id="driverRequests">
                {driverRequests.filter(b=>b.status==='pending').length === 0 && <p>No requests yet.</p>}
                {driverRequests.filter(b=>b.status==='pending').map(b => (
                  <div key={b.id} className="ride-card small">
                    <div className="ride-meta">Booking #{b.id} · Ride {b.rideId} · Status: {b.status}</div>
                    <div className="ride-meta">Client: {b.riderName || 'Unknown'} ({b.riderEmail || 'N/A'})</div>
                    <div className="ride-actions">
                      <button className="btn small" onClick={() => handleAccept(b.id)}>Accept</button>
                      <button className="btn small" onClick={() => handleReject(b.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card my-rides">
                <h3>Done</h3>
                <div id="driverDone">
                  {driverRequests.filter(b=>b.status==='accepted').length === 0 && <p>No completed bookings.</p>}
                  {driverRequests.filter(b=>b.status==='accepted').map(b => (
                    <div key={b.id} className="ride-card small">
                      <div className="ride-meta">Booking #{b.id} · Ride {b.rideId} · Status: Done</div>
                      <div className="ride-meta">Client: {b.riderName || 'Unknown'} ({b.riderEmail || 'N/A'})</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
              <p><strong>Date:</strong> {selectedRide.date}</p>
              <p><strong>Seats available:</strong> {Number(selectedRide.availableSeats||0)}</p>
              <p><strong>Price:</strong> ₹{selectedRide.price}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

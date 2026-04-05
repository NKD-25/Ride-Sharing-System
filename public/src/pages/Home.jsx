import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, clearAuth, getRides as apiGetRides, createRide as apiCreateRide, bookRide as apiBookRide, getDriverBookings, getRiderBookings, updateBookingStatus, cancelBooking as apiCancelBooking, deleteRide as apiDeleteRide, getProfile, updateProfile } from '../utils/api';

export default function Home() {
  const [rides, setRides] = useState([]);
  const [authState, setAuthState] = useState(getAuth());
  const [userProfile, setUserProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [passengers, setPassengers] = useState('');
  const [ladiesOnlyFilter, setLadiesOnlyFilter] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [driverRequests, setDriverRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ model: '', color: '', plate: '' });

  const initialForm = { rideFrom:'', rideTo:'', rideDate:'', rideSeats:1, ridePrice:0, isLadiesOnly: false, isInstantBooking: false };
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadRides();
    refreshData();
  }, []);

  useEffect(() => {
    setAuthState(getAuth());
    refreshData();
  }, [location]);

  useEffect(() => {
    refreshData();
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

  async function refreshData() {
    const auth = getAuth();
    if (!auth) { 
      setDriverRequests([]); 
      setMyBookings([]); 
      setUserProfile(null);
      return; 
    }
    
    try {
      const profile = await getProfile();
      setUserProfile(profile);
      
      const [reqs, mine] = await Promise.all([
        getDriverBookings().catch(() => []),
        getRiderBookings().catch(() => [])
      ]);
      setDriverRequests(reqs);
      setMyBookings(mine);
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  }

  const filtered = rides.filter(r => {
    const today = new Date().toISOString().slice(0,10);
    if (r.date && r.date < today) return false;
    if (Number(r.availableSeats||0) <= 0) return false;
    if (search) { 
      const s = search.toLowerCase(); 
      if (!((r.from||'').toLowerCase().includes(s)||(r.to||'').toLowerCase().includes(s))) return false; 
    }
    if (dateFilter && r.date !== dateFilter) return false;
    if (priceMin && Number(r.price||0) < Number(priceMin)) return false;
    if (priceMax && Number(r.price||0) > Number(priceMax)) return false;
    if (passengers && Number(r.availableSeats||0) < Number(passengers)) return false;
    if (ladiesOnlyFilter && !r.isLadiesOnly) return false;
    return true;
  });

  async function handleCreate(e) {
    e.preventDefault();
    if (!authState) { 
      if (confirm('You must be logged in to publish a ride. Go to login?')) navigate('/login'); 
      return; 
    }

    if (!userProfile?.carModel && !userProfile?.carDetails?.model) {
      setShowVehicleForm(true);
      return;
    }

    const data = { 
      from: form.rideFrom, 
      to: form.rideTo, 
      date: form.rideDate, 
      price: Number(form.ridePrice), 
      availableSeats: Number(form.rideSeats),
      isLadiesOnly: form.isLadiesOnly,
      isInstantBooking: form.isInstantBooking
    };

    try {
      await apiCreateRide(data);
      alert('Ride published successfully!');
      setForm(initialForm);
      loadRides();
    } catch (err) {
      alert(err.message || 'Unable to publish ride');
    }
  }

  async function handleVehicleSubmit(e) {
    e.preventDefault();
    try {
      await updateProfile({ 
        carModel: vehicleForm.model, 
        carColor: vehicleForm.color, 
        carPlate: vehicleForm.plate,
        carDetails: { model: vehicleForm.model, color: vehicleForm.color, plateNumber: vehicleForm.plate }
      });
      alert('Vehicle details saved!');
      setShowVehicleForm(false);
      refreshData();
    } catch (err) {
      alert(err.message || 'Error saving vehicle details');
    }
  }

  function handleBook(id) {
    apiBookRide(id)
      .then((res) => { 
        alert(res.status === 'accepted' ? 'Booked successfully (Instant)!' : 'Booking request sent (Pending Approval)'); 
        refreshData(); 
        loadRides();
      })
      .catch(err => alert(err.message || 'Unable to book'));
  }

  async function handleAccept(bookingId) {
    try { await updateBookingStatus(bookingId, 'accepted'); alert('Accepted'); refreshData(); loadRides(); } catch (err) { alert(err.message || 'Unable to accept'); }
  }
  async function handleReject(bookingId) {
    try { await updateBookingStatus(bookingId, 'rejected'); alert('Rejected'); refreshData(); } catch (err) { alert(err.message || 'Unable to reject'); }
  }
  async function handleCancelBooking(bookingId) {
    try { await apiCancelBooking(bookingId); alert('Cancelled'); await refreshData(); await loadRides(); } catch (err) { alert(err.message || 'Unable to cancel'); }
  }
  async function handleCancelRide(rideId) {
    const ok = confirm('Cancel this ride? This will cancel related bookings.');
    if (!ok) return;
    try { await apiDeleteRide(rideId); alert('Ride cancelled'); await loadRides(); await refreshData(); } catch (err) { alert(err.message || 'Unable to cancel ride'); }
  }

  return (
    <main className="container">
      <section className="hero">
        {authState ? (
          <>
            <h2>Welcome, {userProfile?.name || 'User'}!</h2>
            <p>Share your costs by publishing a ride or find an affordable trip.</p>
            <div className="buttons">
              <button className="btn" onClick={() => { clearAuth(); setAuthState(null); navigate('/'); }}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <h2>Welcome to RideShare</h2>
            <p>Join our community to save on travel costs and meet new people.</p>
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
            <div className="search-bar">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Where are you going?" />
            </div>
            <div className="filter-row">
              <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} />
              <input type="number" min="0" placeholder="Min ₹" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
              <input type="number" min="0" placeholder="Max ₹" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
              <label className="checkbox-label">
                <input type="checkbox" checked={ladiesOnlyFilter} onChange={e=>setLadiesOnlyFilter(e.target.checked)} /> 
                Ladies Only
              </label>
            </div>
          </div>

          <h3>Available Rides</h3>
          <div className="rides-list">
            {filtered.length === 0 && <p>No rides matching your criteria.</p>}
            {filtered.map(r => {
              const auth = getAuth();
              const myBooking = myBookings.find(b => b.rideId === r.id);
              const isOwner = auth?.userId === r.driverId;
              
              return (
                <div key={r.id} className={`ride-card ${isOwner ? 'owner' : ''}`}>
                  <div className="ride-route"><strong>{r.from}</strong> → <strong>{r.to}</strong></div>
                  <div className="ride-meta">
                    <span>{r.date}</span> · <span>{r.availableSeats} seats left</span> · <strong>₹{r.price}</strong>
                  </div>
                  <div className="ride-badges">
                    {r.isLadiesOnly && <span className="badge ladies">Ladies Only</span>}
                    {r.isInstantBooking && <span className="badge instant">Instant Booking</span>}
                  </div>
                  <div className="ride-actions">
                    <button className="btn small" onClick={() => setSelectedRide(r)}>Details</button>
                    {auth ? (
                      isOwner ? (
                        <button className="btn small danger" onClick={()=>handleCancelRide(r.id)}>Cancel My Ride</button>
                      ) : myBooking ? (
                        <>
                          <span className="status-label">Status: {myBooking.status}</span>
                          <button className="btn small" onClick={()=>handleCancelBooking(myBooking.id)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn small" onClick={()=>handleBook(r.id)} disabled={r.availableSeats <= 0}>
                          {r.availableSeats <= 0 ? 'Full' : 'Book Ride'}
                        </button>
                      )
                    ) : <Link className="btn small" to="/login">Log in to book</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="ride-right">
          <div className="card publish-ride">
            <h3>Publish a Ride</h3>
            <p className="hint">Share your trip and save on fuel!</p>
            <form className="form" onSubmit={handleCreate}>
              <div className="form-group"><label>From</label><input value={form.rideFrom} onChange={e=>setForm({...form, rideFrom: e.target.value})} required placeholder="Origin city" /></div>
              <div className="form-group"><label>To</label><input value={form.rideTo} onChange={e=>setForm({...form, rideTo: e.target.value})} required placeholder="Destination" /></div>
              <div className="form-group"><label>Date</label><input type="date" value={form.rideDate} onChange={e=>setForm({...form, rideDate: e.target.value})} required /></div>
              <div className="form-group"><label>Available Seats</label><input type="number" min="1" max="8" value={form.rideSeats} onChange={e=>setForm({...form, rideSeats: e.target.value})} required /></div>
              <div className="form-group"><label>Price per Seat (₹)</label><input type="number" min="0" value={form.ridePrice} onChange={e=>setForm({...form, ridePrice: e.target.value})} required /></div>
              
              <div className="form-options">
                <label className="checkbox-label"><input type="checkbox" checked={form.isLadiesOnly} onChange={e=>setForm({...form, isLadiesOnly: e.target.checked})} /> Ladies Only</label>
                <label className="checkbox-label"><input type="checkbox" checked={form.isInstantBooking} onChange={e=>setForm({...form, isInstantBooking: e.target.checked})} /> Instant Booking</label>
              </div>
              
              <button type="submit" className="btn primary">Publish Trip</button>
            </form>
          </div>

          {authState && (
            <div className="card dashboard">
              <h3>My Dashboard</h3>
              <div className="tabs">
                <div className="tab-content">
                  <h4>Pending Approvals</h4>
                  {driverRequests.filter(b=>b.status==='pending').length === 0 ? <p className="small">No pending requests.</p> : (
                    driverRequests.filter(b=>b.status==='pending').map(b => (
                      <div key={b.id} className="request-item">
                        <div className="small"><strong>{b.riderName}</strong> wants to join Ride #{b.rideId.slice(0,5)}</div>
                        <div className="actions">
                          <button className="btn tiny success" onClick={() => handleAccept(b.id)}>Accept</button>
                          <button className="btn tiny danger" onClick={() => handleReject(b.id)}>Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* Ride Details Modal */}
      {selectedRide && (
        <div className="modal">
          <div className="modal-inner">
            <button className="modal-close" onClick={()=>setSelectedRide(null)}>&times;</button>
            <h3>Ride Details</h3>
            <div className="modal-content">
              <p><strong>Route:</strong> {selectedRide.from} → {selectedRide.to}</p>
              <p><strong>Date:</strong> {selectedRide.date}</p>
              <p><strong>Available Seats:</strong> {selectedRide.availableSeats}</p>
              <p><strong>Price:</strong> ₹{selectedRide.price}</p>
              <p><strong>Car Model:</strong> {selectedRide.carModel || 'Not specified'}</p>
              <div className="modal-badges">
                {selectedRide.isLadiesOnly && <span className="badge ladies">Ladies Only</span>}
                {selectedRide.isInstantBooking && <span className="badge instant">Instant Booking</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {showVehicleForm && (
        <div className="modal">
          <div className="modal-inner">
            <button className="modal-close" onClick={()=>setShowVehicleForm(false)}>&times;</button>
            <h3>Vehicle Details Required</h3>
            <p className="small">To publish a ride, we need your car information first.</p>
            <form className="form" onSubmit={handleVehicleSubmit}>
              <div className="form-group"><label>Car Model</label><input value={vehicleForm.model} onChange={e=>setVehicleForm({...vehicleForm, model: e.target.value})} required placeholder="e.g. Honda City" /></div>
              <div className="form-group"><label>Color</label><input value={vehicleForm.color} onChange={e=>setVehicleForm({...vehicleForm, color: e.target.value})} required placeholder="e.g. White" /></div>
              <div className="form-group"><label>Plate Number</label><input value={vehicleForm.plate} onChange={e=>setVehicleForm({...vehicleForm, plate: e.target.value})} required placeholder="e.g. DL 01 AB 1234" /></div>
              <button type="submit" className="btn primary">Save & Continue</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

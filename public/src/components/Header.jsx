import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/storage';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    // update local user state whenever the route changes (login/logout will navigate)
    setUser(getCurrentUser());
  }, [location]);

  function handleLogout(e) {
    e.preventDefault();
    logout();
    setUser(null);
    navigate('/');
  }

  return (
    <header>
      <div className="container">
        <h1 className="logo">RideShare</h1>
        <nav id="mainNav">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <Link to="/profile">Profile</Link>
              <a href="#" onClick={handleLogout}>Logout</a>
            </>
          ) : (
            <>
              <Link to="/signup">Sign Up</Link>
              <Link to="/login">Log In</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

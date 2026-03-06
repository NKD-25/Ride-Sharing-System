import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/api';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState(getAuth());

  useEffect(() => {
    setAuth(getAuth());
  }, [location]);

  function handleLogout(e) {
    e.preventDefault();
    clearAuth();
    setAuth(null);
    navigate('/');
  }

  return (
    <header>
      <div className="container">
        <h1 className="logo">RideShare</h1>
        <nav id="mainNav">
          <Link to="/">Home</Link>
          {auth ? (
            <>
              <a href="#" onClick={handleLogout}>Logout</a>
            </>
          ) : (
            <>
              <Link to="/login">Log In</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, LogOut } from 'lucide-react';

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <div className="admin-topbar-brand">
          <FileText className="admin-topbar-logo" />
          <span className="admin-topbar-title">Katalyst</span>
        </div>
      </div>
      <div className="admin-topbar-right">
        <button
          onClick={handleLogout}
          className="admin-topbar-logout"
          aria-label="Logout"
        >
          <LogOut className="admin-topbar-icon" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <Link to="/dashboard" className="admin-topbar-title-link">
          <h1 className="admin-topbar-title">Katalyst</h1>
        </Link>
      </div>
      <div className="admin-topbar-right">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-white-700"
          title="Logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
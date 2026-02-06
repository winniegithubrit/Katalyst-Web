import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ collapsed = false, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isReportsActive = location.pathname.startsWith('/reports');

  const navItems = [
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: FileText,
    },
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''}`}>
      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'reports' ? isReportsActive : false;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`admin-sidebar-item ${isActive ? 'admin-sidebar-item-active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon className="admin-sidebar-icon" />
              {!collapsed && <span className="admin-sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <button
        onClick={onToggle}
        className="admin-sidebar-toggle"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
};

export default Sidebar;
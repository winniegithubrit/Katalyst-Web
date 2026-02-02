import React, { useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-container">
      <Topbar />
      <div className="admin-body">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

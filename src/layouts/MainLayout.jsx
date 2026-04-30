import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-area">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="page-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

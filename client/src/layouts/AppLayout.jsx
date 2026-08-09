import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';

const AppLayout = ({ title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen h-full w-full bg-slate-950 flex text-slate-100 overflow-x-hidden">
      {/* Sidebar for Desktop / Laptop */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Workspace occupying full width */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen lg:pl-60 pb-20 lg:pb-0">
        {/* Top Header Navbar */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-full p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Instant Mobile Navigation Bar for Phones */}
      <MobileNav />
    </div>
  );
};

export default AppLayout;

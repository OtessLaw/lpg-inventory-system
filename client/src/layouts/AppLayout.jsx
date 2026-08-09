import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const AppLayout = ({ title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen h-full w-full bg-slate-950 flex text-slate-100 overflow-x-hidden">
      {/* Full-height Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Workspace occupying full remaining width & height */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen lg:pl-60">
        {/* Full-width Header Navbar */}
        <Header onOpenSidebar={() => setSidebarOpen(true)} title={title} />

        {/* Full-width Main Page Content */}
        <main className="flex-1 w-full max-w-full p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

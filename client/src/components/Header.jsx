import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Menu, LogOut, Calendar } from 'lucide-react';

const Header = ({ onOpenSidebar, title }) => {
  const { user, logout } = useContext(AuthContext);

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-white font-display tracking-tight">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span>{todayDate}</span>
        </div>

        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <span className="text-xs font-bold text-white hidden sm:inline">{user?.name}</span>

          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

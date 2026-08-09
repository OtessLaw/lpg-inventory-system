import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ArrowDownRight,
  SlidersHorizontal,
  ShoppingCart,
  Receipt,
  History,
  Users,
  BarChart3,
  Building2,
  Flame,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, isAdmin } = useContext(AuthContext);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Sale (POS)', path: '/sales/new', icon: ShoppingCart },
    { label: 'Record Stock In', path: '/inventory/stock-in', icon: ArrowDownRight },
    { label: 'Inventory Stock', path: '/inventory', icon: Package },
    { label: 'Sales History', path: '/sales/history', icon: Receipt },
    { label: 'Audit Trail', path: '/inventory/history', icon: History },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Suppliers', path: '/suppliers', icon: Building2 },
    ...(isAdmin ? [{ label: 'Stock Adjustment', path: '/inventory/adjustment', icon: SlidersHorizontal }] : []),
    ...(isAdmin ? [{ label: 'Users', path: '/users', icon: Users }] : []),
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-60 bg-slate-950 border-r border-slate-800/80 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-orange-500 rounded-lg text-white">
                <Flame className="w-5 h-5" />
              </div>
              <h1 className="text-base font-bold font-display tracking-tight text-white">
                LPG Gas Station
              </h1>
            </div>
            <button className="lg:hidden text-slate-400 p-1" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-500 text-white font-bold shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

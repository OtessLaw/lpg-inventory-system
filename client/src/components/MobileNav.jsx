import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowDownRight,
  Receipt,
  BarChart3,
} from 'lucide-react';

const MobileNav = () => {
  const mobileNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'POS Sale', path: '/sales/new', icon: ShoppingCart },
    { label: 'Stock In', path: '/inventory/stock-in', icon: ArrowDownRight },
    { label: 'Sales Log', path: '/sales/history', icon: Receipt },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                  isActive
                    ? 'text-orange-400 font-extrabold bg-orange-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;

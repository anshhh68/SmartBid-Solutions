import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Bookmark, Bell, MessageSquare, User, LogOut,
  ChevronRight, FileText
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/saved', label: 'Saved Tenders', icon: Bookmark },
    { to: '/dashboard/alerts', label: 'My Alerts', icon: Bell },
    { to: '/dashboard/enquiries', label: 'My Enquiries', icon: MessageSquare },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SB</span>
          </div>
          <span className="font-bold text-slate-800 hidden sm:block">SmartBid Solutions</span>
        </a>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:block">Welcome, {user?.name?.split(' ')[0]}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-57px)] bg-white border-r border-slate-200 sticky top-[57px] h-[calc(100vh-57px)] flex flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <a
              href="/tenders"
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              Browse Tenders
              <ChevronRight className="w-3 h-3 ml-auto" />
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  LayoutDashboard, FileText, MessageSquare, Users, Settings,
  Briefcase, Star, HelpCircle, Tag, ClipboardList, LogOut,
  ChevronRight, Package, BookOpen, Shield
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardData } = useQuery({
    queryKey: ['admin-sidebar-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const newEnquiriesCount = dashboardData?.stats?.newEnquiries || 0;

  const navGroups = [
    {
      label: 'Overview',
      items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'Tender Management',
      items: [
        { to: '/admin/tenders', label: 'Tenders', icon: FileText },
        { to: '/admin/categories', label: 'Categories', icon: Tag },
      ],
    },
    {
      label: 'Engagement',
      items: [
        { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
        { to: '/admin/users', label: 'Users', icon: Users },
      ],
    },
    {
      label: 'Content',
      items: [
        { to: '/admin/services', label: 'Services', icon: Briefcase },
        { to: '/admin/testimonials', label: 'Testimonials', icon: Star },
        { to: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
      ],
    },
    {
      label: 'System',
      items: [
        { to: '/admin/settings', label: 'Site Settings', icon: Settings },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col sticky top-0 h-screen overflow-y-auto scrollbar-thin">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <img src="/logo.png" alt="SmartBid Logo" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">SmartBid Admin</p>
              <p className="text-[11px] text-amber-400 font-medium">{user?.name || 'Administrator'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-[#0B2A54] text-white font-semibold border-l-2 border-[#C8932C] shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {to === '/admin/enquiries' && newEnquiriesCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-[#C8932C] text-white rounded-full animate-pulse shadow-sm">
                        {newEnquiriesCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-700 space-y-1">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            View Website
            <ChevronRight className="w-3 h-3 ml-auto" />
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

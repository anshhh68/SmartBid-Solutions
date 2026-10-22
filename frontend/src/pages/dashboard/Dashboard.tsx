import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bookmark, Bell, MessageSquare, Clock, ArrowRight,
  TrendingUp, Calendar, AlertCircle, FileSearch, ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-dashboard'],
    queryFn: async () => {
      const res = await api.get('/users/dashboard');
      return res.data;
    },
  });

  const stats = data?.stats || { savedTenders: 0, activeAlerts: 0, enquiries: 0 };
  const upcomingDeadlines = data?.upcomingDeadlines || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-semibold tracking-wide text-blue-200 mb-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            Verified Bidder Account
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-blue-200 text-sm mt-1 max-w-xl">
            Track your saved opportunities, set instant procurement alerts, and monitor your bidding assistance requests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/tenders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
          >
            <FileSearch className="w-4 h-4" />
            Browse Live Tenders
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all border border-white/20"
          >
            Get Bid Support
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/dashboard/saved"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Bookmark className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">
            {isLoading ? '...' : stats.savedTenders}
          </p>
          <p className="text-sm font-medium text-slate-500 mt-1">Saved Tenders</p>
        </Link>

        <Link
          to="/dashboard/alerts"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:border-amber-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              Configure <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">
            {isLoading ? '...' : stats.activeAlerts}
          </p>
          <p className="text-sm font-medium text-slate-500 mt-1">Active Keyword Alerts</p>
        </Link>

        <Link
          to="/dashboard/enquiries"
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              Track <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">
            {isLoading ? '...' : stats.enquiries}
          </p>
          <p className="text-sm font-medium text-slate-500 mt-1">Support & Bid Enquiries</p>
        </Link>
      </div>

      {/* Main Grid: Upcoming Deadlines & Quick Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadlines Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-slate-900">Closing Soon (Your Saved Tenders)</h2>
            </div>
            <Link to="/dashboard/saved" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-slate-400">Loading your deadlines...</div>
          ) : upcomingDeadlines.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No active deadlines in your saved list.</p>
              <p className="text-xs text-slate-400 mt-1">Bookmark live tenders to receive automatic deadline reminders.</p>
              <Link
                to="/tenders"
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Find Tenders Now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingDeadlines.map((t: any) => {
                const closing = new Date(t.closingDate);
                const diffDays = Math.ceil((closing.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/tenders/${t.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-1 block transition-colors"
                      >
                        {t.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">{t.department}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        diffDays <= 3
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {diffDays <= 0 ? 'Closes Today' : `${diffDays} days left`}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {closing.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Help & Direct Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-sm">
            <h3 className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Need Bid Preparation?
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Our GeM & E-Tender specialists can review your eligibility, prepare technical documentation, and ensure 100% compliant bid submission.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <a
                href="https://wa.me/917016235257?text=Hi%20SmartBid%20Team%2C%20I%20need%20assistance%20with%20a%20tender%20bid"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Instant WhatsApp Expert
              </a>
              <Link
                to="/services"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Explore Full Services
              </Link>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Pro Tip for Bidders
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Always verify your Class-3 Digital Signature Certificate (DSC) validity at least 48 hours prior to reverse auctions or bid deadlines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

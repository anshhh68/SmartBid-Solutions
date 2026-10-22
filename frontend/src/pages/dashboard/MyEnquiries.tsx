import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  MessageSquare, Plus, Clock, CheckCircle2,
  AlertCircle, ChevronRight, PhoneCall
} from 'lucide-react';

export default function MyEnquiries() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-enquiries'],
    queryFn: async () => {
      const res = await api.get('/enquiries/mine');
      return res.data.enquiries || [];
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Under Review
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const enquiries = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            My Consultations & Enquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track status and responses for your tender assistance and GeM onboarding queries.
          </p>
        </div>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Enquiry
        </Link>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Loading your enquiries...</div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No enquiries submitted</h3>
          <p className="text-sm text-slate-500 mt-2">
            Need help with GeM registration, digital signature (DSC), or preparing a bid document? Request a consultation from our experts.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Submit an Enquiry
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((item: any) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {item.service || 'General Consultation'}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {item.subject || 'Assistance Request'}
                  </h3>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-xl">
                {item.message}
              </div>

              {item.notes && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                  <span className="font-semibold text-blue-900 block mb-1">
                    SmartBid Advisor Response / Update:
                  </span>
                  <p className="text-blue-800 whitespace-pre-line">{item.notes}</p>
                </div>
              )}

              <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Direct helpline: +91 70162 35257</span>
                <a
                  href={`https://wa.me/917016235257?text=Hi%2C%20following%20up%20on%20my%20enquiry%20regarding%20${encodeURIComponent(item.service || 'consultation')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Follow up on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

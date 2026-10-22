import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Suspense, lazy } from 'react';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

const Home = lazy(() => import('./pages/public/Home'));
const TenderList = lazy(() => import('./pages/public/TenderList'));
const TenderDetail = lazy(() => import('./pages/public/TenderDetail'));
const Services = lazy(() => import('./pages/public/Services'));
const ServiceDetail = lazy(() => import('./pages/public/ServiceDetail'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const StaticPage = lazy(() => import('./pages/public/StaticPage'));

const AdminLogin = lazy(() => import('./pages/auth/Login'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTenders = lazy(() => import('./pages/admin/AdminTenders'));
const AdminTenderForm = lazy(() => import('./pages/admin/AdminTenderForm'));
const AdminEnquiries = lazy(() => import('./pages/admin/AdminEnquiries'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminFAQs = lazy(() => import('./pages/admin/AdminFAQs'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-paper">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-stamp border-t-transparent rounded-full animate-spin" />
      <p className="text-ink/50 text-sm font-sans">Loading notices…</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/tenders" element={<TenderList />} />
                <Route path="/tenders/:id" element={<TenderDetail />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/pricing" element={<Navigate to="/services" replace />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/privacy-policy" element={<StaticPage slug="privacy-policy" />} />
                <Route path="/terms-and-conditions" element={<StaticPage slug="terms-and-conditions" />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/register" element={<Navigate to="/contact" replace />} />
              <Route path="/dashboard/*" element={<Navigate to="/" replace />} />

              <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/tenders" element={<AdminTenders />} />
                <Route path="/admin/tenders/new" element={<AdminTenderForm />} />
                <Route path="/admin/tenders/:id/edit" element={<AdminTenderForm />} />
                <Route path="/admin/enquiries" element={<AdminEnquiries />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/services" element={<AdminServices />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/testimonials" element={<AdminTestimonials />} />
                <Route path="/admin/faqs" element={<AdminFAQs />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '2px',
                background: '#2a1c14',
                color: '#f4ead8',
                fontSize: '14px',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

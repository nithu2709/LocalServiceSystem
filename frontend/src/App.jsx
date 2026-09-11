import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import CustomerPortal from './components/CustomerPortal';
import ProviderPortal from './components/ProviderPortal';
import AdminPortal from './components/AdminPortal';
import AuthModal from './components/AuthModal';
import { 
  Zap, 
  Wrench, 
  Wind, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Server,
  Cloud
} from 'lucide-react';

export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Electrician', description: 'Certified electrical repairs, wiring, lighting, and circuit diagnostics.' },
  { id: 2, name: 'Plumber', description: 'Pipe leak repairs, drain unclogging, fixture installs, and water systems.' },
  { id: 3, name: 'AC Repair', description: 'Cooling maintenance, refrigerant recharge, compressor fixes, and HVAC airflow.' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [requests, setRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminActivity, setAdminActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: '' }

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Initial Load: Fetch categories and verify auth state
  useEffect(() => {
    const initData = async () => {
      try {
        const catData = await api.getCategories();
        const loaded = catData?.data || catData?.categories;
        if (Array.isArray(loaded) && loaded.length > 0) {
          setCategories(loaded);
        }
      } catch (err) {
        console.error('Categories load error, using default 3 categories:', err);
      }

      // Check if user has an active, valid token in localStorage
      const token = localStorage.getItem('localservice_token');
      if (token) {
        try {
          const authRes = await api.getCurrentUser();
          if (authRes?.user) {
            setCurrentUser(authRes.user);
          } else {
            api.logout();
            setCurrentUser(null);
          }
        } catch {
          // Token expired or invalid
          api.logout();
          setCurrentUser(null);
        }
      } else {
        api.logout();
        setCurrentUser(null);
      }
    };

    initData();
  }, []);

  // 2. Load role-specific data when currentUser changes
  const loadPortalData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      if (currentUser.role === 'CUSTOMER') {
        const reqData = await api.getRequests();
        if (reqData?.requests) setRequests(reqData.requests);
      } else if (currentUser.role === 'PROVIDER') {
        const reqData = await api.getRequests();
        if (reqData?.requests) setRequests(reqData.requests);
      } else if (currentUser.role === 'ADMIN') {
        const [reqData, statsData, actData, provData] = await Promise.all([
          api.getRequests(),
          api.getAdminStats(),
          api.getAdminActivity(),
          api.getProviders(),
        ]);
        if (reqData?.requests) setRequests(reqData.requests);
        if (statsData?.stats) setAdminStats(statsData.stats);
        if (actData?.activity) setAdminActivity(actData.activity);
        if (provData?.providers) setProviders(provData.providers);
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
      showToast(err.message || 'Failed to sync data with server', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // 3. User Authentication
  const handleLogin = async (email, password) => {
    try {
      const data = await api.login(email, password);
      if (data.user) {
        setCurrentUser(data.user);
        setAuthModalOpen(false);
        showToast(`Welcome back, ${data.user.name}!`);
      }
      return data;
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      throw err;
    }
  };

  const handleRegister = async (userData) => {
    try {
      const data = await api.register(userData);
      if (data.token && data.user) {
        setCurrentUser(data.user);
        setAuthModalOpen(false);
        showToast(`Account created successfully! Welcome, ${data.user.name}!`);
      }
      return data;
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
      throw err;
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setRequests([]);
    setAdminStats(null);
    setAdminActivity(null);
    setProviders([]);
    showToast('Signed out successfully.');
  };

  // 4. Customer Actions
  const handleCreateRequest = async (requestData) => {
    const res = await api.createRequest(requestData);
    showToast('Service request submitted successfully! Technicians notified.');
    await loadPortalData();
    return res;
  };

  const handleUpdateRequest = async (requestId, requestData) => {
    try {
      await api.updateRequest(requestId, requestData);
      showToast('Service request updated successfully!');
      await loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to update request', 'error');
      throw err;
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.deleteRequest(requestId);
      showToast('Service request cancelled and removed.');
      await loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request', 'error');
      throw err;
    }
  };

  const handleConfirmCompletion = async (requestId) => {
    try {
      await api.confirmCompletion(requestId);
      showToast('Service completion confirmed! Thank you.');
      await loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to confirm completion', 'error');
      throw err;
    }
  };

  const handleSubmitReview = async (reviewData) => {
    await api.submitReview(reviewData);
    showToast('Thank you for your rating and feedback!');
    await loadPortalData();
  };

  // 5. Provider Actions
  const handleUpdateStatus = async (requestId, nextStatus) => {
    try {
      await api.updateRequestStatus(requestId, nextStatus);
      showToast(`Request #${requestId} status moved to ${nextStatus}`);
      await loadPortalData();
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleToggleAvailability = async (availability) => {
    try {
      await api.toggleAvailability(availability);
      showToast(`Availability set to: ${availability ? 'Available for Jobs' : 'On Break'}`);
      if (currentUser?.provider) {
        setCurrentUser({
          ...currentUser,
          provider: { ...currentUser.provider, availability }
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to update availability', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-red-950 text-red-200 border-red-800'
                : 'bg-zinc-900 text-white border-zinc-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentUser ? (
          <>
            {currentUser.role === 'CUSTOMER' && (
              <CustomerPortal
                currentUser={currentUser}
                categories={categories}
                requests={requests}
                loading={loading}
                onCreateRequest={handleCreateRequest}
                onUpdateRequest={handleUpdateRequest}
                onCancelRequest={handleCancelRequest}
                onConfirmCompletion={handleConfirmCompletion}
                onSubmitReview={handleSubmitReview}
                onRefresh={loadPortalData}
              />
            )}

            {currentUser.role === 'PROVIDER' && (
              <ProviderPortal
                currentUser={currentUser}
                requests={requests}
                loading={loading}
                onUpdateStatus={handleUpdateStatus}
                onToggleAvailability={handleToggleAvailability}
                onRefresh={loadPortalData}
              />
            )}

            {currentUser.role === 'ADMIN' && (
              <AdminPortal
                stats={adminStats}
                requests={requests}
                providers={providers}
                activity={adminActivity}
                loading={loading}
                onRefresh={loadPortalData}
              />
            )}
          </>
        ) : (
          /* Public / Unauthenticated Landing Showcase */
          <div className="max-w-4xl mx-auto px-4 py-16 text-center text-white">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Local Service Request <br />
              <span className="text-indigo-400">Management System</span>
            </h1>

            <p className="mt-4 text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
              A minimalist, modern multi-role platform connecting residents with certified local specialists across 3 essential service categories.
            </p>

            {/* 3 Categories Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto text-left">
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-white text-sm">Electrician</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Wiring diagnostics, breaker panel repairs, and fixture installations.
                </p>
              </div>

              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/60 flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-white text-sm">Plumber</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Pipe leak fixing, valve replacements, and drain clearing.
                </p>
              </div>

              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-teal-950/60 text-teal-400 border border-teal-800/60 flex items-center justify-center mb-3">
                  <Wind className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-white text-sm">AC Repair</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  HVAC seasonal maintenance, filter washing, and gas refill.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-3 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition inline-flex items-center gap-2 cursor-pointer"
              >
                Sign In / Register
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">LocalService System</span>
            <span>•</span>
            <span>React + Express + Supabase PostgreSQL</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-zinc-500" /> Port 8080 (API)
            </span>
            <span className="inline-flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" /> Port 5173 (Vite)
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        categories={categories}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md pointer-events-auto transition-all duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-red-950/95 border-red-800 text-red-200'
                : 'bg-zinc-900/95 border-zinc-700 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium flex-1">{toast.text}</span>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-white text-base leading-none px-1"
            >
              &times;
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

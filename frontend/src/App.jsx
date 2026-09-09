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
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Server,
  Cloud
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(api.getStoredUser());
  const [demoUsers, setDemoUsers] = useState([]);
  const [categories, setCategories] = useState([]);
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

  // 1. Initial Load: Fetch categories and demo users
  useEffect(() => {
    const initData = async () => {
      try {
        const [catData, demoData] = await Promise.all([
          api.getCategories(),
          api.getDemoUsers(),
        ]);
        if (catData?.data) setCategories(catData.data);
        if (demoData?.users) setDemoUsers(demoData.users);

        // If no user stored, default to first customer for instant evaluation
        if (!api.getStoredUser() && demoData?.users?.length > 0) {
          const defaultCustomer = demoData.users.find(u => u.role === 'CUSTOMER') || demoData.users[0];
          handleSelectUser(defaultCustomer);
        }
      } catch (err) {
        console.error('Initial data load error:', err);
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

  // 3. User & Role Switching
  const handleSelectUser = async (user) => {
    try {
      // Login with standard demo password
      const res = await api.login(user.email, 'password123').catch(() => null);
      if (res?.user) {
        setCurrentUser(res.user);
        showToast(`Switched view to ${res.user.name} (${res.user.role})`);
      } else {
        // Fallback simulated session for demo
        localStorage.setItem('localservice_user', JSON.stringify(user));
        localStorage.setItem('localservice_user_id', user.id);
        setCurrentUser(user);
        showToast(`Switched view to ${user.name} (${user.role})`);
      }
    } catch (err) {
      showToast('Error switching demo user', 'error');
    }
  };

  const handleLogin = async (email, password) => {
    const data = await api.login(email, password);
    setCurrentUser(data.user);
    showToast(`Welcome back, ${data.user.name}!`);
  };

  const handleRegister = async (userData) => {
    const data = await api.register(userData);
    setCurrentUser(data.user);
    showToast(`Account created successfully! Welcome, ${data.user.name}!`);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setRequests([]);
    showToast('Signed out successfully.');
  };

  // 4. Customer Actions
  const handleCreateRequest = async (requestData) => {
    const res = await api.createRequest(requestData);
    showToast('Service request submitted successfully! Technicians notified.');
    await loadPortalData();
    return res;
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await api.updateRequestStatus(requestId, 'CANCELLED');
      showToast('Service request cancelled.');
      await loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel request', 'error');
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

  // 6. Admin Actions
  const handleAssignProvider = async (requestId, providerId) => {
    try {
      await api.assignProvider(requestId, providerId);
      showToast(`Assigned provider to Request #${requestId}`);
      await loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to assign provider', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-slate-900 text-white border-slate-700'
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
        demoUsers={demoUsers}
        onSelectUser={handleSelectUser}
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
                onCancelRequest={handleCancelRequest}
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
                onAssignProvider={handleAssignProvider}
                onRefresh={loadPortalData}
              />
            )}
          </>
        ) : (
          /* Public / Unauthenticated Landing Showcase */
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              College Cloud Architecture Project
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Local Service Request <br />
              <span className="text-indigo-600">Management System</span>
            </h1>

            <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              A minimalist, modern multi-role platform connecting residents with certified local specialists across 3 essential service categories.
            </p>

            {/* 3 Categories Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto text-left">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">Electrician</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Wiring diagnostics, breaker panel repairs, and fixture installations.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">Plumber</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pipe leak fixing, valve replacements, and drain clearing.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <Wind className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-slate-900 text-sm">AC Repair</h2>
                <p className="text-xs text-slate-500 mt-1">
                  HVAC seasonal maintenance, filter washing, and gas refill.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-3 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition inline-flex items-center gap-2"
              >
                Sign In / Register
                <ArrowRight className="w-4 h-4" />
              </button>

              {demoUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectUser(demoUsers[0])}
                  className="px-5 py-3 text-sm font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition"
                >
                  Quick Demo: Enter as {demoUsers[0].name}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">LocalService System</span>
            <span>•</span>
            <span>React + Express + Supabase PostgreSQL</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-400" /> Port 8080 (API)
            </span>
            <span className="inline-flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-indigo-500" /> Port 5173 (Vite)
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

    </div>
  );
}

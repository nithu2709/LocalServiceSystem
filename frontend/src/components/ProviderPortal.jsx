import React, { useState } from 'react';
import { 
  Zap, 
  Wrench, 
  Wind, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  RefreshCw, 
  Play, 
  Check, 
  Star,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Filter,
  CheckCheck
} from 'lucide-react';

export default function ProviderPortal({ 
  currentUser, 
  requests, 
  loading, 
  onUpdateStatus, 
  onToggleAvailability,
  onRefresh 
}) {
  const [activeTab, setActiveTab] = useState('assigned'); // 'available' or 'assigned'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const providerCategory = currentUser?.provider?.category_name || 'Technician';
  const isAvailable = currentUser?.provider?.availability !== false;

  const getCategoryIcon = (catName) => {
    switch (catName) {
      case 'Electrician':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Plumber':
        return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'AC Repair':
        return <Wind className="w-4 h-4 text-teal-400" />;
      default:
        return <Wrench className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800">
          <Clock className="w-3 h-3" /> Unassigned
        </span>
      );
    }
    if (s === 'ACCEPTED' || s === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/50 text-blue-300 border border-blue-800">
          <CheckCircle2 className="w-3 h-3" /> Assigned
        </span>
      );
    }
    if (s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-800">
          <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
        </span>
      );
    }
    if (s.includes('CONFIRMATION')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800 animate-pulse">
          <Clock className="w-3 h-3" /> Awaiting Confirmation
        </span>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    }
    return <span className="text-xs text-zinc-400">{status}</span>;
  };

  const handleStatusChange = async (requestId, nextStatus) => {
    setUpdatingId(requestId);
    try {
      await onUpdateStatus(requestId, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  // Split requests into Available (Pending in this category) vs Assigned to this provider
  const availableRequests = requests.filter(
    (r) => r.status === 'PENDING' && r.category_name === providerCategory
  );

  const myAssignedRequests = requests.filter(
    (r) => r.provider_id === currentUser?.provider?.provider_id || (r.status !== 'PENDING' && r.category_name === providerCategory)
  );

  const displayedRequests = (activeTab === 'available' ? availableRequests : myAssignedRequests).filter(r => {
    if (statusFilter === 'ALL') return true;
    const s = (r.status || '').toUpperCase();
    if (statusFilter === 'CONFIRMATION') return s.includes('CONFIRMATION');
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      
      {/* Provider Header Banner */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800">
              {getCategoryIcon(providerCategory)}
              {providerCategory} Specialist
            </span>
            <span className="text-xs text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">{currentUser?.provider?.location || 'Local Area'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">
            {currentUser?.name || 'Technician'}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {currentUser?.provider?.experience || 'Licensed & Certified Field Technician'}
          </p>
        </div>

        {/* Status Toggle & Refresh */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleAvailability(!isAvailable)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isAvailable 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            {isAvailable ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-500" />}
            <span>Status: {isAvailable ? 'Available for Jobs' : 'On Break / Busy'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh jobs"
            className="p-2 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => { setActiveTab('assigned'); setStatusFilter('ALL'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Assigned Jobs ({myAssignedRequests.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('available'); setStatusFilter('ALL'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeTab === 'available'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Available Jobs ({availableRequests.length})
          </button>
        </div>

        {/* Status Filter for Assigned Tab */}
        {activeTab === 'assigned' && (
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACCEPTED', label: 'Assigned' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'CONFIRMATION', label: 'Awaiting Approval' },
              { id: 'COMPLETED', label: 'Completed' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Job Cards Feed */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 bg-zinc-900 rounded-2xl border border-zinc-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
          <p className="text-xs font-medium">Loading service requests...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-zinc-400 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {activeTab === 'available' ? 'No pending jobs in your category' : 'No jobs found in this view'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'available' 
              ? `All ${providerCategory} requests have been claimed or none are pending right now.` 
              : 'You currently have no jobs matching the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRequests.map((req) => {
            const isUpdating = updatingId === req.id;
            const hasReview = !!req.review_id;
            const s = (req.status || '').toUpperCase();
            const isAwaitingConfirmation = s.includes('CONFIRMATION');

            return (
              <div
                key={req.id}
                className={`bg-zinc-900 rounded-2xl p-6 border transition shadow-lg space-y-4 ${
                  isAwaitingConfirmation 
                    ? 'border-purple-600/70 bg-gradient-to-b from-zinc-900 to-purple-950/20' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                      #{req.id}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Requested on {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Job Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-white">{req.title}</h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {/* Customer & Location Info */}
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Customer</span>
                      <span className="font-semibold text-white">{req.customer_name || 'Customer'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Contact</span>
                      <span className="text-zinc-300">{req.customer_phone || req.customer_email || 'Contact on file'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Service Address</span>
                      <span className="font-medium text-white">{req.location}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Review (if job completed and reviewed) */}
                {hasReview && (
                  <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl text-xs text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-300">
                      <div className="flex text-amber-400">
                        {[...Array(req.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span>Customer Review ({req.rating}/5)</span>
                    </div>
                    {req.review_comment && (
                      <p className="italic text-amber-200/90">"{req.review_comment}"</p>
                    )}
                  </div>
                )}

                {/* Status Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                  
                  {/* PENDING -> Accept Job */}
                  {req.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(req.id, 'ACCEPTED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isUpdating ? 'Accepting...' : 'Claim & Accept Job'}
                    </button>
                  )}

                  {/* ACCEPTED / ASSIGNED -> In Progress */}
                  {(req.status === 'ACCEPTED' || req.status === 'ASSIGNED') && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(req.id, 'IN_PROGRESS')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isUpdating ? 'Updating...' : 'Start Work (In Progress)'}
                    </button>
                  )}

                  {/* IN_PROGRESS -> Finish Work & Request Confirmation */}
                  {req.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(req.id, 'Pending Customer Confirmation')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isUpdating ? 'Submitting...' : 'Finish Work & Request Confirmation'}
                    </button>
                  )}

                  {/* Awaiting Customer Approval Banner */}
                  {isAwaitingConfirmation && (
                    <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold bg-purple-950/60 px-3.5 py-2 rounded-xl border border-purple-800">
                      <Clock className="w-4 h-4 text-purple-400 animate-pulse" />
                      Work Finished — Awaiting Customer Approval
                    </div>
                  )}

                  {/* COMPLETED badge */}
                  {req.status === 'COMPLETED' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Job Officially Completed & Approved
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

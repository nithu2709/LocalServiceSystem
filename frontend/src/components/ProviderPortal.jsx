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
  Filter
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
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Plumber':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'AC Repair':
        return <Wind className="w-4 h-4 text-teal-500" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Unassigned
          </span>
        );
      case 'ACCEPTED':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Assigned
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
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
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Provider Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {getCategoryIcon(providerCategory)}
              {providerCategory} Specialist
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{currentUser?.provider?.location || 'Local Area'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {currentUser?.name || 'Technician'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser?.provider?.experience || 'Licensed & Certified Field Technician'}
          </p>
        </div>

        {/* Status Toggle & Refresh */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleAvailability(!isAvailable)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isAvailable 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isAvailable ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            <span>Status: {isAvailable ? 'Available for Jobs' : 'On Break / Busy'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh jobs"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('assigned'); setStatusFilter('ALL'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'assigned'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Assigned Jobs ({myAssignedRequests.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('available'); setStatusFilter('ALL'); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'available'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Jobs ({availableRequests.length})
          </button>
        </div>

        {/* Status Filter for Assigned Tab */}
        {activeTab === 'assigned' && (
          <div className="flex items-center gap-1">
            {['ALL', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Job Cards Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-xs font-medium">Loading service requests...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {activeTab === 'available' ? 'No pending jobs in your category' : 'No jobs found in this view'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-slate-300 transition shadow-2xs space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      #{req.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Requested on {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Job Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {/* Customer & Location Info */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Customer</span>
                      <span className="font-semibold">{req.customer_name || 'Alex Morgan'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Contact</span>
                      <span>{req.customer_phone || 'Customer Phone on file'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Service Address</span>
                      <span className="font-medium">{req.location}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Review (if job completed and reviewed) */}
                {hasReview && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-900">
                      <div className="flex text-amber-400">
                        {[...Array(req.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span>Customer Review ({req.rating}/5)</span>
                    </div>
                    {req.review_comment && (
                      <p className="italic text-amber-800">"{req.review_comment}"</p>
                    )}
                  </div>
                )}

                {/* Status Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  
                  {/* PENDING -> Accept Job */}
                  {req.status === 'PENDING' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(req.id, 'ACCEPTED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs transition disabled:opacity-50"
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-2xs transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isUpdating ? 'Updating...' : 'Start Work (In Progress)'}
                    </button>
                  )}

                  {/* IN_PROGRESS -> Completed */}
                  {req.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(req.id, 'COMPLETED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isUpdating ? 'Completing...' : 'Mark Job Completed'}
                    </button>
                  )}

                  {/* COMPLETED badge */}
                  {req.status === 'COMPLETED' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Service Successfully Completed
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

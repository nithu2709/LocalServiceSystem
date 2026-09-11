import React, { useState } from 'react';
import { 
  Edit3,
  Trash2,
  Zap, 
  Wrench, 
  Wind, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Star,
  RefreshCw,
  XCircle,
  Filter,
  CheckCheck,
  ShieldCheck
} from 'lucide-react';
import ReviewModal from './ReviewModal';
import EditRequestModal from './EditRequestModal';

export default function CustomerPortal({ 
  currentUser, 
  categories, 
  requests, 
  loading, 
  onCreateRequest, 
  onUpdateRequest,
  onCancelRequest, 
  onConfirmCompletion,
  onSubmitReview,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'history'
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmingId, setConfirmingId] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel and delete this service request? This action cannot be undone.')) {
      setCancellingId(requestId);
      try {
        await onCancelRequest(requestId);
      } finally {
        setCancellingId(null);
      }
    }
  };

  // Category Details for strictly 3 categories
  const getCategoryDetails = (name) => {
    switch (name) {
      case 'Electrician':
        return {
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          activeBg: 'bg-amber-950/40 border-amber-500 text-white',
          desc: 'Wiring, fixtures, outlets, and circuit breakers'
        };
      case 'Plumber':
        return {
          icon: <Wrench className="w-5 h-5 text-blue-400" />,
          activeBg: 'bg-blue-950/40 border-blue-500 text-white',
          desc: 'Pipes, leak repairs, faucets, and drain unclogging'
        };
      case 'AC Repair':
        return {
          icon: <Wind className="w-5 h-5 text-teal-400" />,
          activeBg: 'bg-teal-950/40 border-teal-500 text-white',
          desc: 'Cooling issues, compressor servicing, and gas refill'
        };
      default:
        return {
          icon: <Wrench className="w-5 h-5 text-zinc-400" />,
          activeBg: 'bg-zinc-800 border-zinc-600 text-white',
          desc: 'General maintenance'
        };
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/50 text-amber-300 border border-amber-800">
          <Clock className="w-3 h-3" /> Pending Assignment
        </span>
      );
    }
    if (s === 'ACCEPTED' || s === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/50 text-blue-300 border border-blue-800">
          <UserCheck className="w-3 h-3" /> Technician Assigned
        </span>
      );
    }
    if (s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-800">
          <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
        </span>
      );
    }
    if (s.includes('CONFIRMATION')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-700 animate-pulse">
          <CheckCheck className="w-3.5 h-3.5 text-purple-400" /> Awaiting Your Confirmation
        </span>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
          <XCircle className="w-3 h-3" /> Cancelled
        </span>
      );
    }
    return <span className="text-xs text-zinc-400">{status}</span>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !description.trim() || !location.trim()) {
      setFormError('Please fill in the title, description, and location.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateRequest({
        category_id: selectedCategory,
        title,
        description,
        location,
        preferred_date: preferredDate || null,
      });

      setTitle('');
      setDescription('');
      setLocation('');
      setPreferredDate('');
      setActiveTab('history');
    } catch (err) {
      setFormError(err.message || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (requestId) => {
    setConfirmingId(requestId);
    try {
      await onConfirmCompletion(requestId);
      // Auto-open review modal for convenient feedback
      const targetReq = requests.find(r => r.id === requestId);
      if (targetReq) {
        setReviewingRequest(targetReq);
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'ALL') return true;
    const s = (r.status || '').toUpperCase();
    if (statusFilter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS'].includes(s);
    if (statusFilter === 'CONFIRMATION') return s.includes('CONFIRMATION');
    return r.status === statusFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Customer Dashboard</span>
          <h1 className="text-2xl font-bold text-white mt-1">Hello, {currentUser?.name || 'Valued Customer'}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Request specialized technicians across Electrician, Plumber, and AC Repair trades.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'create'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            Book Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-zinc-400" />
            My Requests
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-zinc-700 text-zinc-200 rounded-full font-bold">
              {requests.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE REQUEST FORM */}
      {activeTab === 'create' && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl p-6 md:p-8">
          <div className="mb-6 pb-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">1. Select a Service Category</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select one of our 3 specialized essential service trades.
            </p>

            {/* 3 Categories Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const details = getCategoryDetails(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`text-left p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                      isSelected
                        ? `${details.activeBg} shadow-lg`
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
                          {details.icon}
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-700">
                            Selected
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1">{cat.description || details.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Details Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-lg font-bold text-white">2. Describe the Issue & Location</h2>

            {formError && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Issue Summary / Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kitchen sink pipe leaking under cabinet"
                className="w-full text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Detailed Problem Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is wrong, visible symptoms, or any urgency..."
                className="w-full text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  Service Location / Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 204 Maple Street, Apt 3B"
                  className="w-full text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Preferred Service Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                {submitting ? 'Submitting & Matching...' : 'Submit Service Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY REQUESTS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* Controls / Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-300">Filter:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'CONFIRMATION', label: 'Needs My Confirmation' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'COMPLETED', label: 'Completed' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      statusFilter === st.id
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* List of Requests */}
          {loading ? (
            <div className="p-12 text-center text-zinc-400 bg-zinc-900 rounded-2xl border border-zinc-800">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
              <p className="text-xs font-medium">Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900 rounded-2xl border border-zinc-800 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-zinc-800">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No service requests found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {statusFilter !== 'ALL' 
                  ? 'No requests match the selected status filter.' 
                  : 'You have not submitted any service requests yet.'}
              </p>
              {statusFilter === 'ALL' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-xl transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create First Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const catDetails = getCategoryDetails(req.category_name);
                const s = (req.status || '').toUpperCase();
                const isCompleted = s === 'COMPLETED';
                const isPending = s === 'PENDING';
                const canModify = s === 'PENDING' || s === 'ASSIGNED';
                const isAwaitingConfirmation = s.includes('CONFIRMATION');
                const hasReview = !!req.review_id;

                return (
                  <div
                    key={req.id}
                    className={`bg-zinc-900 rounded-xl p-5 border transition shadow-lg space-y-4 ${
                      isAwaitingConfirmation 
                        ? 'border-purple-600/80 bg-gradient-to-b from-zinc-900 to-purple-950/20' 
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-950 text-zinc-200 border border-zinc-800">
                          {catDetails.icon}
                          {req.category_name}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">#{req.id}</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-400">
                          {new Date(req.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <h3 className="text-base font-bold text-white">{req.title}</h3>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{req.description}</p>
                    </div>

                    {/* Metadata Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{req.location}</span>
                      </div>
                      {req.preferred_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>Preferred Date: {new Date(req.preferred_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Technician Banner */}
                    {req.provider_name && (
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                            Assigned Service Technician
                          </span>
                          <span className="font-bold text-white">{req.provider_name}</span>
                          {req.provider_phone && (
                            <span className="text-zinc-400 ml-2">({req.provider_phone})</span>
                          )}
                        </div>
                        {req.assigned_at && (
                          <span className="text-[11px] text-zinc-400">
                            Assigned: {new Date(req.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* TWO-STEP COMPLETION ALERT & BUTTON */}
                    {isAwaitingConfirmation && (
                      <div className="p-4 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <CheckCheck className="w-4 h-4 text-purple-400" />
                            Technician Marked Job as Finished
                          </div>
                          <p className="text-zinc-300 text-[11px] mt-0.5">
                            Please inspect the work performed. Click below to officially approve and close this request.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={confirmingId === req.id}
                          onClick={() => handleConfirm(req.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {confirmingId === req.id ? 'Confirming...' : 'Confirm Completion'}
                        </button>
                      </div>
                    )}

                    {/* Existing Review or Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                      <div>
                        {hasReview ? (
                          <div className="flex items-center gap-2 text-xs bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <div className="flex items-center text-amber-400">
                              {[...Array(req.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="font-bold text-white">{req.rating}/5</span>
                            {req.review_comment && (
                              <span className="text-zinc-400 italic truncate max-w-xs">"{req.review_comment}"</span>
                            )}
                          </div>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => setReviewingRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow-sm transition cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-black" />
                            Leave a Review
                          </button>
                        ) : null}
                      </div>

                      {/* Edit & Cancel Request buttons for pending/assigned tasks */}
                      {canModify && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                            title="Edit request details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={cancellingId === req.id}
                            onClick={() => handleCancel(req.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/80 transition cursor-pointer disabled:opacity-50"
                            title="Cancel and delete request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {cancellingId === req.id ? 'Cancelling...' : 'Cancel Request'}
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Edit Request Modal */}
      {editingRequest && (
        <EditRequestModal
          isOpen={!!editingRequest}
          request={editingRequest}
          categories={categories}
          onClose={() => setEditingRequest(null)}
          onSave={async (updatedData) => {
            if (onUpdateRequest) {
              await onUpdateRequest(editingRequest.id, updatedData);
            }
            setEditingRequest(null);
          }}
        />
      )}

      {/* Review Modal */}
      {reviewingRequest && (
        <ReviewModal
          request={reviewingRequest}
          onClose={() => setReviewingRequest(null)}
          onSubmitReview={onSubmitReview}
        />
      )}

    </div>
  );
}

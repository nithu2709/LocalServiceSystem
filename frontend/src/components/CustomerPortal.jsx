import React, { useState } from 'react';
import { 
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
  Filter
} from 'lucide-react';
import ReviewModal from './ReviewModal';

export default function CustomerPortal({ 
  currentUser, 
  categories, 
  requests, 
  loading, 
  onCreateRequest, 
  onCancelRequest, 
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

  // Category Icon & Details Helper strictly for the 3 categories
  const getCategoryDetails = (name) => {
    switch (name) {
      case 'Electrician':
        return {
          icon: <Zap className="w-5 h-5 text-amber-500" />,
          color: 'hover:border-amber-400 focus:border-amber-500',
          activeBg: 'bg-amber-50 border-amber-500 text-amber-950',
          badge: 'bg-amber-100 text-amber-800',
          desc: 'Wiring, fixtures, outlets, and circuit breakers'
        };
      case 'Plumber':
        return {
          icon: <Wrench className="w-5 h-5 text-blue-500" />,
          color: 'hover:border-blue-400 focus:border-blue-500',
          activeBg: 'bg-blue-50 border-blue-500 text-blue-950',
          badge: 'bg-blue-100 text-blue-800',
          desc: 'Pipes, leak repairs, faucets, and drain unclogging'
        };
      case 'AC Repair':
        return {
          icon: <Wind className="w-5 h-5 text-teal-500" />,
          color: 'hover:border-teal-400 focus:border-teal-500',
          activeBg: 'bg-teal-50 border-teal-500 text-teal-950',
          badge: 'bg-teal-100 text-teal-800',
          desc: 'Cooling issues, compressor servicing, and gas refill'
        };
      default:
        return {
          icon: <Wrench className="w-5 h-5 text-slate-500" />,
          color: 'hover:border-slate-400',
          activeBg: 'bg-slate-50 border-slate-500 text-slate-950',
          badge: 'bg-slate-100 text-slate-800',
          desc: 'General maintenance'
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Assignment
          </span>
        );
      case 'ACCEPTED':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" /> Technician Assigned
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
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

      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setPreferredDate('');
      setActiveTab('history'); // Switch to requests list
    } catch (err) {
      setFormError(err.message || 'Failed to submit service request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status);
    return r.status === statusFilter;
  });

  // Default tomorrow as preferred date placeholder
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Welcome Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Customer Dashboard</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Hello, {currentUser?.name || 'Valued Customer'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Request trusted local technicians across our 3 specialized service categories.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            Book Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            My Requests
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded-full font-bold">
              {requests.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE REQUEST FORM */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">1. Select a Service Category</h2>
            <p className="text-xs text-slate-500 mt-1">
              Platform is strictly specialized in 3 primary essential local trades.
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
                        ? `${details.activeBg} shadow-xs`
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-100">
                          {details.icon}
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                            Selected
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cat.description || details.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Details Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">2. Describe the Issue & Location</h2>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issue Summary / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kitchen sink pipe leaking under cabinet"
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Problem Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe symptoms, model details (if AC), urgency, or any visible damage..."
                className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Service Location / Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 204 Maple Street, Apt 3B, Downtown"
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Preferred Service Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Service Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MY REQUESTS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* Controls / Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              <div className="flex gap-1">
                {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {/* List of Requests */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-medium">Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No service requests found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter !== 'ALL' 
                  ? 'No requests match the selected status filter.' 
                  : 'You have not submitted any service requests yet.'}
              </p>
              {statusFilter === 'ALL' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create First Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const catDetails = getCategoryDetails(req.category_name);
                const isCompleted = req.status === 'COMPLETED';
                const isPending = req.status === 'PENDING';
                const hasReview = !!req.review_id;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl p-5 border border-slate-200/80 hover:border-slate-300 transition shadow-2xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {catDetails.icon}
                          {req.category_name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">#{req.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
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
                      <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                    </div>

                    {/* Metadata Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{req.location}</span>
                      </div>
                      {req.preferred_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Preferred Date: {new Date(req.preferred_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Technician Banner */}
                    {req.provider_name && (
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                            Assigned Service Technician
                          </span>
                          <span className="font-bold text-slate-900">{req.provider_name}</span>
                          {req.provider_phone && (
                            <span className="text-slate-500 ml-2">({req.provider_phone})</span>
                          )}
                        </div>
                        {req.assigned_at && (
                          <span className="text-[11px] text-slate-500">
                            Assigned: {new Date(req.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Existing Review or Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div>
                        {hasReview ? (
                          <div className="flex items-center gap-2 text-xs bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/80">
                            <div className="flex items-center text-amber-500">
                              {[...Array(req.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="font-bold text-amber-900">{req.rating}/5</span>
                            {req.review_comment && (
                              <span className="text-amber-800 italic truncate max-w-xs">"{req.review_comment}"</span>
                            )}
                          </div>
                        ) : isCompleted ? (
                          <button
                            type="button"
                            onClick={() => setReviewingRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            Leave a Review
                          </button>
                        ) : null}
                      </div>

                      {/* Cancel pending request */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => onCancelRequest(req.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
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

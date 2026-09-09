import React, { useState } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Star, 
  RefreshCw, 
  UserCheck, 
  MapPin, 
  Filter, 
  Zap, 
  Wrench, 
  Wind, 
  X,
  AlertTriangle,
  Layers,
  Activity
} from 'lucide-react';

export default function AdminPortal({ 
  stats, 
  requests, 
  providers, 
  activity, 
  loading, 
  onAssignProvider, 
  onRefresh 
}) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'providers', 'activity'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedRequestForAssign, setSelectedRequestForAssign] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const getCategoryIcon = (catName) => {
    switch (catName) {
      case 'Electrician':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'Plumber':
        return <Wrench className="w-3.5 h-3.5 text-blue-500" />;
      case 'AC Repair':
        return <Wind className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'ACCEPTED':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" /> Assigned
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && r.category_name !== categoryFilter) return false;
    return true;
  });

  const handleAssign = async (providerId) => {
    if (!selectedRequestForAssign) return;
    setAssigning(true);
    try {
      await onAssignProvider(selectedRequestForAssign.id, providerId);
      setSelectedRequestForAssign(null);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">Administrator Console</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Platform Activity & Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            System overview, technician assignments, and service lifecycle metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Requests</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.total_requests || 0}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">All-time volume</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 block uppercase">Pending Queue</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats?.pending_requests || 0}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting assignment</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 block uppercase">Active Work</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats?.active_requests || 0}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">In field servicing</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 block uppercase">Completed</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.completed_requests || 0}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Fulfilled successfully</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-600 block uppercase">Technicians</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">{stats?.total_providers || 0}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Across 3 categories</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-500 block uppercase">Avg Rating</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            {stats?.avg_rating || '5.0'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{stats?.total_reviews || 0} customer reviews</span>
        </div>
      </div>

      {/* 3 Categories Breakdown Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Specialized Category Metrics (Restricted to 3 Trades)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(stats?.categories || []).map((cat) => (
            <div key={cat.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  {getCategoryIcon(cat.name)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                  <span className="text-xs text-slate-500">
                    {cat.completed_count} completed / {cat.total_requests} total
                  </span>
                </div>
              </div>
              <span className="text-lg font-black text-slate-800">{cat.total_requests}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs for Admin */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Service Requests ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'providers'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Technicians Directory ({providers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'activity'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Audit Log & Activity
        </button>
      </div>

      {/* TAB 1: ALL REQUESTS MANAGEMENT */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Table Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              >
                <option value="ALL">All 3 Categories</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="AC Repair">AC Repair</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Service & Title</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No service requests match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{req.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {getCategoryIcon(req.category_name)}
                          <span>{req.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{req.category_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{req.customer_name}</div>
                        <div className="text-[11px] text-slate-400">{req.customer_phone || req.customer_email}</div>
                      </td>
                      <td className="py-3 px-4 truncate max-w-xs">{req.location}</td>
                      <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4">
                        {req.provider_name ? (
                          <div>
                            <div className="font-semibold text-slate-800">{req.provider_name}</div>
                            <div className="text-[11px] text-slate-400">{req.provider_phone}</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setSelectedRequestForAssign(req)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          >
                            {req.provider_name ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: PROVIDERS DIRECTORY */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((p) => (
            <div key={p.provider_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                  {getCategoryIcon(p.category_name)}
                  {p.category_name}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  p.availability ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.availability ? 'Available' : 'Busy'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.email}</p>
                <p className="text-xs text-slate-500">{p.phone}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <strong>{p.avg_rating}</strong> ({p.review_count || 0} reviews)
                </span>
                <span><strong>{p.completed_jobs || 0}</strong> completed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AUDIT LOG & ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Recent Platform Activity
          </h2>
          <div className="divide-y divide-slate-100">
            {(activity?.recent_requests || []).map((ev) => (
              <div key={ev.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">Request #{ev.id}</span> ({ev.category_name}):{' '}
                  <span className="text-slate-600">"{ev.title}"</span> requested by{' '}
                  <span className="font-medium text-slate-800">{ev.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(ev.status)}
                  <span className="text-[11px] text-slate-400">
                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Provider Modal */}
      {selectedRequestForAssign && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setSelectedRequestForAssign(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">
              Assign Technician to Request #{selectedRequestForAssign.id}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Category: <strong>{selectedRequestForAssign.category_name}</strong> • "{selectedRequestForAssign.title}"
            </p>

            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
              {providers
                .filter((p) => p.category_name === selectedRequestForAssign.category_name)
                .map((p) => (
                  <div
                    key={p.provider_id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 transition flex items-center justify-between bg-slate-50/50"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.phone} • {p.location || 'Local Area'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                          {p.avg_rating}
                        </span>
                        <span>• {p.completed_jobs || 0} jobs done</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={assigning}
                      onClick={() => handleAssign(p.provider_id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Zap, 
  Wrench, 
  Wind, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  Check
} from 'lucide-react';

export default function EditRequestModal({ 
  isOpen, 
  request, 
  categories = [], 
  onClose, 
  onSave 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request) {
      setTitle(request.title || '');
      setDescription(request.description || '');
      setLocation(request.location || '');
      setPreferredDate(request.preferred_date ? request.preferred_date.split('T')[0] : '');
      setCategoryId(request.category_id || categories[0]?.id || 1);
      setError('');
    }
  }, [request, categories]);

  if (!isOpen || !request) return null;

  const getCategoryDetails = (name) => {
    switch (name) {
      case 'Electrician':
        return {
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          activeBg: 'bg-amber-950/40 border-amber-500 text-white',
        };
      case 'Plumber':
        return {
          icon: <Wrench className="w-4 h-4 text-blue-400" />,
          activeBg: 'bg-blue-950/40 border-blue-500 text-white',
        };
      case 'AC Repair':
        return {
          icon: <Wind className="w-4 h-4 text-teal-400" />,
          activeBg: 'bg-teal-950/40 border-teal-500 text-white',
        };
      default:
        return {
          icon: <Wrench className="w-4 h-4 text-zinc-400" />,
          activeBg: 'bg-zinc-800 border-zinc-600 text-white',
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Title, description, and location are required.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        preferred_date: preferredDate || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update service request.');
    } finally {
      setSaving(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-800 text-white relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400">
              <Edit3 className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Edit Service Request</h3>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  #{request.id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Update the issue description, service trade, or location details while pending.
              </p>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Service Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Service Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                const details = getCategoryDetails(cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`text-left p-3 rounded-xl border-2 transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? `${details.activeBg} shadow-md`
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                        {details.icon}
                      </div>
                      <span className="text-xs font-bold">{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Issue Summary / Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Kitchen sink pipe leaking"
              className="w-full text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Detailed Problem Description <span className="text-red-400">*</span>
            </label>
            <textarea
              rows="3"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be fixed..."
              className="w-full text-sm px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* Location & Preferred Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                Service Location <span className="text-red-400">*</span>
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
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Preferred Date
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

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

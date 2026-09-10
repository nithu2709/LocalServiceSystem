import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';

export default function ReviewModal({ request, onClose, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmitReview({
        request_id: request.id,
        rating,
        comment,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
            Completed Job
          </span>
          <h3 className="text-lg font-bold text-white mt-2">Rate Your Service</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            How was your experience for "{request.title}"?
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-850 text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Selection */}
          <div className="text-center py-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-zinc-300 mt-2">
              {rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Outstanding service!'}
              {rating === 4 && '⭐️⭐️⭐️⭐️ Very good service'}
              {rating === 3 && '⭐️⭐️⭐️ Average experience'}
              {rating === 2 && '⭐️⭐️ Needs improvement'}
              {rating === 1 && '⭐️ Unsatisfactory'}
            </p>
          </div>

          {/* Comment text */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Feedback / Comment (Optional)
            </label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Technician arrived on time, was courteous, and did great work..."
              className="w-full text-xs px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* Assigned Technician Info */}
          {request.provider_name && (
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
              <span>Technician: <strong className="text-white">{request.provider_name}</strong></span>
              <span className="text-[11px] text-zinc-400">{request.category_name}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

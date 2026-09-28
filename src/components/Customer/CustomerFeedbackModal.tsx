import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { useOrderContext } from '../../context/OrderContext';
import {
  Star,
  MessageSquareHeart,
  X,
  CheckCircle2,
  Award,
  Printer,
  Send,
} from 'lucide-react';

interface CustomerFeedbackModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt?: (order: Order) => void;
}

const QUICK_FEEDBACK_TAGS = [
  'Delicious Food',
  'Fast Kitchen Prep',
  'Easy QR Ordering',
  'Great Value',
  'Friendly Service',
  'Clean Table',
];

const RATING_LABELS: Record<number, { title: string; subtitle: string; color: string }> = {
  1: {
    title: 'Needs Improvement',
    subtitle: 'We apologize — tell us how we can make it right.',
    color: 'text-rose-500',
  },
  2: {
    title: 'Fair Experience',
    subtitle: 'What could we improve for your next visit?',
    color: 'text-amber-500',
  },
  3: {
    title: 'Good Experience',
    subtitle: 'Thanks! Let us know what would make it 5 stars.',
    color: 'text-amber-500',
  },
  4: {
    title: 'Great Dining Experience!',
    subtitle: 'We are glad you enjoyed your order!',
    color: 'text-emerald-500',
  },
  5: {
    title: 'Exceptional Dining Experience!',
    subtitle: 'We are thrilled you loved dining with us!',
    color: 'text-emerald-500',
  },
};

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenReceipt,
}) => {
  const { submitCustomerFeedback } = useOrderContext();
  const [rating, setRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Delicious Food', 'Easy QR Ordering']);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && order) {
      setRating(order.feedback?.rating ?? 5);
      setHoveredStar(null);
      setSelectedTags(order.feedback?.tags ?? ['Delicious Food', 'Easy QR Ordering']);
      setComment(order.feedback?.comment ?? '');
      setSubmitted(false);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const activeRating = hoveredStar ?? rating;
  const ratingMeta = RATING_LABELS[activeRating] || RATING_LABELS[5];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCustomerFeedback(order.id, rating, comment, selectedTags);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 my-6">
        {/* Top Payment Confirmed & Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <MessageSquareHeart className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Payment Confirmed · Order #{order.id}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                How was your dining experience?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
            title="Skip feedback"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Your {rating}-star review for Table #{order.tableNumber} has been shared with our team and +15 Bonus Points were added to your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Star Rating Selector */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 text-center space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Table #{order.tableNumber} · Tap a star to rate your experience
              </p>

              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map(star => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      aria-label={`Rate ${star} out of 5 stars`}
                      className="p-1.5 rounded-xl transition transform hover:scale-110 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div>
                <p className={`text-xs font-black ${ratingMeta.color}`}>
                  {ratingMeta.title} ({activeRating}/5)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {ratingMeta.subtitle}
                </p>
              </div>
            </div>

            {/* Quick Highlight Tags */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                What stood out today?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FEEDBACK_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition border ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brief Comment Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Leave a Comment (Optional)
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your thoughts on the food, service, or ordering experience..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white resize-none"
              />
            </div>

            {/* Loyalty Bonus Note */}
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Feedback Reward Bonus</span>
              </div>
              <span className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                +15 PTS
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-black text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95 transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Feedback &amp; Claim +15 PTS</span>
              </button>

              <div className="flex items-center gap-2">
                {onOpenReceipt && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReceipt(order);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-500" />
                    <span>View Digital Receipt</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 px-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

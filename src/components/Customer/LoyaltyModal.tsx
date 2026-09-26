import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { LoyaltyReward } from '../../types';
import {
  Award,
  X,
  Sparkles,
  Ticket,
  Clock,
  CheckCircle2,
  Gift,
  Zap,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  Heart,
  Star,
} from 'lucide-react';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

const AVAILABLE_REWARDS: LoyaltyReward[] = [
  {
    id: 'rew-1',
    title: '$2.00 Order Discount',
    description: 'Instantly deduct $2.00 from your active cart subtotal.',
    pointsCost: 200,
    discountValue: 2.0,
  },
  {
    id: 'rew-2',
    title: 'Free Drink / Dessert ($3.50 Value)',
    description: 'Get $3.50 off your favorite beverage or dessert item.',
    pointsCost: 350,
    discountValue: 3.5,
  },
  {
    id: 'rew-3',
    title: '$5.00 Chef Special Discount',
    description: 'Save $5.00 off any main entree or platter order.',
    pointsCost: 500,
    discountValue: 5.0,
  },
  {
    id: 'rew-4',
    title: '$10.00 VIP Feast Reward',
    description: 'Big $10.00 discount for family dining or group orders.',
    pointsCost: 900,
    discountValue: 10.0,
  },
];

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({ isOpen, onClose, onOpenCart }) => {
  const {
    loyaltyPoints,
    loyaltyHistory,
    redeemedLoyaltyDiscount,
    redeemedLoyaltyPoints,
    applyLoyaltyDiscount,
    cancelLoyaltyDiscount,
    claimBonusLoyaltyPoints,
    cart,
  } = useOrderContext();

  const [activeTab, setActiveTab] = useState<'rewards' | 'history' | 'earn'>('rewards');

  if (!isOpen) return null;

  // Determine Tier Status
  const getTierInfo = (pts: number) => {
    if (pts >= 1000) {
      return {
        name: 'VIP Platinum',
        badgeBg: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
        nextTierName: 'Max Level Reached',
        nextTierPoints: 1000,
        progress: 100,
        multiplier: '2.0x Points',
      };
    } else if (pts >= 500) {
      return {
        name: 'Gold Member',
        badgeBg: 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950',
        nextTierName: 'VIP Platinum',
        nextTierPoints: 1000,
        progress: Math.min(100, Math.round(((pts - 500) / 500) * 100)),
        multiplier: '1.5x Points',
      };
    } else if (pts >= 200) {
      return {
        name: 'Silver Member',
        badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900',
        nextTierName: 'Gold Member',
        nextTierPoints: 500,
        progress: Math.min(100, Math.round(((pts - 200) / 300) * 100)),
        multiplier: '1.2x Points',
      };
    } else {
      return {
        name: 'Bronze Member',
        badgeBg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100',
        nextTierName: 'Silver Member',
        nextTierPoints: 200,
        progress: Math.min(100, Math.round((pts / 200) * 100)),
        multiplier: '1.0x Points',
      };
    }
  };

  const tier = getTierInfo(loyaltyPoints);

  const handleRedeemReward = (reward: LoyaltyReward) => {
    const success = applyLoyaltyDiscount(reward.pointsCost, reward.discountValue);
    if (success && onOpenCart && cart.length > 0) {
      onClose();
      onOpenCart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Gourmet Rewards
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Earn 10 points for every $1 spent on delicious meals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Digital Loyalty Card Box */}
        <div className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950 p-5 text-white shadow-xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start">
            <div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm ${tier.badgeBg}`}>
                <Star className="h-3 w-3 fill-current" /> {tier.name}
              </span>
              <p className="text-[11px] text-amber-300/80 font-medium mt-1">
                Perk: {tier.multiplier} multiplier on all orders
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Balance</p>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl font-black text-amber-400">{loyaltyPoints}</span>
                <span className="text-xs font-extrabold text-amber-300">PTS</span>
              </div>
              <p className="text-[10px] text-slate-400">≈ ${(loyaltyPoints / 100).toFixed(2)} value</p>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
            <div className="flex justify-between text-[10px] font-extrabold text-slate-300">
              <span>Next Tier: {tier.nextTierName}</span>
              <span>{loyaltyPoints} / {tier.nextTierPoints} PTS</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${tier.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Applied Loyalty Voucher Banner */}
        {redeemedLoyaltyDiscount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-extrabold">Active Reward Applied!</p>
                <p className="text-[11px] opacity-90">
                  -${redeemedLoyaltyDiscount.toFixed(2)} off active cart ({redeemedLoyaltyPoints} PTS)
                </p>
              </div>
            </div>
            <button
              onClick={cancelLoyaltyDiscount}
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 transition"
            >
              Remove
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === 'rewards'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Gift className="h-3.5 w-3.5" /> Rewards
          </button>
          <button
            onClick={() => setActiveTab('earn')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === 'earn'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Earn Bonus
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Ledger
          </button>
        </div>

        {/* TAB 1: REWARDS MARKETPLACE */}
        {activeTab === 'rewards' && (
          <div className="mt-3 max-h-[42vh] overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
            {AVAILABLE_REWARDS.map(reward => {
              const canAfford = loyaltyPoints >= reward.pointsCost;
              const isApplied = redeemedLoyaltyPoints === reward.pointsCost;

              return (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    isApplied
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                      : canAfford
                      ? 'border-slate-200 bg-white hover:border-amber-500/50 dark:border-slate-800 dark:bg-slate-950/60'
                      : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-950/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-amber-500 shrink-0" />
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {reward.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {reward.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {reward.pointsCost} PTS
                    </span>

                    {isApplied ? (
                      <span className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => handleRedeemReward(reward)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black transition active:scale-95 ${
                          canAfford
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Redeem' : 'Need Points'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: EARN BONUS POINTS */}
        {activeTab === 'earn' && (
          <div className="mt-3 max-h-[42vh] overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black">
                    🎁
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Daily Check-In Reward</h4>
                    <p className="text-[10px] text-slate-500">Claim your daily 30 bonus points for dining with us!</p>
                  </div>
                </div>
                <button
                  onClick={() => claimBonusLoyaltyPoints(30, 'Daily Check-in Bonus')}
                  className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400 active:scale-95 transition shadow-xs"
                >
                  +30 PTS
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-500 font-black">
                    ⭐
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">30-Sec Foodie Survey</h4>
                    <p className="text-[10px] text-slate-500">Rate our dishes and earn 50 bonus points instantly.</p>
                  </div>
                </div>
                <button
                  onClick={() => claimBonusLoyaltyPoints(50, 'Completed Foodie Survey')}
                  className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-black text-white hover:bg-sky-500 active:scale-95 transition shadow-xs"
                >
                  +50 PTS
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500 font-black">
                    👥
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Refer a Dining Friend</h4>
                    <p className="text-[10px] text-slate-500">Invite friends to Table QR menu and get 100 points.</p>
                  </div>
                </div>
                <button
                  onClick={() => claimBonusLoyaltyPoints(100, 'Referred a Friend Bonus')}
                  className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-black text-white hover:bg-purple-500 active:scale-95 transition shadow-xs"
                >
                  +100 PTS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LEDGER / HISTORY */}
        {activeTab === 'history' && (
          <div className="mt-3 max-h-[42vh] overflow-y-auto space-y-2 pr-1 scrollbar-none">
            {loyaltyHistory.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No point transactions yet.</p>
            ) : (
              loyaltyHistory.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">{tx.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                      tx.points > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points} PTS
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

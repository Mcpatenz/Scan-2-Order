import React, { useRef, useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Plus,
  Flame,
  Gift,
} from 'lucide-react';
import { Product } from '../../types';
import { useOrderContext } from '../../context/OrderContext';
import { TRANSLATIONS } from '../../i18n/customerTranslations';

interface DailySpecialsCarouselProps {
  onCustomizeProduct: (product: Product) => void;
}

interface PromotionalOffer {
  id: string;
  product: Product;
  badgeType: 'daily' | 'bundle' | 'happy_hour' | 'limited';
  discountPct: number;
  originalPrice: number;
  promoPrice: number;
  tagline: string;
  portionsLeft: number;
  bonusPoints: number;
  gradientClass: string;
  badgeClass: string;
}

export const DailySpecialsCarousel: React.FC<DailySpecialsCarouselProps> = ({
  onCustomizeProduct,
}) => {
  const { products, addToCart, customerLanguage, claimBonusLoyaltyPoints } = useOrderContext();
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const t = TRANSLATIONS[customerLanguage] || TRANSLATIONS.en;

  // Build curated daily specials & limited-time promotional items from available products
  const availableProducts = products.filter(
    p => p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0)
  );

  if (availableProducts.length === 0) return null;

  const promoTemplates: Array<{
    badgeType: PromotionalOffer['badgeType'];
    discountPct: number;
    tagline: string;
    portionsLeft: number;
    bonusPoints: number;
    gradientClass: string;
    badgeClass: string;
  }> = [
    {
      badgeType: 'daily',
      discountPct: 20,
      tagline: 'Chef’s #1 Daily Feature • Served hot with signature house glaze & sides',
      portionsLeft: 6,
      bonusPoints: 20,
      gradientClass:
        'from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40',
      badgeClass: 'bg-emerald-500 text-slate-950',
    },
    {
      badgeType: 'bundle',
      discountPct: 18,
      tagline: 'Complete Meal Upgrade • Best paired with our freshly brewed iced tea or fries',
      portionsLeft: 5,
      bonusPoints: 25,
      gradientClass:
        'from-amber-950 via-slate-900 to-slate-950 border-amber-500/40',
      badgeClass: 'bg-amber-400 text-slate-950',
    },
    {
      badgeType: 'limited',
      discountPct: 15,
      tagline: 'Limited-Time Kitchen Special • Handcrafted with premium seasonal ingredients',
      portionsLeft: 4,
      bonusPoints: 15,
      gradientClass:
        'from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/40',
      badgeClass: 'bg-indigo-400 text-slate-950',
    },
    {
      badgeType: 'happy_hour',
      discountPct: 22,
      tagline: 'Dine-In Exclusive Promo • High-value favorite to share at your table',
      portionsLeft: 8,
      bonusPoints: 15,
      gradientClass:
        'from-rose-950 via-slate-900 to-slate-950 border-rose-500/40',
      badgeClass: 'bg-rose-400 text-slate-950',
    },
  ];

  // Prioritize popular or higher-ticket items to drive higher Average Order Value (AOV)
  const prioritizedProducts = [...availableProducts].sort((a, b) => {
    if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
    return b.price - a.price;
  });

  const offers: PromotionalOffer[] = prioritizedProducts
    .slice(0, 4)
    .map((product, index) => {
      const tpl = promoTemplates[index % promoTemplates.length];
      const originalPrice = Number((product.price / (1 - tpl.discountPct / 100)).toFixed(2));
      return {
        id: `special-${product.id}`,
        product,
        badgeType: tpl.badgeType,
        discountPct: tpl.discountPct,
        originalPrice,
        promoPrice: product.price,
        tagline: tpl.tagline,
        portionsLeft: tpl.portionsLeft,
        bonusPoints: tpl.bonusPoints,
        gradientClass: tpl.gradientClass,
        badgeClass: tpl.badgeClass,
      };
    });

  const slide = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: dir === 'left' ? -290 : 290,
      behavior: 'smooth',
    });
  };

  const getBadgeLabel = (type: PromotionalOffer['badgeType']) => {
    switch (type) {
      case 'daily':
        return t.dailySpecialTag;
      case 'bundle':
        return t.chefPairingTag;
      case 'happy_hour':
        return t.happyHourTag;
      case 'limited':
      default:
        return t.limitedTimeTag;
    }
  };

  const handleQuickAddSpecial = (offer: PromotionalOffer) => {
    addToCart({
      product: offer.product,
      quantity: 1,
      selectedModifiers: [],
      notes: `${getBadgeLabel(offer.badgeType)} Promo (+${offer.bonusPoints} Bonus Pts)`,
    });
    claimBonusLoyaltyPoints(
      offer.bonusPoints,
      `Daily Special Promo Bonus (${offer.product.name})`
    );
    setRecentlyAddedId(offer.id);
    setTimeout(() => {
      setRecentlyAddedId(prev => (prev === offer.id ? null : prev));
    }, 1500);
  };

  return (
    <section className="space-y-2.5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white truncate">
              {t.dailySpecialsTitle}
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {t.dailySpecialsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => slide('left')}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95 transition"
            aria-label="Previous special"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => slide('right')}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95 transition"
            aria-label="Next special"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Snap Carousel */}
      <div
        ref={sliderRef}
        className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 snap-x snap-mandatory scrollbar-none"
      >
        {offers.map(offer => {
          const isAdded = recentlyAddedId === offer.id;

          return (
            <div
              key={offer.id}
              className={`snap-start shrink-0 w-[285px] sm:w-[310px] rounded-3xl border bg-gradient-to-br ${offer.gradientClass} p-3.5 text-white shadow-lg flex flex-col justify-between gap-3 relative overflow-hidden`}
            >
              {/* Top Promo Badges Row */}
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${offer.badgeClass}`}
                >
                  <Flame className="h-2.5 w-2.5 fill-current" />
                  {getBadgeLabel(offer.badgeType)} · {t.saveBadgePrefix} {offer.discountPct}%
                </span>

                <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 backdrop-blur-xs border border-white/15 px-2 py-0.5 text-[9px] font-bold text-amber-300 tabular-nums">
                  <Clock className="h-2.5 w-2.5" />
                  {offer.portionsLeft} {t.ordersLeftSuffix}
                </span>
              </div>

              {/* Middle Content: Dish Thumbnail + Details */}
              <div className="flex items-start gap-3">
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0 border border-white/15 bg-slate-800 shadow-md">
                  <img
                    src={offer.product.image}
                    alt={offer.product.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 right-1 rounded-md bg-slate-950/85 backdrop-blur-xs px-1 py-0.5 text-center text-[8px] font-black text-emerald-400">
                    +{offer.bonusPoints} PTS
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black text-white leading-snug line-clamp-1">
                    {offer.product.name}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-slate-300 leading-relaxed line-clamp-2">
                    {offer.tagline}
                  </p>

                  {/* Price & Anchor Comparison */}
                  <div className="mt-2 flex items-baseline gap-1.5 tabular-nums">
                    <span className="text-sm font-black text-emerald-400">
                      ₱{offer.promoPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 line-through">
                      ₱{offer.originalPrice.toFixed(2)}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-300">
                      <Gift className="h-2.5 w-2.5" /> Bonus
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onCustomizeProduct(offer.product)}
                  className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 px-3 py-1.5 text-[11px] font-bold text-slate-200 transition shrink-0"
                >
                  {t.customizeBtn}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddSpecial(offer)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-3 text-[11px] font-black transition active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{t.addedSpecialBtn}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {t.addSpecialBtn} · ₱{offer.promoPrice.toFixed(2)}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Utensils,
  Sparkles,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  Flame,
  Coffee,
  Cookie,
} from 'lucide-react';
import { Product, ModifierOption } from '../../types';
import { useOrderContext } from '../../context/OrderContext';

interface MealComboBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComboAdded?: (comboItem: {
    product: Product;
    quantity: number;
    selectedModifiers: ModifierOption[];
    notes?: string;
  }) => void;
}

export const MealComboBuilderModal: React.FC<MealComboBuilderModalProps> = ({
  isOpen,
  onClose,
  onComboAdded,
}) => {
  const { products, addToCart, showToast } = useOrderContext();

  // Filter available products by category
  const availableMains = useMemo(
    () =>
      products.filter(
        p =>
          p.categoryId === 'cat-mains' &&
          p.inStock &&
          (p.stockQuantity === undefined || p.stockQuantity > 0)
      ),
    [products]
  );

  const availableSides = useMemo(
    () =>
      products.filter(
        p =>
          p.categoryId === 'cat-sides' &&
          p.inStock &&
          (p.stockQuantity === undefined || p.stockQuantity > 0)
      ),
    [products]
  );

  const availableDrinks = useMemo(
    () =>
      products.filter(
        p =>
          p.categoryId === 'cat-beverages' &&
          p.inStock &&
          (p.stockQuantity === undefined || p.stockQuantity > 0)
      ),
    [products]
  );

  const availableDesserts = useMemo(
    () =>
      products.filter(
        p =>
          p.categoryId === 'cat-desserts' &&
          p.inStock &&
          (p.stockQuantity === undefined || p.stockQuantity > 0)
      ),
    [products]
  );

  const [selectedMainId, setSelectedMainId] = useState<string>('');
  const [selectedSideId, setSelectedSideId] = useState<string>('');
  const [selectedDrinkId, setSelectedDrinkId] = useState<string>('');
  const [selectedDessertId, setSelectedDessertId] = useState<string>('none');
  const [sideSize, setSideSize] = useState<'regular' | 'large'>('regular');
  const [drinkSize, setDrinkSize] = useState<'regular' | 'large'>('regular');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Initialize default selections when opened
  useEffect(() => {
    if (isOpen) {
      if (!selectedMainId && availableMains.length > 0) {
        setSelectedMainId(availableMains[0].id);
      }
      if (!selectedSideId && availableSides.length > 0) {
        setSelectedSideId(availableSides[0].id);
      }
      if (!selectedDrinkId && availableDrinks.length > 0) {
        setSelectedDrinkId(availableDrinks[0].id);
      }
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, availableMains, availableSides, availableDrinks]);

  if (!isOpen) return null;

  const selectedMain = availableMains.find(p => p.id === selectedMainId) || availableMains[0];
  const selectedSide = availableSides.find(p => p.id === selectedSideId) || availableSides[0];
  const selectedDrink = availableDrinks.find(p => p.id === selectedDrinkId) || availableDrinks[0];
  const selectedDessert =
    selectedDessertId !== 'none'
      ? availableDesserts.find(p => p.id === selectedDessertId) || null
      : null;

  // Dynamic Price Calculation:
  // Base combo includes shortest-priced side & drink at a 15% bundle discount,
  // and dynamically adjusts as the customer selects different mains, sides, drinks, or size upgrades.
  const minSidePrice = availableSides.length > 0 ? Math.min(...availableSides.map(s => s.price)) : 0;
  const minDrinkPrice = availableDrinks.length > 0 ? Math.min(...availableDrinks.map(d => d.price)) : 0;

  const mainPrice = selectedMain ? selectedMain.price : 0;
  const sidePrice = selectedSide ? selectedSide.price : 0;
  const drinkPrice = selectedDrink ? selectedDrink.price : 0;
  const dessertPrice = selectedDessert ? Number((selectedDessert.price * 0.85).toFixed(2)) : 0;

  const sideSizeUpcharge = sideSize === 'large' ? 1.5 : 0;
  const drinkSizeUpcharge = drinkSize === 'large' ? 1.0 : 0;

  const rawIndividualTotal =
    mainPrice +
    sidePrice +
    drinkPrice +
    (selectedDessert ? selectedDessert.price : 0) +
    sideSizeUpcharge +
    drinkSizeUpcharge;

  // 15% Bundle Savings on the Main + Side + Drink core combo
  const comboSavings = Number(((mainPrice + sidePrice + drinkPrice) * 0.15).toFixed(2));
  const unitComboPrice = Number(Math.max(0, rawIndividualTotal - comboSavings).toFixed(2));
  const totalComboPrice = Number((unitComboPrice * quantity).toFixed(2));

  // Price delta helpers for UI badges
  const getSideDelta = (side: Product) => {
    const diff = Number(((side.price - minSidePrice) * 0.85).toFixed(2));
    return diff > 0 ? `+₱${diff.toFixed(2)}` : 'Included';
  };

  const getDrinkDelta = (drink: Product) => {
    const diff = Number(((drink.price - minDrinkPrice) * 0.85).toFixed(2));
    return diff > 0 ? `+₱${diff.toFixed(2)}` : 'Included';
  };

  const handleConfirmCombo = () => {
    if (!selectedMain || !selectedSide || !selectedDrink) {
      showToast('Please select 1 Main, 1 Side, and 1 Drink to complete your combo.');
      return;
    }

    // Build dynamic modifiers representing the chosen Side, Drink, Upgrades, and Bundle Discount
    const sideAdjustment = Number((sidePrice * 0.85 + sideSizeUpcharge).toFixed(2));
    const drinkAdjustment = Number((drinkPrice * 0.85 + drinkSizeUpcharge).toFixed(2));
    const mainDiscountAdjustment = Number((-mainPrice * 0.15).toFixed(2));

    const comboModifiers: ModifierOption[] = [
      {
        id: `combo-main-disc-${selectedMain.id}`,
        name: `Combo Main: ${selectedMain.name} (15% Combo Deal)`,
        price: mainDiscountAdjustment,
      },
      {
        id: `combo-side-${selectedSide.id}-${sideSize}`,
        name: `Side: ${selectedSide.name}${sideSize === 'large' ? ' (Large +₱1.50)' : ' (Regular)'}`,
        price: sideAdjustment,
      },
      {
        id: `combo-drink-${selectedDrink.id}-${drinkSize}`,
        name: `Drink: ${selectedDrink.name}${drinkSize === 'large' ? ' (Large +₱1.00)' : ' (Regular)'}`,
        price: drinkAdjustment,
      },
    ];

    if (selectedDessert) {
      comboModifiers.push({
        id: `combo-dessert-${selectedDessert.id}`,
        name: `Dessert Add-on: ${selectedDessert.name} (15% Off)`,
        price: dessertPrice,
      });
    }

    const comboProduct: Product = {
      ...selectedMain,
      name: `Custom Meal Combo (${selectedMain.name})`,
    };

    const payload = {
      product: comboProduct,
      quantity,
      selectedModifiers: comboModifiers,
      notes: notes.trim() || undefined,
    };

    if (onComboAdded) {
      onComboAdded(payload);
    } else {
      addToCart(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                    SAVE 15% BUNDLE
                  </span>
                  <span className="text-[10px] font-bold text-emerald-100">
                    Dynamic Price Builder
                  </span>
                </div>
                <h2 className="text-base font-black tracking-tight text-white mt-0.5">
                  Build Your Custom Meal Combo
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-black/20 p-1.5 text-white hover:bg-black/40 transition"
              aria-label="Close Combo Builder"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Live Selection Summary Pills */}
          <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px]">
            <div className="rounded-xl bg-black/25 px-2.5 py-1.5 border border-white/15 truncate">
              <span className="text-emerald-200 block font-bold uppercase text-[8px]">1. Main</span>
              <span className="font-extrabold text-white truncate block">
                {selectedMain?.name || 'Select'}
              </span>
            </div>
            <div className="rounded-xl bg-black/25 px-2.5 py-1.5 border border-white/15 truncate">
              <span className="text-emerald-200 block font-bold uppercase text-[8px]">2. Side</span>
              <span className="font-extrabold text-white truncate block">
                {selectedSide?.name || 'Select'}
              </span>
            </div>
            <div className="rounded-xl bg-black/25 px-2.5 py-1.5 border border-white/15 truncate">
              <span className="text-emerald-200 block font-bold uppercase text-[8px]">3. Drink</span>
              <span className="font-extrabold text-white truncate block">
                {selectedDrink?.name || 'Select'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Builder Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* STEP 1: SELECT 1 MAIN */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                  1
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Choose Your Main Course
                </h3>
              </div>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                Required • Select 1
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {availableMains.map(main => {
                const isSelected = selectedMain?.id === main.id;
                const discountedMainPrice = Number((main.price * 0.85).toFixed(2));
                return (
                  <button
                    key={main.id}
                    type="button"
                    onClick={() => setSelectedMainId(main.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                    }`}
                  >
                    <img
                      src={main.image}
                      alt={main.name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {main.name}
                        </p>
                        {main.isPopular && (
                          <Flame className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {main.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] tabular-nums">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          +₱{discountedMainPrice.toFixed(2)} in combo
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₱{main.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 2: SELECT 1 SIDE + SIZE UPGRADE */}
          <section className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                  2
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Choose Your Side Dish
                </h3>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSideSize('regular')}
                  className={`rounded-lg px-2 py-1 transition ${
                    sideSize === 'regular'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => setSideSize('large')}
                  className={`rounded-lg px-2 py-1 transition ${
                    sideSize === 'large'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Large (+₱1.50)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableSides.map(side => {
                const isSelected = selectedSide?.id === side.id;
                const comboSidePrice = Number((side.price * 0.85).toFixed(2));
                return (
                  <button
                    key={side.id}
                    type="button"
                    onClick={() => setSelectedSideId(side.id)}
                    className={`flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                    }`}
                  >
                    <img
                      src={side.image}
                      alt={side.name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {side.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          +₱{comboSidePrice.toFixed(2)}
                        </span>
                        <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {getSideDelta(side)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 3: SELECT 1 DRINK + SIZE UPGRADE */}
          <section className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                  3
                </span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Choose Your Beverage
                </h3>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDrinkSize('regular')}
                  className={`rounded-lg px-2 py-1 transition ${
                    drinkSize === 'regular'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Regular
                </button>
                <button
                  type="button"
                  onClick={() => setDrinkSize('large')}
                  className={`rounded-lg px-2 py-1 transition ${
                    drinkSize === 'large'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Large (+₱1.00)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableDrinks.map(drink => {
                const isSelected = selectedDrink?.id === drink.id;
                const comboDrinkPrice = Number((drink.price * 0.85).toFixed(2));
                return (
                  <button
                    key={drink.id}
                    type="button"
                    onClick={() => setSelectedDrinkId(drink.id)}
                    className={`flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                    }`}
                  >
                    <img
                      src={drink.image}
                      alt={drink.name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {drink.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          +₱{comboDrinkPrice.toFixed(2)}
                        </span>
                        <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {getDrinkDelta(drink)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* OPTIONAL STEP 4: ADD DESSERT (15% OFF) */}
          {availableDesserts.length > 0 && (
            <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Cookie className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Sweet Finish Add-On (Optional • 15% Off)
                  </h3>
                </div>
                {selectedDessertId !== 'none' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDessertId('none')}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {availableDesserts.map(dessert => {
                  const isSelected = selectedDessertId === dessert.id;
                  const discPrice = Number((dessert.price * 0.85).toFixed(2));
                  return (
                    <button
                      key={dessert.id}
                      type="button"
                      onClick={() =>
                        setSelectedDessertId(isSelected ? 'none' : dessert.id)
                      }
                      className={`flex items-center gap-2 shrink-0 rounded-xl border p-2 text-left transition ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                      }`}
                    >
                      <img
                        src={dessert.image}
                        alt={dessert.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                          {dessert.name}
                        </p>
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          +₱{discPrice.toFixed(2)}{' '}
                          <span className="line-through text-slate-400 font-normal">
                            ₱{dessert.price.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Special Notes */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
              Combo Special Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Less ice on drink, sauce on the side..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Dynamic Price Breakdown & Action Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Regular Price:
                </span>
                <span className="text-[11px] text-slate-400 line-through tabular-nums">
                  ₱{(rawIndividualTotal * quantity).toFixed(2)}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-2.5 w-2.5" /> Save ₱{(comboSavings * quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                Combo Total: <span className="text-emerald-600 dark:text-emerald-400">₱{totalComboPrice.toFixed(2)}</span>
              </p>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-xs font-black tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmCombo}
            className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Add Custom Meal Combo to Order</span>
            </div>
            <span className="text-sm font-black tabular-nums">₱{totalComboPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

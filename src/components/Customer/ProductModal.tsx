import React, { useState, useEffect } from 'react';
import { Product, CartItemModifier } from '../../types';
import { useOrderContext } from '../../context/OrderContext';
import { Plus, Minus, X, Flame, Clock, MessageSquare, Check, Sparkles } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useOrderContext();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<CartItemModifier[]>([]);
  const [specialNotes, setSpecialNotes] = useState<string>('');

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSpecialNotes('');

      // Auto-select required modifier defaults if available
      const defaultMods: CartItemModifier[] = [];
      if (product.modifierGroups) {
        product.modifierGroups.forEach(group => {
          if (group.required && group.options.length > 0) {
            defaultMods.push({
              groupId: group.id,
              groupName: group.name,
              optionId: group.options[0].id,
              optionName: group.options[0].name,
              price: group.options[0].price,
            });
          }
        });
      }
      setSelectedModifiers(defaultMods);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleModifierToggle = (
    groupId: string,
    groupName: string,
    isRequired: boolean,
    optionId: string,
    optionName: string,
    price: number
  ) => {
    if (isRequired) {
      // Replace existing selection in required group
      setSelectedModifiers(prev => [
        ...prev.filter(m => m.groupId !== groupId),
        { groupId, groupName, optionId, optionName, price },
      ]);
    } else {
      // Toggle optional modifier
      setSelectedModifiers(prev => {
        const exists = prev.some(m => m.groupId === groupId && m.optionId === optionId);
        if (exists) {
          return prev.filter(m => !(m.groupId === groupId && m.optionId === optionId));
        } else {
          return [...prev, { groupId, groupName, optionId, optionName, price }];
        }
      });
    }
  };

  const isModifierSelected = (groupId: string, optionId: string) => {
    return selectedModifiers.some(m => m.groupId === groupId && m.optionId === optionId);
  };

  // Calculate unit and total prices
  const modifierExtraCost = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const unitPrice = product.price + modifierExtraCost;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart({
      product,
      quantity,
      selectedModifiers,
      notes: specialNotes.trim() || undefined,
    });
    onClose();
  };

  const maxStock = product.stockQuantity !== undefined ? product.stockQuantity : (product.inStock ? 99 : 0);
  const isOutOfStock = !product.inStock || maxStock <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-slideUp">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {product.isPopular && !isOutOfStock && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Flame className="h-3.5 w-3.5" /> Popular Choice
              </span>
            )}
            {isOutOfStock ? (
              <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                Out of Stock
              </span>
            ) : product.stockQuantity !== undefined && product.stockQuantity <= (product.lowStockThreshold ?? 5) ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                Only {product.stockQuantity} Left
              </span>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product Image */}
        <div className="relative my-4 aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-2 left-2 flex gap-2">
            {product.calories && (
              <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                {product.calories} kcal
              </span>
            )}
            {product.prepTimeMinutes && (
              <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                <Clock className="h-3 w-3 text-amber-400" /> ~{product.prepTimeMinutes} mins
              </span>
            )}
          </div>
        </div>

        {/* Product Title & Price */}
        <div>
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h2>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 ml-2">
              ${unitPrice.toFixed(2)}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Modifiers List */}
        {product.modifierGroups && product.modifierGroups.length > 0 && (
          <div className="mt-5 space-y-4">
            {product.modifierGroups.map(group => (
              <div key={group.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {group.name}
                  </h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    group.required ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {group.required ? 'Required (Pick 1)' : 'Optional'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.options.map(opt => {
                    const selected = isModifierSelected(group.id, opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleModifierToggle(
                            group.id,
                            group.name,
                            group.required,
                            opt.id,
                            opt.name,
                            opt.price
                          )
                        }
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition border ${
                          selected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {selected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span>{opt.name}</span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            +${opt.price.toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Special Instructions Note Input */}
        <div className="mt-4">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            Special Kitchen Instructions:
          </label>
          <input
            type="text"
            placeholder="e.g., Less salt, extra sauce, allergy warnings..."
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Bottom Quantity Stepper & Add Button */}
        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-950">
            <button
              disabled={isOutOfStock || quantity <= 1}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs hover:bg-slate-100 disabled:opacity-40 dark:bg-slate-800 dark:text-white"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-extrabold text-slate-900 dark:text-white">
              {isOutOfStock ? 0 : quantity}
            </span>
            <button
              disabled={isOutOfStock || quantity >= maxStock}
              onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs hover:bg-slate-100 disabled:opacity-40 dark:bg-slate-800 dark:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Order Button */}
          <button
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-between rounded-xl px-4 py-3 text-xs font-extrabold shadow-lg transition ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95'
            }`}
          >
            <span>{isOutOfStock ? 'Item Out of Stock' : 'Add to Cart'}</span>
            <span>${isOutOfStock ? '0.00' : totalPrice.toFixed(2)}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

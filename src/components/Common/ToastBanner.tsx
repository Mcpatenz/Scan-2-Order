import React from 'react';
import { Sparkles } from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';

export const ToastBanner: React.FC = () => {
  const { toastMessage } = useOrderContext();

  if (!toastMessage) return null;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-2 animate-fadeIn">
      <Sparkles className="h-4 w-4 animate-spin" />
      <span>{toastMessage}</span>
    </div>
  );
};

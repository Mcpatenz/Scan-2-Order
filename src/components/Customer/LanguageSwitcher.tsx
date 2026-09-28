import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  CUSTOMER_LANGUAGES,
  CustomerLanguage,
} from '../../i18n/customerTranslations';
import { useOrderContext } from '../../context/OrderContext';

export const LanguageSwitcher: React.FC = () => {
  const { customerLanguage, setCustomerLanguage, showToast } = useOrderContext();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeLang =
    CUSTOMER_LANGUAGES.find(l => l.code === customerLanguage) || CUSTOMER_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleSelectLanguage = (code: CustomerLanguage) => {
    const selected = CUSTOMER_LANGUAGES.find(l => l.code === code);
    setCustomerLanguage(code);
    setOpen(false);
    if (selected) {
      showToast(`${selected.flag} Language switched to ${selected.nativeName} (${selected.name})`);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/90 px-2.5 py-1.5 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 active:scale-95 transition"
        title="Switch App Language / Localization"
        aria-label="Switch Language"
      >
        <Globe className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>{activeLang.shortLabel}</span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl z-50 animate-fadeIn">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Select Language
            </p>
          </div>
          <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto scrollbar-none">
            {CUSTOMER_LANGUAGES.map(lang => {
              const isSelected = lang.code === customerLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black'
                      : 'text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm leading-none shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className="text-xs leading-tight truncate">{lang.nativeName}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {lang.name}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

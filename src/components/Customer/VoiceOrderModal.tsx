import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Product, CartItemModifier } from '../../types';
import { playChime } from '../../utils/audio';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Volume2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Wand2,
} from 'lucide-react';

interface VoiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

interface ParsedVoiceItem {
  product: Product;
  quantity: number;
  selectedModifiers: CartItemModifier[];
  notes?: string;
  unitPrice: number;
  isOutOfStock: boolean;
}

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  single: 1,
  two: 2,
  couple: 2,
  pair: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const PRODUCT_KEYWORDS: Array<{ productId: string; keywords: string[] }> = [
  {
    productId: 'prod-1',
    keywords: ['grilled flame chicken', 'flame chicken', 'chicken breast', 'grilled chicken'],
  },
  {
    productId: 'prod-2',
    keywords: ['classic angus', 'angus beef', 'cheeseburger', 'burger', 'beef burger'],
  },
  {
    productId: 'prod-3',
    keywords: ['truffle cream', 'penne pasta', 'truffle pasta', 'pasta'],
  },
  {
    productId: 'prod-4',
    keywords: ['loaded garlic', 'parmesan fries', 'garlic fries', 'french fries', 'fries'],
  },
  {
    productId: 'prod-5',
    keywords: ['buffalo chicken wings', 'buffalo wings', 'chicken wings', 'wings'],
  },
  {
    productId: 'prod-6',
    keywords: ['iced spanish latte', 'spanish latte', 'latte', 'iced coffee', 'coffee'],
  },
  {
    productId: 'prod-7',
    keywords: ['passionfruit', 'peach iced tea', 'iced tea', 'peach tea'],
  },
  {
    productId: 'prod-8',
    keywords: ['molten lava', 'chocolate cake', 'lava cake', 'cake'],
  },
  {
    productId: 'prod-9',
    keywords: ['matchamisu', 'tiramisu', 'matcha'],
  },
];

const SAMPLE_VOICE_COMMANDS = [
  'Two Classic Angus Beef Cheeseburgers with bacon and one Loaded Garlic Parmesan Fries',
  'One Grilled Flame Chicken Breast extra spicy and two Iced Spanish Lattes less sweet',
  'One Crispy Buffalo Chicken Wings, one Peach Iced Tea, and one Molten Lava Chocolate Cake',
];

export const VoiceOrderModal: React.FC<VoiceOrderModalProps> = ({
  isOpen,
  onClose,
  onOpenCart,
}) => {
  const { products, addToCart, showToast, soundEnabled, canOrder } = useOrderContext();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(12).fill(15));
  const [manualAdjustments, setManualAdjustments] = useState<
    Record<string, { quantity?: number; removed?: boolean }>
  >({});

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop microphone & audio analyzer cleanly
  const stopListening = () => {
    setIsListening(false);
    setInterimTranscript('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    setAudioLevels(new Array(12).fill(15));
  };

  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateBars = () => {
        analyser.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        for (let i = 0; i < 12; i++) {
          const val = dataArray[i] || 0;
          bars.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
        }
        setAudioLevels(bars);
        animFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch (err: any) {
      // Visualizer is optional if SpeechRecognition is handling mic or permission was denied
      console.warn('Microphone visualizer stream error:', err);
    }
  };

  const startListening = () => {
    setMicError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError(
        'Voice recognition is not supported in this browser. You can type or tap a sample voice phrase below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (soundEnabled) playChime('click');
        startVisualizer();
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += text + ' ';
          } else {
            interimChunk += text;
          }
        }

        if (finalChunk) {
          setTranscript(prev => {
            const combined = `${prev} ${finalChunk}`.replace(/\s+/g, ' ').trim();
            return combined;
          });
          setManualAdjustments({});
        }
        setInterimTranscript(interimChunk);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicError(
            'Microphone access was blocked. Please allow microphone permissions or use the quick voice phrases below.'
          );
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setMicError(`Voice recognition issue (${event.error}). Try speaking again.`);
        }
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setMicError('Could not start microphone recognition. Please try again.');
      stopListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Parse natural language transcript into structured cart items
  const parsedItems = useMemo<ParsedVoiceItem[]>(() => {
    const fullText = `${transcript} ${interimTranscript}`.trim().toLowerCase();
    if (!fullText) return [];

    // Split into segments on "and", "plus", "also", "with a", commas
    const clauses = fullText
      .split(/\b(?:and|plus|also|then)\b|[,;]/gi)
      .map(s => s.trim())
      .filter(Boolean);

    const detectedMap = new Map<string, ParsedVoiceItem>();

    // Helper to extract quantity near a matched phrase
    const extractQuantity = (text: string): number => {
      const digitMatch = text.match(/\b(\d+)\s*(?:x|orders?\s+of|pieces?\s+of)?\b/);
      if (digitMatch) {
        const n = parseInt(digitMatch[1], 10);
        if (n > 0 && n <= 20) return n;
      }
      for (const [word, num] of Object.entries(WORD_NUMBERS)) {
        const reg = new RegExp(`\\b${word}\\b`, 'i');
        if (reg.test(text)) return num;
      }
      return 1;
    };

    // Helper to resolve modifiers for a product from spoken text
    const resolveModifiers = (product: Product, text: string): CartItemModifier[] => {
      if (!product.modifierGroups) return [];
      const mods: CartItemModifier[] = [];

      product.modifierGroups.forEach(group => {
        let matchedOption = group.options.find(opt => {
          const optWords = opt.name
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3);
          return optWords.some(w => text.includes(w));
        });

        if (!matchedOption && group.required && group.options.length > 0) {
          matchedOption = group.options[0];
        }

        if (matchedOption) {
          mods.push({
            groupId: group.id,
            groupName: group.name,
            optionId: matchedOption.id,
            optionName: matchedOption.name,
            price: matchedOption.price,
          });
        }
      });

      return mods;
    };

    // Helper to extract special kitchen notes
    const extractNotes = (text: string): string | undefined => {
      const notePatterns = [
        /\bno\s+[a-z]+/gi,
        /\bextra\s+(?:sauce|ice|crispy|napkins|dip)/gi,
        /\bless\s+(?:salt|ice|oil|spicy)/gi,
      ];
      const matches: string[] = [];
      notePatterns.forEach(pat => {
        const found = text.match(pat);
        if (found) matches.push(...found);
      });
      return matches.length > 0 ? matches.join(', ') : undefined;
    };

    const scanClause = (clause: string) => {
      for (const entry of PRODUCT_KEYWORDS) {
        const matchedKw = entry.keywords.find(kw => clause.includes(kw));
        if (matchedKw) {
          // Avoid matching "garlic fries" as standalone prod-4 if clause already matched prod-1 with side of garlic fries
          if (
            entry.productId === 'prod-4' &&
            detectedMap.has('prod-1') &&
            clause.includes('chicken')
          ) {
            continue;
          }

          const prod = products.find(p => p.id === entry.productId);
          if (!prod) continue;

          const adj = manualAdjustments[prod.id];
          if (adj?.removed) continue;

          const qty = adj?.quantity ?? extractQuantity(clause);
          const modifiers = resolveModifiers(prod, clause);
          const notes = extractNotes(clause);
          const modSum = modifiers.reduce((s, m) => s + m.price, 0);
          const unitPrice = prod.price + modSum;
          const isOutOfStock =
            !prod.inStock || (prod.stockQuantity !== undefined && prod.stockQuantity <= 0);

          if (detectedMap.has(prod.id)) {
            const existing = detectedMap.get(prod.id)!;
            if (adj?.quantity === undefined) {
              existing.quantity += qty;
            }
          } else {
            detectedMap.set(prod.id, {
              product: prod,
              quantity: qty,
              selectedModifiers: modifiers,
              notes,
              unitPrice,
              isOutOfStock,
            });
          }
        }
      }
    };

    clauses.forEach(scanClause);

    // Also scan full products list by name words if nothing matched via keywords
    if (detectedMap.size === 0) {
      products.forEach(prod => {
        const adj = manualAdjustments[prod.id];
        if (adj?.removed) return;

        const nameLower = prod.name.toLowerCase();
        const significantWords = nameLower.split(/\s+/).filter(w => w.length >= 4);
        if (significantWords.some(w => fullText.includes(w))) {
          const qty = adj?.quantity ?? extractQuantity(fullText);
          const modifiers = resolveModifiers(prod, fullText);
          const modSum = modifiers.reduce((s, m) => s + m.price, 0);
          const isOutOfStock =
            !prod.inStock || (prod.stockQuantity !== undefined && prod.stockQuantity <= 0);

          detectedMap.set(prod.id, {
            product: prod,
            quantity: qty,
            selectedModifiers: modifiers,
            notes: extractNotes(fullText),
            unitPrice: prod.price + modSum,
            isOutOfStock,
          });
        }
      });
    }

    return Array.from(detectedMap.values());
  }, [transcript, interimTranscript, products, manualAdjustments]);

  if (!isOpen) return null;

  const adjustItemQty = (productId: string, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      setManualAdjustments(prev => ({
        ...prev,
        [productId]: { removed: true },
      }));
    } else {
      setManualAdjustments(prev => ({
        ...prev,
        [productId]: { quantity: nextQty, removed: false },
      }));
    }
  };

  const availableParsedItems = parsedItems.filter(i => !i.isOutOfStock);
  const totalVoiceOrderPrice = availableParsedItems.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  const handleAddAllToCart = () => {
    if (!canOrder) {
      showToast('🔒 Please scan your table QR code or sign in first to add items.');
      return;
    }

    if (availableParsedItems.length === 0) {
      showToast('⚠️ No available menu items detected yet. Try speaking a dish name!');
      return;
    }

    stopListening();

    availableParsedItems.forEach(item => {
      addToCart({
        product: item.product,
        quantity: item.quantity,
        selectedModifiers: item.selectedModifiers,
        notes: item.notes,
      });
    });

    const totalCount = availableParsedItems.reduce((s, i) => s + i.quantity, 0);
    showToast(`🎙️ Added ${totalCount} voice-ordered item(s) to your cart!`);
    if (soundEnabled) playChime('success');

    setTranscript('');
    setInterimTranscript('');
    setManualAdjustments({});
    onClose();
    if (onOpenCart) onOpenCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}
            >
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Voice-to-Text Ordering
                </h3>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                  Hands-Free
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Speak dish names, quantities, and modifiers to build your order
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Microphone Visualizer & Trigger Center */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-5 text-center text-white border border-slate-800 shadow-inner space-y-3">
          {/* Audio Waveform Bars */}
          <div className="flex items-center justify-center gap-1.5 h-10">
            {audioLevels.map((lvl, idx) => (
              <div
                key={idx}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isListening ? 'bg-emerald-400' : 'bg-slate-700'
                }`}
                style={{
                  height: isListening ? `${Math.max(16, lvl)}%` : '20%',
                }}
              />
            ))}
          </div>

          {/* Main Mic Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full font-black transition active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/40 ring-4 ring-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30 hover:bg-emerald-400'
              }`}
              title={isListening ? 'Stop Listening' : 'Start Speaking Order'}
            >
              {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-black tracking-tight">
              {isListening ? 'Listening... Speak your order now' : 'Tap the microphone to start speaking'}
            </p>
            <p className="text-[10px] text-slate-400">
              Try saying: &ldquo;Two Angus Cheeseburgers and one Iced Spanish Latte&rdquo;
            </p>
          </div>
        </div>

        {/* Error Alert if Mic Blocked or Unsupported */}
        {micError && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <span>{micError}</span>
          </div>
        )}

        {/* Live Transcript Input / Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-emerald-500" /> Recognized Voice Transcript
            </label>
            {(transcript || interimTranscript) && (
              <button
                type="button"
                onClick={() => {
                  setTranscript('');
                  setInterimTranscript('');
                  setManualAdjustments({});
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={
              interimTranscript
                ? `${transcript}${transcript ? ' ' : ''}${interimTranscript}`
                : transcript
            }
            onChange={e => {
              setTranscript(e.target.value);
              setInterimTranscript('');
              setManualAdjustments({});
            }}
            placeholder="Your spoken words will appear here in real time (or type a phrase to test)..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Sample Voice Phrases for Instant Testing */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Wand2 className="h-3 w-3 text-emerald-500" /> Quick Voice Command Examples
          </p>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_VOICE_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTranscript(cmd);
                  setInterimTranscript('');
                  setManualAdjustments({});
                  if (soundEnabled) playChime('click');
                }}
                className="text-left rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-medium text-slate-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 transition"
              >
                &ldquo;{cmd}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Detected Menu Items Preview */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Detected Menu Items ({parsedItems.length})
            </span>
            {availableParsedItems.length > 0 && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                Subtotal: ₱{totalVoiceOrderPrice.toFixed(2)}
              </span>
            )}
          </div>

          {parsedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-400">
                No dishes matched yet. Speak any dish name from our menu!
              </p>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {parsedItems.map(item => (
                <div
                  key={item.product.id}
                  className={`flex items-center justify-between gap-2.5 rounded-2xl border p-2.5 text-xs ${
                    item.isOutOfStock
                      ? 'border-rose-500/30 bg-rose-500/5 opacity-70'
                      : 'border-emerald-500/30 bg-emerald-500/5 dark:bg-slate-950'
                  }`}
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-11 w-11 rounded-xl object-cover shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-slate-900 dark:text-white truncate">
                        {item.product.name}
                      </h4>
                      {item.isOutOfStock && (
                        <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                          Sold Out
                        </span>
                      )}
                    </div>

                    {item.selectedModifiers.length > 0 && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.selectedModifiers.map(m => m.optionName).join(', ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[10px] italic text-amber-600 dark:text-amber-400">
                        Note: {item.notes}
                      </p>
                    )}

                    <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₱{(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  {!item.isOutOfStock && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          adjustItemQty(item.product.id, item.quantity, -1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="h-3 w-3 text-rose-500" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                      </button>
                      <span className="w-5 text-center font-black text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          adjustItemQty(item.product.id, item.quantity, 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Add to Cart Button */}
        <button
          type="button"
          disabled={availableParsedItems.length === 0}
          onClick={handleAddAllToCart}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>
            {availableParsedItems.length > 0
              ? `Add ${availableParsedItems.reduce((s, i) => s + i.quantity, 0)} Item(s) to Cart • ₱${totalVoiceOrderPrice.toFixed(2)}`
              : 'Speak Dish Names to Add to Cart'}
          </span>
        </button>
      </div>
    </div>
  );
};

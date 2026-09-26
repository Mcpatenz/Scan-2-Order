import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useOrderContext } from '../../context/OrderContext';
import { Table } from '../../types';
import {
  Camera,
  X,
  QrCode,
  Flashlight,
  CheckCircle2,
  AlertCircle,
  Upload,
  SwitchCamera,
  RefreshCw,
} from 'lucide-react';
import { playChime } from '../../utils/audio';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const { tables, selectTableByNumber, activeTable, showToast, soundEnabled } = useOrderContext();

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Scanning State
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [scannedTableSuccess, setScannedTableSuccess] = useState<Table | null>(null);
  const [unrecognizedQrString, setUnrecognizedQrString] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check camera enumeration
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(err => console.warn('Enumerate devices error:', err));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Helper to extract table from any QR string
  const resolveTableFromQrString = (qrRaw: string): Table | null => {
    const raw = qrRaw.trim();
    if (!raw) return null;

    // 1. Check URL parameters e.g., http://host/?table=05 or ?table=5
    let extractedNumber: string | null = null;
    try {
      if (raw.includes('?')) {
        const urlObj = new URL(raw.startsWith('http') ? raw : `http://localhost/${raw}`);
        extractedNumber = urlObj.searchParams.get('table');
      }
    } catch {
      // Ignore URL parse error
    }

    if (!extractedNumber) {
      const matchParam = raw.match(/table[=\s#:_]*([A-Za-z0-9]+)/i);
      if (matchParam && matchParam[1]) {
        extractedNumber = matchParam[1];
      }
    }

    // 2. Check JSON payload e.g. {"table": "05"}
    if (!extractedNumber && (raw.startsWith('{') || raw.startsWith('['))) {
      try {
        const parsed = JSON.parse(raw);
        extractedNumber = parsed.table || parsed.tableNumber || parsed.id || null;
      } catch {
        // Ignore JSON error
      }
    }

    // 3. Fallback to raw string
    if (!extractedNumber) {
      extractedNumber = raw;
    }

    const cleanNumber = extractedNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // Match against registered tables
    const matched = tables.find(t => {
      const tNumClean = t.tableNumber.toLowerCase();
      const tNumPadded = t.tableNumber.padStart(2, '0').toLowerCase();
      const tIdClean = t.id.toLowerCase();

      return (
        tNumClean === cleanNumber ||
        tNumPadded === cleanNumber ||
        tIdClean === cleanNumber ||
        `table${tNumClean}` === cleanNumber ||
        `table${tNumPadded}` === cleanNumber
      );
    });

    return matched || null;
  };

  const handleSuccessfulScan = (matchedTable: Table) => {
    stopCamera();
    setScannedTableSuccess(matchedTable);
    selectTableByNumber(matchedTable.tableNumber);

    if (soundEnabled) {
      playChime('order_ready');
    }

    showToast(`🎉 Scanned QR Code! Assigned to Table #${matchedTable.tableNumber}`);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Process canvas frames using jsQR
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const matched = resolveTableFromQrString(code.data);
        if (matched) {
          handleSuccessfulScan(matched);
          return;
        } else {
          setUnrecognizedQrString(code.data);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  }, [tables, soundEnabled]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    setUnrecognizedQrString(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported on this browser context.');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (primaryErr) {
        console.warn('Primary camera constraints failed, attempting fallback constraints:', primaryErr);
        // Fallback to basic video constraint if ideal facingMode or resolution fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Play video failed:', e));
          if (!animFrameIdRef.current) {
            animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
          }
        };
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera permission blocked or device unavailable. Upload a QR image or pick a table below.');
      setCameraActive(false);
    }
  };

  // Ensure stream is attached to video ref once camera becomes active and video element mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Play video failed:', e));
          if (!animFrameIdRef.current) {
            animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
          }
        };
      }
    }
  }, [cameraActive, scanVideoFrame]);

  // Handle modal visibility
  useEffect(() => {
    if (isOpen) {
      setScannedTableSuccess(null);
      setUnrecognizedQrString(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const switchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities() as unknown as { torch?: boolean };
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
          });
          setTorchOn(!torchOn);
        } catch (e) {
          console.warn('Torch constraint error:', e);
        }
      } else {
        showToast('Flashlight toggle not supported on this camera lens.');
      }
    }
  };

  // Image Upload Scanner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFrame(true);
    setUnrecognizedQrString(null);

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingFrame(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingFrame(false);

        if (code && code.data) {
          const matched = resolveTableFromQrString(code.data);
          if (matched) {
            handleSuccessfulScan(matched);
          } else {
            setUnrecognizedQrString(code.data);
            showToast(`QR scanned: "${code.data}", but no matching table registered.`);
          }
        } else {
          showToast('No valid QR code detected in the uploaded image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectTableDirectly = (tblNumber: string) => {
    const matched = tables.find(t => t.tableNumber === tblNumber);
    if (matched) {
      handleSuccessfulScan(matched);
    } else {
      selectTableByNumber(tblNumber);
      stopCamera();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-5 text-white shadow-2xl border border-slate-800 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Device Camera QR Scanner</h3>
              <p className="text-[10px] text-slate-400">Scan table QR flyer to pair your session</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Successful Assignment Banner Overlay */}
        {scannedTableSuccess ? (
          <div className="my-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-scaleUp">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-slate-950 mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-black text-white">
              Table #{scannedTableSuccess.tableNumber} Assigned!
            </h4>
            <p className="text-xs text-emerald-300">
              {scannedTableSuccess.name} • {scannedTableSuccess.section}
            </p>
            <p className="text-[10px] text-slate-400">
              Your digital menu session is now tied to Table #{scannedTableSuccess.tableNumber}.
            </p>
          </div>
        ) : (
          <>
            {/* Camera Viewfinder Box */}
            <div className="relative my-4 aspect-square w-full rounded-2xl bg-black overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cameraActive ? "h-full w-full object-cover" : "hidden"}
              />

              {cameraActive ? (
                <>
                  {/* Scan Frame Target Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative h-48 w-48 rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_35px_rgba(52,211,153,0.35)]">
                      {/* Corner Markers */}
                      <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md"></div>
                      <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md"></div>
                      <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md"></div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md"></div>

                      {/* Laser Line */}
                      <div className="h-0.5 w-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[bounce_1.8s_infinite]"></div>
                    </div>
                  </div>

                  {/* Status Indicator Bar */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Camera Active
                    </span>
                    <span className="text-slate-400">Align QR in square</span>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {hasMultipleCameras && (
                      <button
                        onClick={switchCameraFacing}
                        className="rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-800 backdrop-blur-md border border-slate-700/50 transition"
                        title="Switch Camera Lens"
                      >
                        <SwitchCamera className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={toggleTorch}
                      className={`rounded-full p-2 backdrop-blur-md border transition ${
                        torchOn
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900/80 text-white border-slate-700/50 hover:bg-slate-800'
                      }`}
                      title="Toggle Flashlight"
                    >
                      <Flashlight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 mx-auto text-emerald-400 border border-slate-800 shadow-inner">
                    <QrCode className="h-8 w-8 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      {cameraError || 'Initializing device camera feed...'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      You can also upload a photo of a QR code or select a table directly.
                    </p>
                  </div>
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* Unrecognized QR Alert Message */}
            {unrecognizedQrString && !scannedTableSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Scanned Payload: "{unrecognizedQrString}"</p>
                  <p className="text-[10px] opacity-80">
                    This QR does not match any registered table ID. Please select your table below.
                  </p>
                </div>
              </div>
            )}

            {/* Actions: Image Upload & Table Simulator */}
            <div className="space-y-3">
              {/* Image Upload Option */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  disabled={isProcessingFrame}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 py-2 px-3 text-xs font-bold text-slate-200 border border-slate-700/80 transition active:scale-95"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{isProcessingFrame ? 'Processing Image...' : 'Upload QR Code Image'}</span>
                </button>
              </div>

              {/* Quick Table Simulator Picker */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Current Active Table:</span>
                  <span className="text-emerald-400 font-extrabold">Table #{activeTable.tableNumber}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 scrollbar-none">
                  {tables.map(tbl => {
                    const isCurrent = activeTable.tableNumber === tbl.tableNumber;

                    return (
                      <button
                        key={tbl.id}
                        onClick={() => handleSelectTableDirectly(tbl.tableNumber)}
                        className={`flex items-center justify-between rounded-xl border p-2 text-left transition active:scale-95 ${
                          isCurrent
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-black">Table #{tbl.tableNumber}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[80px]">{tbl.section}</p>
                        </div>
                        {isCurrent ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="text-[9px] font-extrabold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                            Assign
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

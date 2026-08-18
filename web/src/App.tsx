import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  Pipette,
  Lock,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Play,
  Pause,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  autoTuneCloakColor,
  validateBackgroundQuality,
  processInvisibleCloakFrame,
  HsvRange
} from './utils/cvEngine';

export default function App() {
  // Camera & Stream State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Application Workflow States
  const [hasBackground, setHasBackground] = useState<boolean>(false);
  const [hasColorSelected, setHasColorSelected] = useState<boolean>(false);
  const [isSelectingColor, setIsSelectingColor] = useState<boolean>(false);
  const [isInvisibleMode, setIsInvisibleMode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Click "Allow Camera & Start" to begin.');

  // Countdown & Modals
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [showBgSuccessModal, setShowBgSuccessModal] = useState<boolean>(false);
  const [bgQualityError, setBgQualityError] = useState<string | null>(null);
  const [showColorSuccessModal, setShowColorSuccessModal] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);

  // Auto-Tuned Internal Parameters (Not exposed numerically in UI)
  const [selectedRgbHex, setSelectedRgbHex] = useState<string | null>(null);
  const [hsvRanges, setHsvRanges] = useState<HsvRange[] | null>(null);
  const [bgSensitivity, setBgSensitivity] = useState<number>(22);

  // Element & Buffer Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageDataRef = useRef<ImageData | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Start Camera Stream with explicit user action
  const requestCamera = async () => {
    setCameraError(null);
    setStatusMessage('Requesting camera permission...');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('BROWSER_UNSUPPORTED');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false // STRICTLY NO AUDIO REQUESTED
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setStatusMessage('Camera ready. Move out of frame and click "Capture Background".');
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      setIsCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser address bar and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam device was detected on your system. Please attach a camera and retry.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Your camera is currently being used by another application (Zoom, Teams, Skype, etc.). Please close it and retry.');
      } else {
        setCameraError('Failed to access camera stream. Please verify browser permissions and HTTPS connection.');
      }
      setStatusMessage('Camera unavailable.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsInvisibleMode(false);
    setIsSelectingColor(false);
    setHasBackground(false);
    setHasColorSelected(false);
    setStatusMessage('Camera stopped.');
  };

  // Start Guided Background Capture Sequence (Get ready... 3, 2, 1)
  const startBackgroundCaptureSequence = () => {
    if (!isCameraActive) return;

    setStatusMessage('Get ready... Move out of the camera frame!');
    setCountdownNum(3);
  };

  // Execute Background Countdown & Capture
  useEffect(() => {
    if (countdownNum === null) return;

    if (countdownNum > 0) {
      const timer = setTimeout(() => {
        setCountdownNum(countdownNum - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdownNum === 0) {
      // Execute capture
      performBackgroundCapture();
      setCountdownNum(null);
    }
  }, [countdownNum]);

  const performBackgroundCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    tempCtx.save();
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    tempCtx.restore();

    const capturedData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    // Automatic Quality Check
    const qualityResult = validateBackgroundQuality(capturedData);

    if (!qualityResult.isValid) {
      setBgQualityError(qualityResult.reason || 'Background capture was not reliable. Please move out of frame and try again.');
      setHasBackground(false);
      setStatusMessage('Background capture failed.');
      return;
    }

    bgImageDataRef.current = capturedData;
    setHasBackground(true);
    setBgQualityError(null);
    setShowBgSuccessModal(true);
    setStatusMessage('Background captured ✓');
  };

  // Enable Color Selection Mode
  const enableColorSelection = () => {
    if (!isCameraActive || !hasBackground) return;
    setIsSelectingColor(true);
    setStatusMessage('Select your cloak color: Click on your cloak in the camera view.');
  };

  // Handle Click / Tap on Canvas to Auto-Tune Cloak Color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSelectingColor || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = Math.round((clientX - rect.left) * scaleX);
    const clickY = Math.round((clientY - rect.top) * scaleY);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Automatic Parameter Auto-Tuning Engine
    const tuned = autoTuneCloakColor(currentImageData, clickX, clickY, 3);

    setSelectedRgbHex(tuned.rgbHex);
    setHsvRanges(tuned.hsvRanges);
    setBgSensitivity(tuned.bgSensitivity);

    setIsSelectingColor(false);
    setHasColorSelected(true);
    setShowColorSuccessModal(true);
    setStatusMessage('Color detected ✓');
  };

  // Toggle Invisible Mode
  const toggleInvisibleMode = () => {
    if (!hasBackground || !hasColorSelected) return;

    setIsInvisibleMode(!isInvisibleMode);
    if (!isInvisibleMode) {
      setStatusMessage('Invisible Mode Active ✨');
    } else {
      setStatusMessage('Invisible Mode Paused.');
    }
  };

  // Reset Application to Initial State
  const resetAll = () => {
    setIsInvisibleMode(false);
    setIsSelectingColor(false);
    setHasBackground(false);
    setHasColorSelected(false);
    setSelectedRgbHex(null);
    setHsvRanges(null);
    bgImageDataRef.current = null;
    setShowBgSuccessModal(false);
    setBgQualityError(null);
    setShowColorSuccessModal(false);
    setStatusMessage('Ready to begin.');
  };

  // Real-Time Computer Vision Animation Loop
  useEffect(() => {
    if (!isCameraActive) return;

    const renderLoop = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (canvas.width !== 640 || canvas.height !== 480) {
          canvas.width = 640;
          canvas.height = 480;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          if (isInvisibleMode && bgImageDataRef.current && hsvRanges) {
            const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const outputImageData = ctx.createImageData(canvas.width, canvas.height);

            processInvisibleCloakFrame(
              currentImageData,
              bgImageDataRef.current,
              outputImageData,
              hsvRanges,
              bgSensitivity
            );

            ctx.putImageData(outputImageData, 0, 0);
          }

          // Visual Overlay during Countdown
          if (countdownNum !== null) {
            ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('Get ready... Stay out of the frame!', canvas.width / 2, canvas.height / 2 - 40);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 80px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(countdownNum.toString(), canvas.width / 2, canvas.height / 2 + 30);
          }

          // Visual Overlay during Color Selection Mode
          if (isSelectingColor && countdownNum === null) {
            ctx.fillStyle = '#00f0ff';
            ctx.textAlign = 'left';
            ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('👉 CLICK ON YOUR CLOAK TO SELECT COLOR', 20, 35);
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraActive, isInvisibleMode, hsvRanges, bgSensitivity, isSelectingColor, countdownNum]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hidden Video Source */}
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      {/* Header */}
      <header className="glass-panel" style={{ margin: '15px 20px 5px', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles style={{ color: 'var(--accent-indigo)', width: 28, height: 28 }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Invisible Cloak
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Real-Time Browser Computer Vision Experience
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowHowItWorks(!showHowItWorks)}>
            <HelpCircle size={18} />
            How It Works
          </button>

          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            100% Client-Side & Private
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main style={{ flex: 1, padding: '15px 20px 25px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px' }}>
        
        {/* Left Column: Camera Preview Canvas */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="glass-panel" style={{ flex: 1, minHeight: '480px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            
            {!isCameraActive ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '460px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Camera size={40} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '10px' }}>Allow Camera Access</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.6 }}>
                  Experience real-time computer vision directly in your browser. All processing runs locally on your device.
                </p>

                {cameraError && (
                  <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px', padding: '14px', marginBottom: '20px', color: '#fda4af', textAlign: 'left', fontSize: '0.88rem', display: 'flex', gap: '10px' }}>
                    <AlertTriangle style={{ flexShrink: 0, marginTop: '2px' }} size={20} />
                    <div>{cameraError}</div>
                  </div>
                )}

                <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem', width: '100%' }} onClick={requestCamera}>
                  <Camera size={20} />
                  Allow Camera & Start
                </button>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="video-canvas"
                onClick={handleCanvasClick}
                onTouchStart={handleCanvasClick}
              />
            )}
          </div>

          {/* Status Label Bar */}
          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              Status: {statusMessage}
            </span>
            {isCameraActive && (
              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={stopCamera}>
                Stop Camera
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Consumer Controls Sidebar */}
        <aside className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', color: '#a5b4fc' }}>
              Workflow Steps
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-primary"
                disabled={!isCameraActive || countdownNum !== null}
                onClick={startBackgroundCaptureSequence}
              >
                <Camera size={18} />
                {hasBackground ? 'Recapture Background' : '1. Capture Background'}
              </button>

              <button
                className="btn btn-secondary"
                disabled={!isCameraActive || !hasBackground}
                onClick={enableColorSelection}
              >
                <Pipette size={18} />
                {hasColorSelected ? 'Reselect Cloak Color' : '2. Select Cloak Color'}
              </button>

              <button
                className={`btn ${isInvisibleMode ? 'btn-danger' : 'btn-success'}`}
                disabled={!isCameraActive || !hasBackground || !hasColorSelected}
                onClick={toggleInvisibleMode}
              >
                {isInvisibleMode ? <Pause size={18} /> : <Play size={18} />}
                {isInvisibleMode ? 'Pause Invisible Mode' : '3. Start Invisible Mode'}
              </button>

              <button className="btn btn-secondary" style={{ marginTop: '6px' }} onClick={resetAll}>
                <RefreshCw size={16} /> Reset All
              </button>
            </div>
          </div>

          {/* Simple Color Swatch Indicator (NO HSV NUMBERS EXPOSED) */}
          {selectedRgbHex && (
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Selected Cloak Color:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: selectedRgbHex, border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                  Color Detected ✓
                </span>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5, background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', marginTop: 'auto' }}>
            🔒 <strong>Privacy Guarantee</strong>: Your camera feed is processed 100% locally inside your browser and is never recorded or uploaded.
          </div>
        </aside>
      </main>

      {/* POPUP MODAL 1: Background Captured Successfully */}
      {showBgSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>Background Captured Successfully!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Your background has been saved. You can now step into the frame with your cloak.
            </p>
            <button className="btn btn-success" style={{ width: '100%', padding: '12px' }} onClick={() => setShowBgSuccessModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: Background Quality Error */}
      {bgQualityError && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <XCircle size={36} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>Background Capture Not Reliable</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {bgQualityError}
            </p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => setBgQualityError(null)}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: Cloak Color Selected Successfully */}
      {showColorSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>Cloak Color Selected ✓</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Your cloak color has been detected. You can now start Invisible Mode.
            </p>
            <button className="btn btn-success" style={{ width: '100%', padding: '12px' }} onClick={() => setShowColorSuccessModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL 4: How It Works Guide */}
      {showHowItWorks && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '580px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', color: '#a5b4fc' }}>🧠 How the Invisible Cloak Algorithm Works</h3>
            <ol style={{ paddingLeft: '20px', lineHeight: 1.8, fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              <li><strong style={{ color: '#fff' }}>Background Capture:</strong> Stores a clean snapshot of your static background room.</li>
              <li><strong style={{ color: '#fff' }}>Adaptive Color Isolation:</strong> Automatically calculates optimal color bounds for your cloak.</li>
              <li><strong style={{ color: '#fff' }}>Background Difference Filter:</strong> Compares live frames against background to ensure matching background objects stay visible.</li>
              <li><strong style={{ color: '#fff' }}>Real-Time Blending:</strong> Seamlessly substitutes cloak pixels with saved background pixels.</li>
            </ol>
            <button className="btn btn-primary" style={{ marginTop: '24px', width: '100%' }} onClick={() => setShowHowItWorks(false)}>
              Got It! Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

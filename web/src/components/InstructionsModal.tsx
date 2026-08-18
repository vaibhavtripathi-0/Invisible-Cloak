import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sun,
  Shield,
  HelpCircle,
  Zap,
  ArrowRight
} from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles style={{ color: 'var(--accent-indigo)' }} size={24} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              📖 How to Use Invisible Cloak
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            aria-label="Close Instructions"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Quick Start */}
          <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '16px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Zap style={{ color: '#818cf8' }} size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a5b4fc' }}>⚡ Quick Start (7 Seconds)</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
              <span className="badge badge-info">1. Allow Camera</span> <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
              <span className="badge badge-info">2. Move Out of Frame</span> <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
              <span className="badge badge-info">3. Capture Background</span> <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
              <span className="badge badge-info">4. Step Back with Cloak</span> <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
              <span className="badge badge-info">5. Click Cloak Color</span> <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
              <span className="badge badge-success">6. Start Invisible Mode ✨</span>
            </div>
          </div>

          {/* Section 2: Step-by-Step Guide */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>
              📋 Step-by-Step Guide
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Step 1 */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-indigo)', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>1</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>Allow Camera Access</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginLeft: '36px' }}>
                  Click <strong>"Allow Camera & Start"</strong> to activate your camera. Your camera feed is processed 100% locally in your browser and is never recorded or uploaded.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-indigo)', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>2</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>Prepare the Scene</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginLeft: '36px' }}>
                  Keep your laptop/camera completely still. Ensure the room has good lighting and no people standing in the background.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-indigo)', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>3</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>Capture the Background</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginLeft: '36px' }}>
                  Move completely out of the camera view. Click <strong>"1. Capture Background"</strong> and stay out of frame during the 3-second countdown. Click <strong>[ OK ]</strong> on the confirmation popup.
                </p>
              </div>

              {/* Step 4 */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-indigo)', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>4</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>Wear / Hold the Cloak</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginLeft: '36px' }}>
                  Step back into view holding your cloth. You can use <strong>ANY plain color</strong> (Red, Green, Blue, Yellow, Pink, etc.). Blue is NOT required!
                </p>
              </div>

              {/* Step 5 */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-indigo)', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>5</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>Select the Cloak Color</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginLeft: '36px' }}>
                  Click <strong>"2. Select Cloak Color"</strong> and click/tap near the middle of your cloth on the camera preview. Click <strong>[ OK ]</strong> on the confirmation popup.
                </p>
              </div>

              {/* Step 6 */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ background: 'var(--accent-emerald)', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>6</span>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>Start Invisible Mode</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginLeft: '36px' }}>
                  Click <strong>"3. Start Invisible Mode"</strong>! The detected cloth will be seamlessly replaced by your background snapshot in real-time ✨
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Tips for Best Results */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sun style={{ color: 'var(--accent-emerald)' }} size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>💡 Tips for the Best Effect</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <li>✓ Keep the camera completely still after capturing the background.</li>
              <li>✓ Use good, even lighting (avoid dark rooms or harsh backlighting).</li>
              <li>✓ Use a mostly plain-colored cloth (avoid busy patterns or shiny reflective materials).</li>
              <li>✓ Click near the middle of your cloth when selecting color.</li>
              <li>✓ If detection shifts, click <strong>"Reset All"</strong> and recapture the background.</li>
            </ul>
          </div>

          {/* Section 4: Common Problems & Troubleshooting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <HelpCircle style={{ color: 'var(--accent-cyan)' }} size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>❓ Troubleshooting Common Problems</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Camera does not start?</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Ensure browser permissions allow camera access in your URL bar settings, and close Zoom/Skype if active.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Background object becomes invisible?</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Make sure the background object was already in place before clicking "Capture Background".
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>Cloak is not detected cleanly?</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Click "Reselect Cloak Color" and tap a well-lit area near the middle of your cloth.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Privacy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.4)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.84rem', color: 'var(--text-dim)' }}>
            <Lock size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <span>
              🔒 <strong>Privacy Guarantee</strong>: Your camera feed is processed 100% locally in your browser and is never recorded or uploaded to any server.
            </span>
          </div>

        </div>

        {/* Sticky Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" style={{ padding: '10px 24px' }} onClick={onClose}>
            Got It! Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

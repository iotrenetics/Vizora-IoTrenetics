'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Shield, Activity, Bell, Zap } from 'lucide-react';
import { useAuthStore } from '@/store';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Stage = 'login' | 'change-password';

/* ═══════════════════════════════════════════
   ANIMATED CANVAS BACKGROUND
═══════════════════════════════════════════ */
function AnimatedBackground({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating nodes (IoT device simulation)
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; pulse: number; pulseSpeed: number; type: 'device' | 'hub' | 'alert' }[] = [];
    for (let i = 0; i < 28; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        type: i < 4 ? 'hub' : i < 8 ? 'alert' : 'device',
      });
    }

    // Animated graph line (metric simulation)
    const graphPoints: number[] = Array.from({ length: 80 }, (_, i) =>
      0.5 + 0.25 * Math.sin(i * 0.18) + 0.1 * Math.sin(i * 0.45) + 0.05 * (Math.random() - 0.5)
    );
    let graphOffset = 0;

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const accentColor = isDark ? 'rgba(255, 152, 0,' : 'rgba(234, 88, 12,';
      const lineColor   = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

      // Draw graph line at bottom
      const gH = canvas.height * 0.28;
      const gY = canvas.height - gH - 20;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      const step = canvas.width / (graphPoints.length - 1);
      graphPoints.forEach((v, i) => {
        const x = (i - (graphOffset % 1)) * step;
        const y = gY + gH * (1 - v);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = accentColor + '0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill under graph
      ctx.lineTo(canvas.width + step, gY + gH);
      ctx.lineTo(-step, gY + gH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, gY, 0, gY + gH);
      grad.addColorStop(0, accentColor + '0.12)');
      grad.addColorStop(1, accentColor + '0)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Shift graph
      graphOffset += 0.015;
      if (graphOffset >= 1) {
        graphOffset -= 1;
        graphPoints.shift();
        graphPoints.push(0.5 + 0.25 * Math.sin(Date.now() * 0.001) + 0.1 * Math.random());
      }

      // Draw connections between nearby nodes
      nodes.forEach((n, i) => {
        nodes.forEach((m, j) => {
          if (j <= i) return;
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.12;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = lineColor + alpha + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(n => {
        n.pulse += n.pulseSpeed;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = canvas.width + 20;
        if (n.x > canvas.width + 20) n.x = -20;
        if (n.y < -20) n.y = canvas.height + 20;
        if (n.y > canvas.height + 20) n.y = -20;

        const pulseMag = 0.5 + 0.5 * Math.sin(n.pulse);

        if (n.type === 'hub') {
          // Pulsing ring for hubs
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 4 + pulseMag * 6, 0, Math.PI * 2);
          ctx.strokeStyle = accentColor + (0.06 + pulseMag * 0.08) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 2, 0, Math.PI * 2);
          ctx.fillStyle = accentColor + '0.7)';
          ctx.fill();
        } else if (n.type === 'alert') {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3 + pulseMag * 4, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? `rgba(239,68,68,${0.05 + pulseMag * 0.07})` : `rgba(220,38,38,${0.05 + pulseMag * 0.07})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(239,68,68,0.6)' : 'rgba(220,38,38,0.5)';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = lineColor + (0.15 + pulseMag * 0.1) + ')';
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ═══════════════════════════════════════════
   FLOATING STAT CARDS (ambient decoration)
═══════════════════════════════════════════ */
function FloatingCard({ style, icon: Icon, label, value, color, delay }: {
  style?: React.CSSProperties;
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <div style={{
      position: 'absolute',
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderRadius: 10,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid var(--float-border)',
      background: 'var(--float-bg)',
      boxShadow: '0 8px 32px var(--float-shadow)',
      animation: `floatCard 6s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: 'none',
      ...style,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{value}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   VIZORA LOGO SVG
═══════════════════════════════════════════ */
function VizoraSVGLogo({ size = 52 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 24px rgba(255,152,0,0.3), 0 0 0 1px rgba(255,152,0,0.2)',
      flexShrink: 0,
    }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 32 32" fill="none">
        {/* V shape with gradient */}
        <defs>
          <linearGradient id="vgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff9800" />
            <stop offset="60%" stopColor="#ff5722" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path d="M4 6 L16 26 L28 6" stroke="url(#vgrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Data points */}
        <circle cx="4" cy="6" r="2" fill="#ff9800" />
        <circle cx="16" cy="26" r="2" fill="#ff5722" />
        <circle cx="28" cy="6" r="2" fill="#7c3aed" />
        {/* Mini chart line */}
        <path d="M8 14 L12 11 L16 15 L20 9 L24 12" stroke="rgba(255,152,0,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   INPUT FIELD
═══════════════════════════════════════════ */
function InputField({
  label, type = 'text', value, onChange, placeholder, autoComplete, error,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', marginBottom: 7, fontSize: 12,
        fontWeight: 600, color: 'var(--label-color)',
        letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: isPassword ? '12px 44px 12px 16px' : '12px 16px',
            borderRadius: 8,
            border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : focused ? 'var(--accent)' : 'var(--input-border)'}`,
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: 'none',
            transition: 'all 0.18s',
            boxSizing: 'border-box',
            boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(v => !v)} style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 0, display: 'flex',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <AlertCircle size={12} color="#ef4444" />
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 500 }}>{error}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGIN FORM
═══════════════════════════════════════════ */
function LoginForm({ onSuccess }: { onSuccess: (username: string) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    if (username === 'admin' && password === 'admin') {
      onSuccess(username);
    } else {
      setError('Invalid username or password.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <InputField label="Username or email" value={username} onChange={setUsername} placeholder="admin" autoComplete="username" />
      <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8, marginBottom: 18,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444', fontSize: 13, fontWeight: 500,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !username || !password}
        style={{
          width: '100%', padding: '13px',
          borderRadius: 8, border: 'none',
          background: loading ? 'var(--btn-loading)' : 'var(--btn-bg)',
          color: loading ? 'var(--text-muted)' : '#fff',
          fontSize: 14, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          letterSpacing: '0.02em',
          boxShadow: loading ? 'none' : 'var(--btn-shadow)',
        }}
        onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--btn-shadow-hover)'; } }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = loading ? 'none' : 'var(--btn-shadow)'; }}
      >
        {loading ? (
          <>
            <span style={{
              width: 15, height: 15, borderRadius: '50%',
              border: '2px solid var(--text-muted)', borderTopColor: 'transparent',
              display: 'inline-block', animation: 'spin 0.7s linear infinite',
            }} />
            Signing in…
          </>
        ) : (
          <>Sign in <ArrowRight size={15} /></>
        )}
      </button>

      <div style={{ marginTop: 18, textAlign: 'center' }}>
        <a href="#" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, opacity: 0.9 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════
   CHANGE PASSWORD FORM
═══════════════════════════════════════════ */
function ChangePasswordForm({ onSave, onSkip }: { onSave: () => void; onSkip: () => void }) {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saved,   setSaved]   = useState(false);

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][strength];
  const match   = newPass === confirm && newPass.length > 0;
  const canSave = strength >= 2 && match;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaved(true);
    await new Promise(r => setTimeout(r, 700));
    onSave();
  };

  return (
    <form onSubmit={handleSave} style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 8, marginBottom: 22,
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
      }}>
        <Shield size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#f59e0b', lineHeight: 1.6, fontWeight: 500 }}>
          You're using default credentials. Set a new password to continue.
        </p>
      </div>

      <InputField label="New password" type="password" value={newPass} onChange={setNewPass} placeholder="Min. 8 characters" autoComplete="new-password" />

      {newPass.length > 0 && (
        <div style={{ marginTop: -12, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= strength ? strengthColor : 'var(--surface-3)',
                transition: 'background 0.25s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
        </div>
      )}

      <InputField
        label="Confirm new password" type="password" value={confirm} onChange={setConfirm}
        placeholder="Re-enter password" autoComplete="new-password"
        error={confirm.length > 0 && !match ? 'Passwords do not match' : undefined}
      />

      {saved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          color: '#22c55e', fontSize: 13, fontWeight: 500,
        }}>
          <CheckCircle2 size={14} /> Password updated! Redirecting…
        </div>
      )}

      <button type="submit" disabled={!canSave || saved} style={{
        width: '100%', padding: '13px', borderRadius: 8, border: 'none',
        background: canSave && !saved ? 'var(--btn-bg)' : 'var(--btn-loading)',
        color: canSave && !saved ? '#fff' : 'var(--text-muted)',
        fontSize: 14, fontWeight: 700,
        cursor: canSave && !saved ? 'pointer' : 'not-allowed',
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.2s', letterSpacing: '0.02em',
        boxShadow: canSave && !saved ? 'var(--btn-shadow)' : 'none',
      }}
        onMouseEnter={e => { if (canSave && !saved) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}
      >
        Save new password
      </button>

      <button type="button" onClick={onSkip} style={{
        width: '100%', padding: '11px', marginTop: 10,
        borderRadius: 8, border: '1.5px solid var(--input-border)',
        background: 'transparent', color: 'var(--text-muted)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        Skip for now
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function LoginPage() {
  const router  = useRouter();
  const login   = useAuthStore(s => s.login);
  const [stage, setStage]             = useState<Stage>('login');
  const [pendingUsername, setPending] = useState('');
  const [mounted, setMounted]         = useState(false);
  const [isDark, setIsDark]           = useState(true);

  useEffect(() => {
    setMounted(true);
    // Detect system theme preference
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLoginSuccess = (username: string) => {
    setPending(username);
    setStage('change-password');
  };
  const handleDone = () => {
    login(pendingUsername);
    router.replace('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes cardIn   { from { opacity:0; transform:translateY(32px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes headerIn { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes footerIn { from { opacity:0; } to { opacity:1; } }
        @keyframes floatCard {
          0%   { transform: translateY(0px) rotate(-1deg); }
          100% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* CSS Variables — light & dark */}
      <style>{`
        :root {
          --accent:       ${isDark ? '#ff9800' : '#ea580c'};
          --accent-hover: ${isDark ? '#ffb74d' : '#c2410c'};
          --accent-glow:  ${isDark ? 'rgba(255,152,0,0.15)' : 'rgba(234,88,12,0.12)'};

          --bg:           ${isDark ? '#0d0f14' : '#f4f5f7'};
          --card-bg:      ${isDark ? 'rgba(24,27,33,0.85)' : 'rgba(255,255,255,0.88)'};
          --card-border:  ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'};
          --card-shadow:  ${isDark ? '0 24px 80px rgba(0,0,0,0.55)' : '0 24px 80px rgba(0,0,0,0.14)'};

          --input-bg:     ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
          --input-border: ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)'};

          --text-primary:   ${isDark ? '#f0f1f3' : '#0f1117'};
          --text-secondary: ${isDark ? '#b4b8c4' : '#374151'};
          --text-muted:     ${isDark ? '#6b7280' : '#9ca3af'};

          --label-color:  ${isDark ? '#8890a0' : '#6b7280'};
          --surface-2:    ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
          --surface-3:    ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'};

          --btn-bg:           linear-gradient(135deg, #ff9800 0%, #ff6d00 100%);
          --btn-loading:      ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          --btn-shadow:       0 4px 20px rgba(255,152,0,0.35);
          --btn-shadow-hover: 0 8px 30px rgba(255,152,0,0.5);

          --float-bg:     ${isDark ? 'rgba(24,27,33,0.7)' : 'rgba(255,255,255,0.7)'};
          --float-border: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          --float-shadow: ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'};

          --divider:      ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: isDark
          ? 'radial-gradient(ellipse at 60% 40%, #161a24 0%, #0d0f14 60%)'
          : 'radial-gradient(ellipse at 60% 40%, #e8ecf4 0%, #f4f5f7 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Animated canvas */}
        {mounted && <AnimatedBackground isDark={isDark} />}

        {/* Floating ambient cards */}
        {mounted && (
          <>
            <FloatingCard
              style={{ top: '14%', left: '6%' }}
              icon={Activity} label="Avg CPU" value="42.9%" color="#f59e0b" delay={0}
            />
            <FloatingCard
              style={{ top: '22%', right: '5%' }}
              icon={Bell} label="Active Alerts" value="3 firing" color="#ef4444" delay={1.5}
            />
            <FloatingCard
              style={{ bottom: '20%', left: '5%' }}
              icon={Zap} label="Devices online" value="4 / 6" color="#22c55e" delay={3}
            />
          </>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setIsDark(v => !v)}
          style={{
            position: 'fixed', top: 20, right: 20,
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--float-bg)', border: '1px solid var(--float-border)',
            backdropFilter: 'blur(10px)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', fontSize: 18,
            transition: 'all 0.2s', zIndex: 10,
          }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Main container */}
        <div style={{
          width: '100%', maxWidth: 420,
          margin: '0 20px',
          position: 'relative', zIndex: 2,
        }}>

          {/* ── Header ── */}
          <div style={{
            textAlign: 'center', marginBottom: 28,
            animation: 'headerIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {/* Logo + Name row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 6 }}>
              <VizoraSVGLogo size={52} />
              <h1 style={{
                margin: 0, fontSize: 38, fontWeight: 800,
                fontFamily: "'Syne', sans-serif",
                color: 'var(--text-primary)',
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                Vizora
              </h1>
            </div>

            <p style={{
              margin: '10px 0 0', fontSize: 13.5,
              color: 'var(--text-muted)', lineHeight: 1.5,
            }}>
              {stage === 'login' ? 'IoT Monitoring & Observability Platform' : 'Secure your account'}
            </p>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                powered by
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
            </div>

            {/* IoTrenetics branding */}
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <img
                src="/iotrenetics-logo.jpg"
                alt="IoTrenetics Solutions"
                style={{
                  height: 32, width: 'auto', objectFit: 'contain', borderRadius: 6,
                  filter: isDark ? 'brightness(0.9) saturate(0.85)' : 'none',
                }}
              />
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.01em' }}>
                A product of IoTrenetics Solutions Private Limited
              </p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em' }}>
                🇮🇳 Made in Bharat
              </p>
            </div>
          </div>

          {/* ── Card ── */}
          <div style={{
            padding: '30px 32px',
            borderRadius: 14,
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            animation: 'cardIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }}>
            {/* Stage indicator */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {(['login', 'change-password'] as Stage[]).map((s, i) => (
                <div key={s} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: stage === s ? 'var(--accent)' : i < (['login', 'change-password'] as Stage[]).indexOf(stage) ? 'var(--accent)' : 'var(--surface-3)',
                  transition: 'background 0.3s',
                  opacity: stage === s ? 1 : 0.4,
                }} />
              ))}
            </div>

            <h2 style={{
              margin: '0 0 22px', fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)', letterSpacing: '-0.02em',
            }}>
              {stage === 'login' ? 'Sign in to your account' : 'Change your password'}
            </h2>

            {stage === 'login'
              ? <LoginForm onSuccess={handleLoginSuccess} />
              : <ChangePasswordForm onSave={handleDone} onSkip={handleDone} />
            }
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center', marginTop: 20,
            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7,
            animation: 'footerIn 0.6s 0.5s both',
          }}>
            © {new Date().getFullYear()} IoTrenetics Solutions Private Limited
            <br />
            Vizora v1.0.0 · All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}
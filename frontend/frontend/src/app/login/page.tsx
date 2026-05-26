'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { useAuthStore } from '@/store';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Stage = 'login' | 'change-password';

/* ═══════════════════════════════════════════
   UI ATOMS
═══════════════════════════════════════════ */
function InputField({
  label, type = 'text', value, onChange, placeholder, autoComplete, error,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword      = type === 'password';
  const inputType       = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', marginBottom: 6, fontSize: 13,
        fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.01em',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{
            width: '100%', padding: isPassword ? '10px 42px 10px 14px' : '10px 14px',
            borderRadius: 6, border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'var(--border)'}`,
            background: 'var(--surface-2)', color: 'var(--text-primary)',
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(255,152,0,0.12)';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'var(--border)';
            e.currentTarget.style.boxShadow   = 'none';
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(v => !v)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 0, display: 'flex',
          }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
          <AlertCircle size={12} color="#ef4444" />
          <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGIN STAGE
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
    await new Promise(r => setTimeout(r, 700));
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
          padding: '10px 12px', borderRadius: 6, marginBottom: 16,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444', fontSize: 13,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      <button type="submit" disabled={loading || !username || !password} style={{
        width: '100%', padding: '11px', borderRadius: 6, border: 'none',
        background: loading ? 'var(--surface-3)' : 'var(--accent, #ff9800)',
        color: loading ? 'var(--text-muted)' : '#fff',
        fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        letterSpacing: '0.01em',
      }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
      >
        {loading ? (
          <>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid var(--text-muted)', borderTopColor: 'transparent',
              display: 'inline-block', animation: 'spin 0.7s linear infinite',
            }} />
            Signing in…
          </>
        ) : (
          <> Log in <ArrowRight size={14} /> </>
        )}
      </button>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <a href="#" style={{ fontSize: 13, color: 'var(--accent, #ff9800)', textDecoration: 'none', opacity: 0.85 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════
   CHANGE PASSWORD STAGE
═══════════════════════════════════════════ */
function ChangePasswordForm({ onSave, onSkip }: { onSave: () => void; onSkip: () => void }) {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saved,   setSaved]   = useState(false);

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][strength];
  const match    = newPass === confirm && newPass.length > 0;
  const canSave  = strength >= 2 && match;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaved(true);
    await new Promise(r => setTimeout(r, 600));
    onSave();
  };

  return (
    <form onSubmit={handleSave} style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 6, marginBottom: 22,
        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
      }}>
        <Shield size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#f59e0b', lineHeight: 1.5 }}>
          You are using the default credentials. Please change your password before continuing.
        </p>
      </div>

      <InputField label="New password" type="password" value={newPass} onChange={setNewPass} placeholder="Min. 8 characters" autoComplete="new-password" />

      {newPass.length > 0 && (
        <div style={{ marginTop: -10, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= strength ? strengthColor : 'var(--surface-3)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strengthColor }}>{strengthLabel}</span>
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
          padding: '10px 12px', borderRadius: 6, marginBottom: 16,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          color: '#22c55e', fontSize: 13,
        }}>
          <CheckCircle2 size={14} /> Password updated! Redirecting…
        </div>
      )}

      <button type="submit" disabled={!canSave || saved} style={{
        width: '100%', padding: '11px', borderRadius: 6, border: 'none',
        background: canSave && !saved ? 'var(--accent, #ff9800)' : 'var(--surface-3)',
        color: canSave && !saved ? '#fff' : 'var(--text-muted)',
        fontSize: 14, fontWeight: 600, cursor: canSave && !saved ? 'pointer' : 'not-allowed',
        fontFamily: 'inherit', transition: 'all 0.15s', letterSpacing: '0.01em',
      }}
        onMouseEnter={e => { if (canSave && !saved) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
      >
        Save new password
      </button>

      <button type="button" onClick={onSkip} style={{
        width: '100%', padding: '11px', marginTop: 10,
        borderRadius: 6, border: '1px solid var(--border)',
        background: 'transparent', color: 'var(--text-muted)',
        fontSize: 14, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
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
  const [stage, setStage]           = useState<Stage>('login');
  const [pendingUsername, setPending] = useState('');

  /* After successful credential check, store username and go to password step */
  const handleLoginSuccess = (username: string) => {
    setPending(username);
    setStage('change-password');
  };

  /* After password saved or skipped, commit login and redirect */
  const handleDone = () => {
    login(pendingUsername);
    router.replace('/');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gridMove{ from { background-position:0 0; } to { background-position:40px 40px; } }
      `}</style>

      <div style={{
        minHeight: '100vh', background: 'var(--bg, #111217)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
      }}>

        {/* Animated grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,152,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,152,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px', animation: 'gridMove 8s linear infinite',
        }} />

        {/* Glow orb */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,152,0,0.06) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 440, margin: '0 16px', animation: 'fadeUp 0.4s ease both' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(255,152,0,0.2), rgba(255,152,0,0.05))',
              border: '1px solid rgba(255,152,0,0.25)', marginBottom: 14,
              boxShadow: '0 0 24px rgba(255,152,0,0.12)',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="4" fill="#ff9800" />
                <circle cx="14" cy="14" r="7" stroke="#ff9800" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
                <circle cx="14" cy="14" r="11" stroke="#ff9800" strokeWidth="1" strokeOpacity="0.2" fill="none" />
                <circle cx="4"  cy="14" r="2" fill="#ff9800" fillOpacity="0.6" />
                <circle cx="24" cy="14" r="2" fill="#ff9800" fillOpacity="0.6" />
                <circle cx="14" cy="4"  r="2" fill="#ff9800" fillOpacity="0.6" />
                <circle cx="14" cy="24" r="2" fill="#ff9800" fillOpacity="0.6" />
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #e8e9ea)', letterSpacing: '-0.02em' }}>
              Vizora IoTrenetics
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted, #6b7280)' }}>
              {stage === 'login' ? 'Sign in to your account' : 'Set a new password'}
            </p>
          </div>

          {/* Card */}
          <div style={{
            padding: '32px 36px', borderRadius: 10,
            background: 'var(--surface, #181b1f)',
            border: '1px solid var(--border, rgba(255,255,255,0.07))',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
            {stage === 'login'
              ? <LoginForm onSuccess={handleLoginSuccess} />
              : <ChangePasswordForm onSave={handleDone} onSkip={handleDone} />
            }
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted, #4b5563)' }}>
            Vizora IoTrenetics © {new Date().getFullYear()} · v1.0.0
          </p>
        </div>
      </div>
    </>
  );
}
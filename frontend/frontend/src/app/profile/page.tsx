'use client';
import { useState, useRef } from 'react';
import {
  User, Palette, Shield, Camera, Check, Eye, EyeOff,
  AlertCircle, CheckCircle2, ChevronRight, Sun, Moon,
  Globe, Clock, Key, Smartphone, Copy, RefreshCw, Trash2,
  LogOut,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type Tab = 'general' | 'appearance' | 'security';

/* ═══════════════════════════════════════════
   VIZORA MARK (inline SVG logo)
═══════════════════════════════════════════ */
function VizoraMark({ size = 22 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(255,152,0,0.25)',
    }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="pgvg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#ff9800" />
            <stop offset="60%"  stopColor="#ff5722" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path d="M4 6 L16 26 L28 6" stroke="url(#pgvg)" strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="4"  cy="6"  r="2" fill="#ff9800" />
        <circle cx="16" cy="26" r="2" fill="#ff5722" />
        <circle cx="28" cy="6"  r="2" fill="#7c3aed" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHARED ATOMS
═══════════════════════════════════════════ */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      margin: '0 0 18px', fontSize: 13, fontWeight: 700,
      color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>{children}</h3>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{
        display: 'block', marginBottom: 7, fontSize: 13,
        fontWeight: 600, color: 'var(--text-secondary)',
      }}>{label}</label>
      {children}
      {hint && <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text',
  disabled, rightEl,
}: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string;
  disabled?: boolean; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: rightEl ? '10px 42px 10px 14px' : '10px 14px',
          borderRadius: 8, boxSizing: 'border-box',
          border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
          background: disabled ? 'var(--surface-2)' : 'var(--input-bg)',
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: 14, fontFamily: 'inherit', outline: 'none',
          transition: 'all 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {rightEl && (
        <div style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)',
        }}>{rightEl}</div>
      )}
    </div>
  );
}

function SaveButton({ onClick, saved, loading }: {
  onClick: () => void; saved: boolean; loading?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '10px 22px', borderRadius: 8, border: 'none',
      background: saved ? 'var(--green)' : 'var(--accent)',
      color: '#fff', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.25s',
      fontFamily: 'inherit', letterSpacing: '0.02em',
      boxShadow: saved ? '0 4px 16px rgba(34,197,94,0.35)' : '0 4px 16px rgba(255,152,0,0.3)',
    }}
      onMouseEnter={e => { if (!saved) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'none'; }}
    >
      {saved ? <><CheckCircle2 size={14} /> Saved!</> : loading ? 'Saving…' : <><Check size={14} /> Save changes</>}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '28px 0' }} />;
}

/* ═══════════════════════════════════════════
   TAB — GENERAL
═══════════════════════════════════════════ */
function GeneralTab() {
  const [name,     setName]     = useState('Alex Reyes');
  const [email,    setEmail]    = useState('alex@vizora.io');
  const [username, setUsername] = useState('alex.reyes');
  const [bio,      setBio]      = useState('');
  const [saved,    setSaved]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      {/* Avatar */}
      <SectionTitle>Profile photo</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5865f2 0%, #7b8cff 50%, #ff9800 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 28, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(88,101,242,0.4)',
          }}>A</div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
          >
            <Camera size={12} color="#fff" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
        </div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Alex Reyes
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)' }}>
            JPG, PNG or GIF · Max 5 MB
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '6px 14px', borderRadius: 7, border: '1.5px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >Upload photo</button>
            <button style={{
              padding: '6px 14px', borderRadius: 7, border: '1.5px solid rgba(239,68,68,0.3)',
              background: 'transparent', color: 'var(--red)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >Remove</button>
          </div>
        </div>
      </div>

      <Divider />
      <SectionTitle>Account details</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Full name">
          <TextInput value={name} onChange={setName} placeholder="Your full name" />
        </Field>
        <Field label="Username">
          <TextInput value={username} onChange={setUsername} placeholder="username" />
        </Field>
      </div>

      <Field label="Email address">
        <TextInput value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
      </Field>

      <Field label="Bio" hint="Brief description for your profile. Max 160 characters.">
        <textarea
          value={bio} onChange={e => setBio(e.target.value)}
          placeholder="Tell your team a little about yourself…"
          maxLength={160}
          rows={3}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1.5px solid var(--border)', background: 'var(--input-bg)',
            color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          {bio.length}/160
        </p>
      </Field>

      <Divider />
      <SectionTitle>Organization</SectionTitle>
      <Field label="Role" hint="Contact your administrator to change your role.">
        <TextInput value="Admin" disabled />
      </Field>
      <Field label="Organization">
        <TextInput value="IoTrenetics Solutions" disabled />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB — APPEARANCE
═══════════════════════════════════════════ */
function AppearanceTab() {
  const [theme,    setTheme]    = useState<'dark' | 'light' | 'system'>('dark');
  const [lang,     setLang]     = useState('en');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFmt] = useState('DD/MM/YYYY');
  const [density,  setDensity]  = useState<'comfortable' | 'compact'>('comfortable');
  const [saved,    setSaved]    = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const ThemeCard = ({ value, icon: Icon, label, desc }: {
    value: 'dark' | 'light' | 'system';
    icon: React.ElementType; label: string; desc: string;
  }) => (
    <button
      onClick={() => setTheme(value)}
      style={{
        flex: 1, padding: '16px', borderRadius: 10,
        border: `2px solid ${theme === value ? 'var(--accent)' : 'var(--border)'}`,
        background: theme === value ? 'var(--accent-soft)' : 'var(--surface-2)',
        cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
        fontFamily: 'inherit',
        boxShadow: theme === value ? '0 0 0 1px var(--accent), 0 4px 16px var(--accent-glow)' : 'none',
      }}
      onMouseEnter={e => { if (theme !== value) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; }}
      onMouseLeave={e => { if (theme !== value) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Icon size={18} color={theme === value ? 'var(--accent)' : 'var(--text-muted)'} />
        {theme === value && (
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={10} color="#fff" strokeWidth={3} />
          </div>
        )}
      </div>
      <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: theme === value ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
    </button>
  );

  const SelectField = ({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          width: '100%', padding: '10px 36px 10px 14px',
          borderRadius: 8, border: '1.5px solid var(--border)',
          background: 'var(--input-bg)', color: 'var(--text-primary)',
          fontSize: 14, fontFamily: 'inherit', outline: 'none',
          appearance: 'none', cursor: 'pointer', transition: 'border-color 0.15s',
        }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronRight size={14} color="var(--text-muted)" style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none',
        }} />
      </div>
    </Field>
  );

  return (
    <div>
      <SectionTitle>Theme</SectionTitle>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <ThemeCard value="dark"   icon={Moon}  label="Dark"   desc="Easy on the eyes" />
        <ThemeCard value="light"  icon={Sun}   label="Light"  desc="Bright & crisp" />
        <ThemeCard value="system" icon={Globe} label="System" desc="Follows OS setting" />
      </div>

      <Divider />
      <SectionTitle>Density</SectionTitle>
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        {(['comfortable', 'compact'] as const).map(d => (
          <button key={d} onClick={() => setDensity(d)} style={{
            flex: 1, padding: '14px 16px', borderRadius: 10,
            border: `2px solid ${density === d ? 'var(--accent)' : 'var(--border)'}`,
            background: density === d ? 'var(--accent-soft)' : 'var(--surface-2)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
            display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left',
            boxShadow: density === d ? '0 0 0 1px var(--accent)' : 'none',
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: d === 'comfortable' ? 3 : 5 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: d === 'comfortable' ? 10 : 6, borderRadius: 3,
                  background: density === d ? 'var(--accent)' : 'var(--border-2)',
                  transition: 'background 0.15s',
                }} />
              ))}
            </div>
            <p style={{
              margin: 0, fontSize: 13, fontWeight: 700,
              color: density === d ? 'var(--accent)' : 'var(--text-primary)',
              textTransform: 'capitalize',
            }}>{d}</p>
          </button>
        ))}
      </div>

      <Divider />
      <SectionTitle>Locale & time</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <SelectField label="Language" value={lang} onChange={setLang} options={[
          { value: 'en', label: 'English (US)' },
          { value: 'hi', label: 'Hindi' },
          { value: 'fr', label: 'French' },
          { value: 'de', label: 'German' },
          { value: 'ja', label: 'Japanese' },
        ]} />
        <SelectField label="Date format" value={dateFormat} onChange={setDateFmt} options={[
          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
        ]} />
      </div>
      <SelectField label="Timezone" value={timezone} onChange={setTimezone} options={[
        { value: 'Asia/Kolkata',      label: 'Asia/Kolkata (IST, UTC+5:30)' },
        { value: 'UTC',               label: 'UTC' },
        { value: 'America/New_York',  label: 'America/New_York (EST)' },
        { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
        { value: 'Europe/London',     label: 'Europe/London (GMT)' },
        { value: 'Europe/Berlin',     label: 'Europe/Berlin (CET)' },
        { value: 'Asia/Tokyo',        label: 'Asia/Tokyo (JST)' },
      ]} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <SaveButton onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB — SECURITY
═══════════════════════════════════════════ */
function SecurityTab() {
  const [curPass,  setCurPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confPass, setConfPass] = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwSaved,  setPwSaved]  = useState(false);
  const [twoFA,    setTwoFA]    = useState(false);
  const [sessions] = useState([
    { id: '1', device: 'Chrome · macOS', location: 'Mumbai, IN', time: 'Active now',   current: true  },
    { id: '2', device: 'Safari · iPhone', location: 'Delhi, IN',  time: '2 hours ago',  current: false },
    { id: '3', device: 'Firefox · Windows', location: 'Pune, IN', time: '3 days ago',   current: false },
  ]);

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][strength];
  const match   = newPass === confPass && newPass.length > 0;
  const canSave = strength >= 2 && match && curPass.length > 0;

  const PwInput = ({ label, value, onChange, show, onToggle, placeholder, autoComplete }: {
    label: string; value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; placeholder?: string; autoComplete?: string;
  }) => {
    const [focused, setFocused] = useState(false);
    return (
      <Field label={label}>
        <div style={{ position: 'relative' }}>
          <input
            type={show ? 'text' : 'password'} value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder} autoComplete={autoComplete}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{
              width: '100%', padding: '10px 42px 10px 14px',
              borderRadius: 8, boxSizing: 'border-box',
              border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
              background: 'var(--input-bg)', color: 'var(--text-primary)',
              fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'all 0.15s',
              boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
            }}
          />
          <button type="button" onClick={onToggle} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 0, display: 'flex',
          }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>
    );
  };

  const handlePwSave = () => {
    if (!canSave) return;
    setPwSaved(true);
    setTimeout(() => { setPwSaved(false); setCurPass(''); setNewPass(''); setConfPass(''); }, 2200);
  };

  return (
    <div>
      <SectionTitle>Change password</SectionTitle>
      <PwInput
        label="Current password" value={curPass} onChange={setCurPass}
        show={showCur} onToggle={() => setShowCur(v => !v)}
        placeholder="Enter current password" autoComplete="current-password"
      />
      <PwInput
        label="New password" value={newPass} onChange={setNewPass}
        show={showNew} onToggle={() => setShowNew(v => !v)}
        placeholder="Min. 8 characters" autoComplete="new-password"
      />

      {newPass.length > 0 && (
        <div style={{ marginTop: -14, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= strength ? strengthColor : 'var(--surface-3)',
                transition: 'background 0.22s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
        </div>
      )}

      <PwInput
        label="Confirm new password" value={confPass} onChange={setConfPass}
        show={showConf} onToggle={() => setShowConf(v => !v)}
        placeholder="Re-enter new password" autoComplete="new-password"
      />
      {confPass.length > 0 && !match && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '-14px 0 16px', fontSize: 12, color: '#ef4444' }}>
          <AlertCircle size={12} /> Passwords do not match
        </p>
      )}

      {pwSaved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          color: '#22c55e', fontSize: 13, fontWeight: 500,
        }}>
          <CheckCircle2 size={14} /> Password updated successfully!
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton onClick={handlePwSave} saved={pwSaved} />
      </div>

      <Divider />

      {/* 2FA */}
      <SectionTitle>Two-factor authentication</SectionTitle>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px', borderRadius: 10,
        border: `1.5px solid ${twoFA ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
        background: twoFA ? 'rgba(34,197,94,0.04)' : 'var(--surface-2)',
        transition: 'all 0.2s', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: twoFA ? 'rgba(34,197,94,0.15)' : 'var(--surface-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            <Smartphone size={18} color={twoFA ? '#22c55e' : 'var(--text-muted)'} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Authenticator app
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {twoFA ? 'Enabled · Your account is protected' : 'Add an extra layer of security'}
            </p>
          </div>
        </div>
        {/* Toggle */}
        <button onClick={() => setTwoFA(v => !v)} style={{
          width: 44, height: 24, borderRadius: 12, border: 'none',
          background: twoFA ? 'var(--green)' : 'var(--surface-3)',
          cursor: 'pointer', position: 'relative', transition: 'background 0.22s', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 3,
            left: twoFA ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }} />
        </button>
      </div>

      <Divider />

      {/* Active sessions */}
      <SectionTitle>Active sessions</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 10,
            border: `1.5px solid ${s.current ? 'rgba(255,152,0,0.3)' : 'var(--border)'}`,
            background: s.current ? 'rgba(255,152,0,0.04)' : 'var(--surface-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: s.current ? 'rgba(255,152,0,0.12)' : 'var(--surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Globe size={16} color={s.current ? 'var(--accent)' : 'var(--text-muted)'} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.device}</p>
                  {s.current && (
                    <span style={{
                      fontSize: 10, padding: '1px 7px', borderRadius: 20,
                      background: 'rgba(255,152,0,0.15)', color: 'var(--accent)',
                      fontWeight: 700, letterSpacing: '0.04em',
                    }}>THIS DEVICE</span>
                  )}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  {s.location} · {s.time}
                </p>
              </div>
            </div>
            {!s.current && (
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)',
                background: 'transparent', color: 'var(--red)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <LogOut size={12} /> Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button style={{
          padding: '8px 16px', borderRadius: 7,
          border: '1px solid rgba(239,68,68,0.3)',
          background: 'transparent', color: 'var(--red)', fontSize: 12,
          fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          Revoke all other sessions
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general',    label: 'General',    icon: User    },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security',   label: 'Security',   icon: Shield  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        :root {
          --accent:      #ff9800;
          --accent-hover:#ffb74d;
          --accent-soft: rgba(255,152,0,0.08);
          --accent-glow: rgba(255,152,0,0.15);
          --green:       #22c55e;
          --red:         #ef4444;
          --surface-2:   rgba(255,255,255,0.04);
          --surface-3:   rgba(255,255,255,0.08);
          --input-bg:    rgba(255,255,255,0.04);
          --border:      rgba(255,255,255,0.09);
          --border-2:    rgba(255,255,255,0.14);
          --text-primary:   #f0f1f3;
          --text-secondary: #b4b8c4;
          --text-muted:     #6b7280;
          --bg:          #0d0f14;
          --nav-bg:      #111318;
          --shadow-lg:   0 16px 48px rgba(0,0,0,0.45);
        }
        @keyframes tabIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: "'DM Sans', sans-serif",
        padding: '32px 40px',
      }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <VizoraMark size={36} />
          <div>
            <h1 style={{
              margin: 0, fontSize: 24, fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: "'Syne', sans-serif",
              letterSpacing: '-0.03em',
            }}>Profile Settings</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Manage your account, appearance and security
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, maxWidth: 960 }}>

          {/* ── Left tab rail ── */}
          <div style={{
            width: 200, flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 9,
                  border: 'none', cursor: 'pointer',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  position: 'relative', textAlign: 'left',
                }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: 2, background: 'var(--accent)',
                    }} />
                  )}
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              );
            })}

            {/* Subtle divider + version */}
            <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border)', marginTop: 20 }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Vizora v1.0.0<br />
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>🇮🇳 Made in Bharat</span>
              </p>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={{
            flex: 1, padding: '28px 32px',
            borderRadius: 14,
            background: 'rgba(24,27,33,0.7)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'tabIn 0.25s ease both',
            key: activeTab, // force re-animate on switch
          }}>
            {activeTab === 'general'    && <GeneralTab    />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'security'   && <SecurityTab   />}
          </div>
        </div>
      </div>
    </>
  );
}
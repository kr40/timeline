import { useState } from 'react';
import { Baby } from 'lucide-react';
import { FloatingBackground } from './FloatingBackground';

type AuthOutcome = 'unlocked' | 'view-only';

interface AuthGateProps {
  onAuth: (state: AuthOutcome) => void;
  isModal?: boolean;
  onClose?: () => void;
}

const PasswordForm = ({
  onAuth,
  showViewOnly,
  onClose,
}: {
  onAuth: (state: AuthOutcome) => void;
  showViewOnly: boolean;
  onClose?: () => void;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  const handleUnlock = () => {
    const expected = import.meta.env.VITE_APP_PASSWORD;
    if (!expected) {
      console.warn('[AuthGate] VITE_APP_PASSWORD is not set.');
    }
    if (password.trim() === expected) {
      try { localStorage.setItem('timeline_auth', 'unlocked'); } catch { /* ignore */ }
      onAuth('unlocked');
    } else {
      setShake(true);
      setError('Incorrect password');
      setPassword('');
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleViewOnly = () => {
    try { localStorage.setItem('timeline_auth', 'view-only'); } catch { /* ignore */ }
    onAuth('view-only');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password.trim()) handleUnlock();
  };

  return (
    <div className={shake ? 'animate-shake' : ''}>
      <input
        type='password'
        value={password}
        onChange={e => { setPassword(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        placeholder='Enter password'
        autoFocus
        className='w-full px-4 py-3 border-2 border-pink-200 rounded-full text-center font-nunito text-slate-700 focus:outline-none focus:border-pink-400 bg-white'
      />
      {error && (
        <p className='mt-2 text-sm text-center text-red-400 font-semibold'>{error}</p>
      )}
      <button
        onClick={handleUnlock}
        disabled={!password.trim()}
        className='mt-4 w-full py-3 bg-pink-400 text-white font-bold rounded-full hover:bg-pink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
      >
        Unlock ✨
      </button>
      {showViewOnly && (
        <button
          onClick={handleViewOnly}
          className='mt-3 w-full py-3 border-2 border-pink-200 text-pink-500 font-bold rounded-full hover:bg-pink-50 transition-colors'
        >
          View only 👀
        </button>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className='mt-3 w-full py-2 text-slate-400 text-sm font-semibold hover:text-slate-600 transition-colors'
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export const AuthGate = ({ onAuth, isModal = false, onClose }: AuthGateProps) => {
  if (isModal) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
        <div className='w-full max-w-sm mx-4 bg-cream rounded-3xl p-8 shadow-2xl shadow-pink-100 border-2 border-pink-100'>
          <h2 className='text-2xl font-extrabold text-slate-800 text-center mb-6'>🔑 Unlock editing</h2>
          <PasswordForm onAuth={onAuth} showViewOnly={false} onClose={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-x-hidden bg-cream flex items-center justify-center font-nunito'>
      <FloatingBackground />
      <div className='relative z-10 w-full max-w-sm mx-4 bg-white rounded-3xl p-8 shadow-2xl shadow-pink-100 border-4 border-pink-200'>
        <div className='flex flex-col items-center mb-8'>
          <div className='inline-flex items-center justify-center p-4 mb-4 bg-pink-100 rounded-full'>
            <Baby className='w-12 h-12 text-pink-500' />
          </div>
          <h1 className='text-3xl font-extrabold text-slate-800 text-center'>Our Baby Journey</h1>
          <p className='mt-2 text-slate-500 text-center text-sm leading-relaxed'>
            Enter the password to add memories, or view the timeline as a guest.
          </p>
        </div>
        <PasswordForm onAuth={onAuth} showViewOnly={true} />
      </div>
    </div>
  );
};

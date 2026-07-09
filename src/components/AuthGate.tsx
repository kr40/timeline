import { useEffect, useState } from 'react';
import { Baby } from 'lucide-react';

const AUTH_STORAGE_KEY = 'timeline_auth';

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

	useEffect(() => {
		if (!shake) return;
		const t = setTimeout(() => setShake(false), 600);
		return () => clearTimeout(t);
	}, [shake]);

	const handleUnlock = () => {
		const expected = import.meta.env.VITE_APP_PASSWORD;
		if (!expected) {
			console.warn('[AuthGate] VITE_APP_PASSWORD is not set.');
		}
		if (password.trim() === (expected ?? '').trim()) {
			try { localStorage.setItem(AUTH_STORAGE_KEY, 'unlocked'); } catch { /* ignore */ }
			onAuth('unlocked');
		} else {
			setShake(true);
			setError('Incorrect password');
			setPassword('');
		}
	};

	const handleViewOnly = () => {
		try { localStorage.setItem(AUTH_STORAGE_KEY, 'view-only'); } catch { /* ignore */ }
		onAuth('view-only');
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && password.trim()) handleUnlock();
	};

	return (
		<div className={shake ? 'animate-shake' : undefined}>
			<input
				type='password'
				value={password}
				onChange={e => { setPassword(e.target.value); setError(''); }}
				onKeyDown={handleKeyDown}
				placeholder='Enter password'
				autoFocus
				className='w-full px-5 py-3 border-2 border-slate-200 rounded-full text-center font-nunito text-slate-700 focus:outline-none focus:border-[#FF8C69] bg-white'
			/>
			{error && (
				<p className='mt-2 text-sm text-center text-red-400 font-semibold'>{error}</p>
			)}
			<button
				onClick={handleUnlock}
				disabled={!password.trim()}
				className='mt-4 w-full py-3 bg-[#FF8C69] text-white font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
			>
				Unlock ✨
			</button>
			{showViewOnly && (
				<button
					onClick={handleViewOnly}
					className='mt-3 w-full py-3 border-2 border-[#FF8C69] text-[#FF8C69] font-bold rounded-full hover:bg-[#FF8C69]/5 transition-colors'
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
	useEffect(() => {
		if (!isModal || !onClose) return;
		const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [isModal, onClose]);

	if (isModal) {
		return (
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby='authgate-modal-title'
				onClick={onClose}
				className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
				<div
					onClick={e => e.stopPropagation()}
					className='w-full max-w-sm mx-4 bg-white rounded-3xl p-8 shadow-xl'>
					<h2 id='authgate-modal-title' className='font-poppins text-2xl font-extrabold text-[#1A1A2E] text-center mb-6'>🔑 Unlock editing</h2>
					<PasswordForm onAuth={onAuth} showViewOnly={false} onClose={onClose} />
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-[#FAFAFA] flex items-center justify-center font-nunito px-4'>
			<div className='w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl'>
				<div className='flex flex-col items-center mb-8'>
					<div className='inline-flex items-center justify-center p-4 mb-4 bg-[#FF8C69]/10 rounded-full'>
						<Baby className='w-12 h-12 text-[#FF8C69]' />
					</div>
					<h1 className='font-poppins text-3xl font-extrabold text-[#1A1A2E] text-center'>Our Baby Journey</h1>
					<p className='mt-2 text-slate-500 text-center text-sm leading-relaxed'>
						Enter the password to add memories, or view the timeline as a guest.
					</p>
				</div>
				<PasswordForm onAuth={onAuth} showViewOnly={true} />
			</div>
		</div>
	);
};

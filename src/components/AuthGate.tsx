import { Eye, Key } from '@phosphor-icons/react';
import { motion, useAnimate } from 'motion/react';
import { FormEvent, useState } from 'react';
import { Doodles } from './Doodles';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Emoji } from './ui/Emoji';

const AUTH_STORAGE_KEY = 'timeline_auth';

type AuthOutcome = 'unlocked' | 'view-only';

type FormProps = {
	onAuth: (state: AuthOutcome) => void;
	/** Show the guest option (full-screen gate) or only the password (unlock sheet). */
	showViewOnly: boolean;
};

export const PasswordForm = ({ onAuth, showViewOnly }: FormProps) => {
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [scope, animate] = useAnimate<HTMLFormElement>();

	const handleUnlock = () => {
		const expected = import.meta.env.VITE_APP_PASSWORD;
		if (!expected) console.warn('[AuthGate] VITE_APP_PASSWORD is not set.');
		if (password.trim() === (expected ?? '').trim()) {
			try { localStorage.setItem(AUTH_STORAGE_KEY, 'unlocked'); } catch { /* ignore */ }
			onAuth('unlocked');
		} else {
			setError("That's not the password. Try again?");
			setPassword('');
			void animate(scope.current, { x: [0, -10, 10, -7, 7, -3, 3, 0] }, { duration: 0.45 });
		}
	};

	const handleViewOnly = () => {
		try { localStorage.setItem(AUTH_STORAGE_KEY, 'view-only'); } catch { /* ignore */ }
		onAuth('view-only');
	};

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (password.trim()) handleUnlock();
	};

	return (
		<form ref={scope} onSubmit={onSubmit} className='space-y-3'>
			<input
				type='password'
				value={password}
				onChange={e => { setPassword(e.target.value); setError(''); }}
				placeholder='Family password'
				aria-label='Password'
				aria-invalid={Boolean(error)}
				autoComplete='current-password'
				autoFocus={!showViewOnly}
				className='field text-center'
			/>
			{error && <p role='alert' className='text-center text-sm font-bold text-danger'>{error}</p>}
			<Button type='submit' tone='butter' size='lg' block disabled={!password.trim()}>
				<Key size={18} weight='bold' />
				Unlock
			</Button>
			{showViewOnly && (
				<Button tone='white' size='lg' block onClick={handleViewOnly}>
					<Eye size={18} weight='bold' />
					View as a guest
				</Button>
			)}
		</form>
	);
};

/** Full-screen welcome gate shown until the visitor unlocks or continues as a guest. */
export const AuthGate = ({ onAuth }: { onAuth: (state: AuthOutcome) => void }) => (
	<div className='relative flex min-h-[100dvh] items-center justify-center px-4 py-10'>
		<Doodles />
		<motion.div
			className='relative z-10 w-full max-w-sm'
			initial={{ opacity: 0, y: 24, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ type: 'spring', stiffness: 220, damping: 22 }}
		>
			<Card className='px-6 pb-7 pt-9 text-center'>
				<div className='relative mx-auto h-28 w-28'>
					<motion.div
						className='absolute -left-8 top-1'
						animate={{ y: [0, -8, 0], rotate: [-8, 4, -8] }}
						transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
					>
						<Emoji name='balloon' size={40} eager />
					</motion.div>
					<motion.div
						className='absolute -right-7 top-0'
						animate={{ scale: [1, 1.2, 1], rotate: [0, 20, 0] }}
						transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
					>
						<Emoji name='glowing-star' size={30} eager />
					</motion.div>
					<motion.div
						animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
						transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
					>
						<Emoji name='baby' size={112} eager />
					</motion.div>
				</div>
				<h1 className='mt-4 font-display text-display-xl font-extrabold'>Our Baby Journey</h1>
				<p className='mx-auto mt-2 max-w-[17rem] text-sm font-semibold leading-relaxed text-muted'>
					Family can unlock to add memories. Everyone else, come on in as a guest.
				</p>
				<div className='mt-6'>
					<PasswordForm onAuth={onAuth} showViewOnly />
				</div>
			</Card>
		</motion.div>
	</div>
);

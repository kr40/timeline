import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';
import { BirthCapsuleModal } from './BirthCapsuleModal';
import { getZodiacSign, getBirthstone } from '../data/zodiacData';

const SECTION_COLORS = {
	peach:    'bg-[#FF8C69]/10 border-[#FF8C69]/20',
	mint:     'bg-[#6CC9C9]/10 border-[#6CC9C9]/20',
	lavender: 'bg-[#B39DDB]/10 border-[#B39DDB]/20',
} as const;

const CapsuleSection = ({ title, items, color }: {
	title: string; items: string[]; color: keyof typeof SECTION_COLORS;
}) => (
	<div className={`rounded-3xl border p-5 ${SECTION_COLORS[color]}`}>
		<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>{title}</h3>
		<ul className='space-y-1.5'>
			{items.map((item, i) => (
				<li key={i} className='flex items-start gap-2 text-sm font-semibold text-[#1A1A2E]'>
					<span className='text-[#6B7280] shrink-0 mt-0.5'>•</span>{item}
				</li>
			))}
		</ul>
	</div>
);

// Birth capsule is permanently sealed after first save — no UI edit path. Fix mistakes via a direct Supabase row edit.
export const BabyBookTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const [capsule, setCapsule]     = useState<BirthCapsule | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase.from('birth_capsule').select('*').order('created_at', { ascending: true }).limit(1).maybeSingle();
				setCapsule(data ?? null);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	if (isLoading) return (
		<div className='flex justify-center py-16'>
			<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
		</div>
	);

	const zodiac    = capsule?.birth_date ? getZodiacSign(capsule.birth_date) : null;
	const birthstone = capsule?.birth_date ? getBirthstone(capsule.birth_date) : null;
	const hasIdentity = Boolean(capsule?.baby_name || capsule?.name_meaning || (capsule?.nicknames?.length ?? 0) > 0 || zodiac || birthstone);

	return (
		<div className='space-y-4 pb-4'>
			{!capsule ? (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-6xl mb-4'>📚</div>
					<h2 className='font-poppins font-extrabold text-xl text-[#1A1A2E] mb-2'>Baby Book Coming Soon ✨</h2>
					<p className='text-sm text-[#6B7280] font-semibold leading-relaxed max-w-xs mx-auto'>
						Fill this in when baby arrives — headlines, sports scores, famous birthdays, and all the details of the big day ✨
					</p>
					{isUnlocked && (
						<button onClick={() => setShowModal(true)}
							className='mt-6 px-6 py-3 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all text-sm'>
							📝 Fill In Birth Capsule
						</button>
					)}
				</div>
			) : (
				<>
					<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white shadow-lg shadow-[#FF8C69]/30'>
						<div>
							<p className='text-white/70 text-xs font-bold uppercase tracking-widest mb-1'>Baby arrived on</p>
							<h2 className='font-poppins font-extrabold text-2xl leading-tight'>
								{capsule.birth_date
									? new Date(capsule.birth_date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
									: 'The big day!'}
							</h2>
							{capsule.birth_time && <p className='text-white/80 font-semibold text-sm mt-0.5'>at {capsule.birth_time}</p>}
						</div>
						{(capsule.weight_kg || capsule.length_cm || capsule.location) && (
							<div className='flex gap-3 mt-4 flex-wrap'>
								{capsule.weight_kg && (
									<div className='bg-white/20 rounded-2xl px-4 py-2 text-center'>
										<p className='text-white/70 text-[10px] font-bold uppercase'>Weight</p>
										<p className='text-white font-poppins font-extrabold text-lg'>{capsule.weight_kg}kg</p>
									</div>
								)}
								{capsule.length_cm && (
									<div className='bg-white/20 rounded-2xl px-4 py-2 text-center'>
										<p className='text-white/70 text-[10px] font-bold uppercase'>Length</p>
										<p className='text-white font-poppins font-extrabold text-lg'>{capsule.length_cm}cm</p>
									</div>
								)}
								{capsule.location && (
									<div className='bg-white/20 rounded-2xl px-4 py-2 text-center'>
										<p className='text-white/70 text-[10px] font-bold uppercase'>Where</p>
										<p className='text-white font-poppins font-extrabold text-sm'>{capsule.location}</p>
									</div>
								)}
							</div>
						)}
					</div>

					{hasIdentity && (
						<div className='rounded-3xl border p-5 bg-[#FF8C69]/10 border-[#FF8C69]/20'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>Baby's Identity 👶</h3>
							{capsule.baby_name && (
								<p className='font-poppins font-extrabold text-xl text-[#1A1A2E]'>{capsule.baby_name}</p>
							)}
							{capsule.name_meaning && (
								<p className='text-sm text-[#6B7280] font-semibold italic mt-1'>{capsule.name_meaning}</p>
							)}
							{capsule.nicknames?.length > 0 && (
								<div className='flex gap-2 flex-wrap mt-3'>
									{capsule.nicknames.map((nick, i) => (
										<span key={i} className='bg-white text-[#FF8C69] text-xs font-bold px-3 py-1 rounded-full'>{nick}</span>
									))}
								</div>
							)}
							{(zodiac || birthstone) && (
								<div className='flex gap-2 mt-3'>
									{zodiac && (
										<span className='bg-white/70 text-[#1A1A2E] text-xs font-bold px-3 py-1.5 rounded-full'>
											{zodiac.emoji} {zodiac.name}
										</span>
									)}
									{birthstone && (
										<span className='bg-white/70 text-[#1A1A2E] text-xs font-bold px-3 py-1.5 rounded-full'>
											{birthstone.emoji} {birthstone.name}
										</span>
									)}
								</div>
							)}
						</div>
					)}

					{capsule.letter_to_baby && (
						<div className='rounded-3xl border p-5 bg-[#B39DDB]/10 border-[#B39DDB]/20'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>💌 A Letter To You</h3>
							<p className='text-sm text-[#1A1A2E] font-semibold leading-relaxed whitespace-pre-line'>{capsule.letter_to_baby}</p>
						</div>
					)}

					{capsule.visitors?.length > 0 && (
						<CapsuleSection title='Who Was There 👪' items={capsule.visitors} color='mint' />
					)}

					{capsule.headlines?.length > 0        && <CapsuleSection title='World Headlines 📰' items={capsule.headlines} color='peach' />}
					{capsule.sports_results?.length > 0   && <CapsuleSection title='Sports ⚽' items={capsule.sports_results} color='mint' />}
					{(capsule.top_song || capsule.top_movie) && (
						<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>Culture 🎵🎬</h3>
							{capsule.top_song  && <p className='text-sm font-semibold text-[#6B7280]'>🎵 {capsule.top_song}</p>}
							{capsule.top_movie && <p className='text-sm font-semibold text-[#6B7280] mt-1'>🎬 {capsule.top_movie}</p>}
						</div>
					)}
					{capsule.famous_birthdays?.length > 0 && <CapsuleSection title='Famous Birthdays 🎂' items={capsule.famous_birthdays} color='lavender' />}
					{capsule.weather && (
						<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-1'>Weather ☀️</h3>
							<p className='text-sm font-semibold text-[#6B7280]'>{capsule.weather}</p>
						</div>
					)}
					{capsule.notes && (
						<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-1'>Notes 📝</h3>
							<p className='text-sm font-semibold text-[#6B7280] leading-relaxed whitespace-pre-line'>{capsule.notes}</p>
						</div>
					)}
				</>
			)}

			{showModal && (
				<BirthCapsuleModal
					onClose={() => setShowModal(false)}
					onSaved={updated => { setCapsule(updated); setShowModal(false); }}
				/>
			)}
		</div>
	);
};

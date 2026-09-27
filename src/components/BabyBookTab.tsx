import { PencilSimple } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { getBirthstone, getZodiacSign } from '../data/zodiacData';
import type { EmojiName } from '../emoji';
import { celebrate } from '../lib/celebrate';
import { floatLoop } from '../lib/motion';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';
import { BirthCapsuleForm } from './babybook/BirthCapsuleForm';
import { SealStamp } from './babybook/SealStamp';
import { Button } from './ui/Button';
import { Card, type Tone } from './ui/Card';
import { Emoji } from './ui/Emoji';
import { Reveal } from './ui/Reveal';
import { Sheet } from './ui/Sheet';
import { Spinner } from './ui/Spinner';

const Section = ({ emoji, title, tone = 'white', children }: { emoji: EmojiName; title: string; tone?: Tone; children: ReactNode }) => (
	<Reveal>
		<Card tone={tone} className='p-4'>
			<h3 className='mb-2.5 flex items-center gap-2 font-display text-[17px] font-extrabold'>
				<Emoji name={emoji} size={26} />
				{title}
			</h3>
			{children}
		</Card>
	</Reveal>
);

const List = ({ items }: { items: string[] }) => (
	<ul className='space-y-1.5'>
		{items.map((item, i) => (
			<li key={i} className='flex gap-2 text-[14px] font-semibold leading-snug'>
				<span aria-hidden className='mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink' />
				{item}
			</li>
		))}
	</ul>
);

const Chip = ({ children }: { children: ReactNode }) => (
	<span className='inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-extrabold'>{children}</span>
);

const ComingSoon = ({ isUnlocked, onFill }: { isUnlocked: boolean; onFill: () => void }) => (
	<Card className='overflow-hidden px-6 pb-8 pt-10 text-center'>
		<div className='relative mx-auto h-32 w-48'>
			<motion.div className='absolute left-0 top-9' {...floatLoop(3.4, 0.2)}>
				<Emoji name='baby-bottle' size={52} eager />
			</motion.div>
			<div className='absolute left-1/2 top-0 -translate-x-1/2'>
				<motion.div {...floatLoop(3)}>
					<Emoji name='teddy-bear' size={96} eager />
				</motion.div>
			</div>
			<motion.div className='absolute right-0 top-11' {...floatLoop(3.8, 0.6)}>
				<Emoji name='ribbon' size={44} eager />
			</motion.div>
		</div>
		<h2 className='mt-4 font-display text-display-lg font-extrabold'>Baby Book coming soon</h2>
		<p className='mx-auto mt-2 max-w-xs text-sm font-semibold leading-relaxed text-muted'>
			When baby arrives, this becomes a keepsake of the big day — the headlines, the weather, famous birthdays, and a letter from Mum and Dad.
		</p>
		{isUnlocked && (
			<div className='mt-6'>
				<Button tone='butter' size='lg' onClick={onFill}>
					<PencilSimple size={18} weight='bold' />
					Fill in the birth capsule
				</Button>
			</div>
		)}
	</Card>
);

const CapsuleView = ({ capsule }: { capsule: BirthCapsule }) => {
	const zodiac = capsule.birth_date ? getZodiacSign(capsule.birth_date) : null;
	const birthstone = capsule.birth_date ? getBirthstone(capsule.birth_date) : null;
	const hasIdentity = Boolean(capsule.baby_name || capsule.name_meaning || (capsule.nicknames?.length ?? 0) > 0 || zodiac || birthstone);

	return (
		<div className='space-y-4'>
			<Card tone='peach' className='relative overflow-hidden p-5'>
				<motion.div className='absolute -right-1 -top-1' {...floatLoop(3.2)}>
					<Emoji name='baby' size={84} eager />
				</motion.div>
				<p className='eyebrow text-ink/60'>Baby arrived on</p>
				<h2 className='mt-1 max-w-[70%] font-display text-display-xl font-extrabold'>
					{capsule.birth_date
						? new Date(`${capsule.birth_date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
						: 'The big day!'}
				</h2>
				{capsule.birth_time && <p className='mt-1 text-sm font-bold text-ink/70'>at {capsule.birth_time}</p>}
				{(capsule.weight_kg || capsule.length_cm || capsule.location) && (
					<div className='mt-4 flex flex-wrap gap-2'>
						{capsule.weight_kg && <Chip>Weight · {capsule.weight_kg} kg</Chip>}
						{capsule.length_cm && <Chip>Length · {capsule.length_cm} cm</Chip>}
						{capsule.location && <Chip>{capsule.location}</Chip>}
					</div>
				)}
			</Card>

			{hasIdentity && (
				<Section emoji='ribbon' title="Baby's identity" tone='butter'>
					{capsule.baby_name && <p className='font-display text-display-lg font-extrabold'>{capsule.baby_name}</p>}
					{capsule.name_meaning && <p className='mt-1 text-sm font-semibold italic text-ink/75'>{capsule.name_meaning}</p>}
					{capsule.nicknames?.length > 0 && (
						<div className='mt-3 flex flex-wrap gap-2'>{capsule.nicknames.map((n, i) => <Chip key={i}>{n}</Chip>)}</div>
					)}
					{(zodiac || birthstone) && (
						<div className='mt-3 flex flex-wrap gap-2'>
							{zodiac && <Chip>{zodiac.emoji} {zodiac.name}</Chip>}
							{birthstone && <Chip><Emoji name='gem-stone' size={14} />{birthstone.name}</Chip>}
						</div>
					)}
				</Section>
			)}
			{capsule.letter_to_baby && (
				<Section emoji='love-letter' title='A letter to you' tone='lav'>
					<p className='whitespace-pre-line text-[15px] font-semibold leading-relaxed'>{capsule.letter_to_baby}</p>
				</Section>
			)}
			{capsule.visitors?.length > 0 && <Section emoji='hugging-face' title='Who was there' tone='mint'><List items={capsule.visitors} /></Section>}
			{capsule.headlines?.length > 0 && <Section emoji='newspaper' title='World headlines'><List items={capsule.headlines} /></Section>}
			{capsule.sports_results?.length > 0 && <Section emoji='soccer-ball' title='Sports' tone='mint'><List items={capsule.sports_results} /></Section>}
			{(capsule.top_song || capsule.top_movie) && (
				<Section emoji='musical-notes' title='Culture' tone='pink'>
					<div className='space-y-2 text-[14px] font-semibold'>
						{capsule.top_song && <p className='flex items-center gap-2'><Emoji name='musical-notes' size={18} />{capsule.top_song}</p>}
						{capsule.top_movie && <p className='flex items-center gap-2'><Emoji name='clapper-board' size={18} />{capsule.top_movie}</p>}
					</div>
				</Section>
			)}
			{capsule.famous_birthdays?.length > 0 && <Section emoji='birthday-cake' title='Famous birthdays' tone='lav'><List items={capsule.famous_birthdays} /></Section>}
			{capsule.weather && (
				<Section emoji='sun-behind-small-cloud' title='Weather' tone='sky'>
					<p className='text-[14px] font-semibold'>{capsule.weather}</p>
				</Section>
			)}
			{capsule.notes && (
				<Section emoji='memo' title='Notes'>
					<p className='whitespace-pre-line text-[14px] font-semibold leading-relaxed'>{capsule.notes}</p>
				</Section>
			)}
		</div>
	);
};

// Birth capsule is permanently sealed after first save — no UI edit path. Fix mistakes via a direct Supabase row edit.
export const BabyBookTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const [capsule, setCapsule] = useState<BirthCapsule | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [filling, setFilling] = useState(false);
	const [sealed, setSealed] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase
					.from('birth_capsule')
					.select('*')
					.order('created_at', { ascending: true })
					.limit(1)
					.maybeSingle();
				setCapsule(data ?? null);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const closeForm = useCallback(() => setFilling(false), []);
	const stampDone = useCallback(() => setSealed(false), []);
	const onSaved = (saved: BirthCapsule) => {
		setCapsule(saved);
		setFilling(false);
		setSealed(true);
		celebrate();
	};

	if (isLoading) return <Spinner label='Loading the baby book' />;

	return (
		<div className='pb-4'>
			{capsule ? <CapsuleView capsule={capsule} /> : <ComingSoon isUnlocked={isUnlocked} onFill={() => setFilling(true)} />}
			<Sheet open={filling} onClose={closeForm} title={<span className='flex items-center gap-2'>Birth capsule <Emoji name='ribbon' size={26} /></span>}>
				<BirthCapsuleForm onSaved={onSaved} />
			</Sheet>
			<SealStamp show={sealed} onDone={stampDone} />
		</div>
	);
};

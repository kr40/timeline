import { BookOpenText, Books, HandHeart, House, type Icon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

export type TabId = 'home' | 'timeline' | 'wishes' | 'babybook';

export const TABS: { id: TabId; label: string; Icon: Icon }[] = [
	{ id: 'home',     label: 'Home',      Icon: House },
	{ id: 'timeline', label: 'Timeline',  Icon: BookOpenText },
	{ id: 'wishes',   label: 'Blessings', Icon: HandHeart },
	{ id: 'babybook', label: 'Baby Book', Icon: Books },
];

type Props = { activeTab: TabId; onTabChange: (tab: TabId) => void };

/** Floating sticker tab bar; the butter pill slides between tabs. */
export const TabBar = ({ activeTab, onTabChange }: Props) => (
	<nav
		aria-label='Sections'
		className='pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
	>
		<div className='pointer-events-auto mx-auto flex max-w-[460px] gap-1 rounded-[26px] border-2 border-ink bg-white p-1.5 shadow-sticker'>
			{TABS.map(({ id, label, Icon }) => {
				const active = activeTab === id;
				return (
					<button
						key={id}
						type='button'
						onClick={() => onTabChange(id)}
						aria-current={active ? 'page' : undefined}
						className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-[18px] px-1 py-1.5 text-[11px] font-extrabold transition-colors ${
							active ? 'text-ink' : 'text-muted hover:text-ink'
						}`}
					>
						{active && (
							<motion.span
								layoutId='tab-pill'
								className='absolute inset-0 rounded-[18px] border-2 border-ink bg-butter'
								transition={{ type: 'spring', stiffness: 520, damping: 34 }}
							/>
						)}
						<motion.span
							className='relative'
							animate={active ? { y: [0, -5, 0], scale: [1, 1.18, 1] } : { y: 0, scale: 1 }}
							transition={{ duration: 0.42 }}
						>
							<Icon size={24} weight={active ? 'duotone' : 'regular'} />
						</motion.span>
						<span className='relative'>{label}</span>
					</button>
				);
			})}
		</div>
	</nav>
);

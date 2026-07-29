import { BookOpen, HandHeart, Home, Library, PartyPopper } from 'lucide-react';

export type TabId = 'home' | 'timeline' | 'wishes' | 'shower' | 'babybook';

type Tab = { id: TabId; label: string; Icon: React.FC<{ className?: string }> };

const TABS: Tab[] = [
	{ id: 'home',     label: 'Home',      Icon: Home },
	{ id: 'timeline', label: 'Timeline',  Icon: BookOpen },
	{ id: 'wishes',   label: 'Blessings', Icon: HandHeart },
	{ id: 'shower',   label: 'Shower',    Icon: PartyPopper },
	{ id: 'babybook', label: 'Baby Book', Icon: Library },
];

type Props = { activeTab: TabId; onTabChange: (tab: TabId) => void; visibleTabs: TabId[] };

export const TabBar = ({ activeTab, onTabChange, visibleTabs }: Props) => (
	<nav className='fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-30'>
		<div className='max-w-[600px] mx-auto flex justify-around items-center py-2'>
			{TABS.filter(t => visibleTabs.includes(t.id)).map(({ id, label, Icon }) => {
				const active = activeTab === id;
				return (
					<button
						key={id}
						onClick={() => onTabChange(id)}
						className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-colors ${
							active ? 'text-[#FF8C69]' : 'text-slate-400'
						}`}>
						<Icon className={`w-6 h-6 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
						<span className='text-[10px] font-bold tracking-wide'>{label}</span>
					</button>
				);
			})}
		</div>
	</nav>
);

import { motion } from 'motion/react';

type Props = { label: string; count: number; total: number; color: string; mine?: boolean };

/** One option's share of the vote, with a springy fill. */
export const ResultBar = ({ label, count, total, color, mine = false }: Props) => {
	const pct = total > 0 ? Math.round((count / total) * 100) : 0;
	return (
		<div>
			<div className='mb-1 flex items-baseline justify-between gap-2 text-[13px] font-extrabold'>
				<span className='flex min-w-0 items-center gap-1.5'>
					<span className='truncate'>{label}</span>
					{mine && <span className='rounded-full bg-ink px-1.5 py-px text-[10px] text-white'>You</span>}
				</span>
				<span className='tabular-nums text-muted'>{pct}%</span>
			</div>
			<div className='h-3.5 overflow-hidden rounded-full border-2 border-ink bg-white'>
				<motion.div
					className='h-full rounded-r-full'
					style={{ backgroundColor: color }}
					initial={{ width: '0%' }}
					animate={{ width: `${pct}%` }}
					transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.1 }}
				/>
			</div>
		</div>
	);
};

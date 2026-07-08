import { getCurrentWeek } from '../../config';
import { getFruitForWeek } from '../../data/fruitData';

export const FruitTracker = () => {
	const week  = getCurrentWeek();
	const entry = getFruitForWeek(week);

	return (
		<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
			<div className='flex items-center justify-between mb-3'>
				<h2 className='font-poppins font-bold text-[#1A1A2E] text-base'>Baby this week</h2>
				<span className='bg-[#6CC9C9]/15 text-[#6CC9C9] text-xs font-bold px-3 py-1 rounded-full'>
					Week {week}
				</span>
			</div>
			<div className='flex items-center gap-4'>
				<div className='text-6xl'>{entry.emoji}</div>
				<div className='flex-1 min-w-0'>
					<p className='font-poppins font-extrabold text-2xl text-[#1A1A2E] leading-tight'>{entry.fruit}</p>
					<div className='flex gap-2 mt-1 flex-wrap'>
						<span className='text-xs font-semibold text-[#6B7280] bg-slate-50 px-2 py-0.5 rounded-full'>
							{entry.lengthCm} cm
						</span>
						{entry.weightG > 0 && (
							<span className='text-xs font-semibold text-[#6B7280] bg-slate-50 px-2 py-0.5 rounded-full'>
								~{entry.weightG}g
							</span>
						)}
					</div>
				</div>
			</div>
			<p className='mt-4 text-sm text-[#6B7280] font-semibold leading-relaxed bg-[#6CC9C9]/10 rounded-2xl px-4 py-3'>
				✨ {entry.fact}
			</p>
		</div>
	);
};

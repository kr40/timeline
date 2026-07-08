import { getCurrentWeek } from '../../config';
import { getFactsForWeek } from '../../data/weeklyFacts';

export const WeeklyFacts = () => {
	const week      = getCurrentWeek();
	const { facts } = getFactsForWeek(week);

	return (
		<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
			<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-4'>This week in pregnancy</h2>
			<ul className='space-y-3'>
				{facts.map((fact, i) => (
					<li key={i} className='flex items-start gap-3'>
						<span className='shrink-0 w-6 h-6 rounded-full bg-[#B39DDB]/20 text-[#B39DDB] flex items-center justify-center text-xs font-bold mt-0.5'>
							{i + 1}
						</span>
						<p className='text-sm text-[#6B7280] font-semibold leading-relaxed'>{fact}</p>
					</li>
				))}
			</ul>
		</div>
	);
};

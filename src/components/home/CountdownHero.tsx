import { getDaysUntilEDD } from '../../config';

export const CountdownHero = () => {
	const days      = getDaysUntilEDD();
	const isArrived = days <= 0;

	return (
		<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white text-center shadow-lg shadow-[#FF8C69]/30'>
			{isArrived ? (
				<>
					<div className='text-5xl mb-2'>🎉</div>
					<h2 className='font-poppins font-extrabold text-3xl'>Baby is here!</h2>
					<p className='text-white/80 mt-1 font-semibold'>Welcome to the world, little one!</p>
				</>
			) : (
				<>
					<p className='text-white/70 font-bold text-xs uppercase tracking-widest mb-1'>Baby arrives in</p>
					<div className='font-poppins font-extrabold text-7xl leading-none'>{days}</div>
					<p className='text-white/90 font-bold text-xl mt-1'>{days === 1 ? 'day' : 'days'} to go 🌟</p>
					<p className='text-white/50 text-xs mt-3'>Estimated due date: 9 November 2026</p>
				</>
			)}
		</div>
	);
};

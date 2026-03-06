import { Baby, Footprints, Gift, Heart, Moon, Music, Smile, Sparkles, Star } from 'lucide-react';

export const FloatingBackground = () => (
	<div className='fixed inset-0 z-0 overflow-hidden pointer-events-none'>
		<Sparkles className='absolute top-[8%] left-[6%] text-amber-400 opacity-70 animate-float' size={56} />
		<Star
			className='absolute top-[25%] right-[12%] text-amber-400 opacity-60 animate-float-delayed'
			size={40}
			fill='currentColor'
		/>
		<Heart
			className='absolute top-[60%] left-[8%] text-pink-300 opacity-60 animate-float'
			size={48}
			fill='currentColor'
		/>
		<Moon
			className='absolute top-[15%] right-[20%] text-indigo-300 opacity-50 animate-float-delayed'
			size={50}
			fill='currentColor'
		/>
		<Sparkles className='absolute bottom-[20%] right-[10%] text-amber-400 opacity-70 animate-float' size={44} />
		<Baby className='absolute top-[80%] left-[12%] text-blue-300 opacity-50 animate-float-delayed' size={40} />
		<Smile className='absolute top-[40%] left-[18%] text-orange-300 opacity-50 animate-float' size={38} />
		<Gift className='absolute top-[75%] right-[25%] text-teal-300 opacity-50 animate-float-delayed' size={46} />
		<Music className='absolute top-[35%] right-[30%] text-rose-300 opacity-40 animate-float' size={36} />
		<Footprints
			className='absolute bottom-[25%] left-[25%] text-stone-300 opacity-50 animate-float-delayed'
			size={40}
			fill='currentColor'
		/>
		<Heart
			className='absolute top-[5%] right-[40%] text-pink-300 opacity-50 animate-float'
			size={32}
			fill='currentColor'
		/>
		<Star
			className='absolute bottom-[5%] left-[35%] text-amber-300 opacity-60 animate-float-delayed'
			size={30}
			fill='currentColor'
		/>
		<Sparkles className='absolute top-[50%] right-[5%] text-amber-400 opacity-60 animate-float' size={38} />
		<Baby className='absolute top-[90%] right-[40%] text-blue-300 opacity-40 animate-float' size={36} />
	</div>
);

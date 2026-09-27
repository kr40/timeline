import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { fallbackTo, ikResize } from '../../lib/imagekit';

type Props = { images: string[]; title: string; onOpen: (index: number) => void };

const slide = {
	enter:  (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: dir === 0 ? 0 : 1 }),
	center: { x: 0, opacity: 1 },
	exit:   (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 1 }),
};

const ARROW = 'press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white/95 shadow-sticker-sm';

/** Swipeable photos for the memory sheet; tap a photo to open it full screen. */
export const PhotoCarousel = ({ images, title, onOpen }: Props) => {
	const [[index, dir], setView] = useState<[number, number]>([0, 0]);
	const multi = images.length > 1;
	const go = (step: number) => setView(([i]) => [(i + step + images.length) % images.length, step]);

	return (
		<div>
			<div className='relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-ink bg-dot/40 shadow-sticker-sm'>
				<AnimatePresence initial={false} custom={dir}>
					<motion.img
						key={index}
						src={ikResize(images[index], 1200)}
						alt={`${title} — photo ${index + 1} of ${images.length}`}
						custom={dir}
						variants={slide}
						initial='enter'
						animate='center'
						exit='exit'
						transition={{ type: 'spring', stiffness: 300, damping: 32 }}
						drag={multi ? 'x' : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.5}
						onDragEnd={(_, info) => {
							if (info.offset.x < -60) go(1);
							else if (info.offset.x > 60) go(-1);
						}}
						onTap={() => onOpen(index)}
						onError={fallbackTo(images[index])}
						draggable={false}
						className='absolute inset-0 h-full w-full cursor-zoom-in select-none object-cover'
					/>
				</AnimatePresence>
				{multi && (
					<>
						<div className='absolute left-2 top-1/2 z-10 -translate-y-1/2'>
							<button type='button' aria-label='Previous photo' onClick={() => go(-1)} className={ARROW}>
								<CaretLeft size={16} weight='bold' />
							</button>
						</div>
						<div className='absolute right-2 top-1/2 z-10 -translate-y-1/2'>
							<button type='button' aria-label='Next photo' onClick={() => go(1)} className={ARROW}>
								<CaretRight size={16} weight='bold' />
							</button>
						</div>
					</>
				)}
			</div>
			{multi && (
				<div className='mt-3 flex justify-center gap-1.5'>
					{images.map((_, i) => (
						<button key={i} type='button' aria-label={`Photo ${i + 1}`} onClick={() => go(i - index)} className='grid h-5 place-items-center'>
							<motion.span
								className={`block h-2 rounded-full ${i === index ? 'bg-ink' : 'bg-ink/20'}`}
								animate={{ width: i === index ? 18 : 8 }}
								transition={{ type: 'spring', stiffness: 500, damping: 30 }}
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

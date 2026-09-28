import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { fallbackTo, ikResize } from '../../lib/imagekit';

type Props = { images: string[]; title: string; onOpen: (index: number) => void };

const ARROW = 'press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white/95 shadow-sticker-sm';

/**
 * Photos for the memory sheet. Swipe to browse (native scroll-snap, so a swipe is never
 * mistaken for a tap); tap a photo to open it full screen.
 */
export const PhotoCarousel = ({ images, title, onOpen }: Props) => {
	const track = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const multi = images.length > 1;

	const scrollToPhoto = (i: number) => {
		const el = track.current;
		if (!el) return;
		const target = (i + images.length) % images.length;
		el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
	};

	const onScroll = () => {
		const el = track.current;
		if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
	};

	return (
		<div>
			<div className='relative overflow-hidden rounded-2xl border-2 border-ink bg-dot/40 shadow-sticker-sm'>
				<div
					ref={track}
					onScroll={onScroll}
					className='no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto overscroll-x-contain'
				>
					{images.map((url, i) => (
						<button
							key={`${i}-${url}`}
							type='button'
							onClick={() => onOpen(i)}
							aria-label={`${title}, photo ${i + 1} of ${images.length}. Open full screen`}
							className='h-full w-full shrink-0 snap-center snap-always cursor-zoom-in'
						>
							<img
								src={ikResize(url, 1200)}
								alt=''
								loading={i === 0 ? 'eager' : 'lazy'}
								decoding='async'
								draggable={false}
								onError={fallbackTo(url)}
								className='h-full w-full select-none object-cover'
							/>
						</button>
					))}
				</div>
				{multi && (
					<>
						<div className='absolute left-2 top-1/2 z-10 -translate-y-1/2'>
							<button type='button' aria-label='Previous photo' onClick={() => scrollToPhoto(index - 1)} className={ARROW}>
								<CaretLeft size={16} weight='bold' />
							</button>
						</div>
						<div className='absolute right-2 top-1/2 z-10 -translate-y-1/2'>
							<button type='button' aria-label='Next photo' onClick={() => scrollToPhoto(index + 1)} className={ARROW}>
								<CaretRight size={16} weight='bold' />
							</button>
						</div>
					</>
				)}
			</div>
			{multi && (
				<div className='mt-3 flex justify-center gap-1.5'>
					{images.map((_, i) => (
						<button key={i} type='button' aria-label={`Photo ${i + 1}`} onClick={() => scrollToPhoto(i)} className='grid h-5 place-items-center'>
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

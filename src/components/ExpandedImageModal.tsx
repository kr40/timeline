import { X } from 'lucide-react';
import { useEffect } from 'react';

export const ExpandedImageModal = ({ image, onClose }: { image: string; onClose: () => void }) => {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	return (
		<div
			className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] cursor-pointer'
			onClick={onClose}>
			<div className='relative max-w-full max-h-[90vh]'>
				<img
					src={image}
					alt='Expanded Memory'
					className='max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl scale-100 transition-transform cursor-auto'
					onClick={(e) => e.stopPropagation()}
				/>
				<button
					onClick={onClose}
					className='absolute z-10 hidden p-2 transition-colors bg-white rounded-full shadow-xl -top-4 -right-4 text-slate-800 hover:bg-pink-50 hover:text-pink-500 md:block'>
					<X className='w-6 h-6' />
				</button>
			</div>
		</div>
	);
};

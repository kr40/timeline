import { useRef } from 'react';

/** Detects horizontal swipe gestures. Ignores primarily-vertical movements
 *  so normal page scrolling is not affected. */
export const useSwipe = (
	onSwipeLeft: () => void,
	onSwipeRight: () => void,
	minDistance = 40,
) => {
	const start = useRef<{ x: number; y: number } | null>(null);

	const onTouchStart = (e: React.TouchEvent) => {
		start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	};

	const onTouchEnd = (e: React.TouchEvent) => {
		if (!start.current) return;
		const dx = e.changedTouches[0].clientX - start.current.x;
		const dy = e.changedTouches[0].clientY - start.current.y;
		start.current = null;
		if (Math.abs(dx) < minDistance || Math.abs(dx) < Math.abs(dy)) return;
		if (dx < 0) onSwipeLeft();
		else onSwipeRight();
	};

	return { onTouchStart, onTouchEnd };
};

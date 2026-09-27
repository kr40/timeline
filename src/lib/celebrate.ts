import confetti from 'canvas-confetti';

const COLORS = ['#FFE680', '#FFD6C7', '#CBF1EC', '#E6DBFF', '#FFD6E5', '#D3E8FF', '#2B2340'];

/** Small confetti burst from the centre of an element (e.g. the button that was tapped). */
export function burstFrom(el: Element | null, count = 40): void {
	const rect = el?.getBoundingClientRect();
	const x = rect && rect.width > 0 ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
	const y = rect && rect.height > 0 ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;
	void confetti({
		particleCount: count,
		spread: 70,
		startVelocity: 28,
		gravity: 0.9,
		scalar: 0.9,
		ticks: 140,
		origin: { x, y },
		colors: COLORS,
		zIndex: 100,
		disableForReducedMotion: true,
	});
}

/** Big two-sided celebration for milestone moments. */
export function celebrate(): void {
	const shared = { spread: 65, startVelocity: 45, ticks: 200, colors: COLORS, zIndex: 100, disableForReducedMotion: true };
	void confetti({ ...shared, particleCount: 70, angle: 60, origin: { x: 0, y: 0.75 } });
	void confetti({ ...shared, particleCount: 70, angle: 120, origin: { x: 1, y: 0.75 } });
}

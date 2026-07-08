export const EDD       = '2026-11-09';
export const APP_TITLE = 'Baby Journey ✨';

/** Returns current pregnancy week (4–40) derived from EDD. */
export function getCurrentWeek(): number {
	const daysUntil = getDaysUntilEDD();
	const week = 40 - Math.round(daysUntil / 7);
	return Math.max(4, Math.min(40, week));
}

/** Days remaining until EDD — negative after EDD passes. */
export function getDaysUntilEDD(): number {
	const today = new Date();
	const edd   = new Date(EDD);
	return Math.ceil((edd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

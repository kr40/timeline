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

/** Guess-the-birthday date range: 1st of the month before EDD through the last day of EDD's month. */
export function getGuessDateRange(): { min: string; max: string } {
	const edd = new Date(EDD + 'T00:00:00');
	const min = new Date(edd.getFullYear(), edd.getMonth() - 1, 1);
	const max = new Date(edd.getFullYear(), edd.getMonth() + 1, 0);
	const toISODate = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	return { min: toISODate(min), max: toISODate(max) };
}

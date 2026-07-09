type Sign = { emoji: string; name: string };

const ZODIAC_RANGES: { name: string; emoji: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
	{ name: 'Capricorn',  emoji: '♑', startMonth: 12, startDay: 22, endMonth: 1,  endDay: 19 },
	{ name: 'Aquarius',   emoji: '♒', startMonth: 1,  startDay: 20, endMonth: 2,  endDay: 18 },
	{ name: 'Pisces',     emoji: '♓', startMonth: 2,  startDay: 19, endMonth: 3,  endDay: 20 },
	{ name: 'Aries',      emoji: '♈', startMonth: 3,  startDay: 21, endMonth: 4,  endDay: 19 },
	{ name: 'Taurus',     emoji: '♉', startMonth: 4,  startDay: 20, endMonth: 5,  endDay: 20 },
	{ name: 'Gemini',     emoji: '♊', startMonth: 5,  startDay: 21, endMonth: 6,  endDay: 20 },
	{ name: 'Cancer',     emoji: '♋', startMonth: 6,  startDay: 21, endMonth: 7,  endDay: 22 },
	{ name: 'Leo',        emoji: '♌', startMonth: 7,  startDay: 23, endMonth: 8,  endDay: 22 },
	{ name: 'Virgo',      emoji: '♍', startMonth: 8,  startDay: 23, endMonth: 9,  endDay: 22 },
	{ name: 'Libra',      emoji: '♎', startMonth: 9,  startDay: 23, endMonth: 10, endDay: 22 },
	{ name: 'Scorpio',    emoji: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
	{ name: 'Sagittarius',emoji: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

const BIRTHSTONES: Record<number, Sign> = {
	1:  { emoji: '💎', name: 'Garnet' },
	2:  { emoji: '💎', name: 'Amethyst' },
	3:  { emoji: '💎', name: 'Aquamarine' },
	4:  { emoji: '💎', name: 'Diamond' },
	5:  { emoji: '💎', name: 'Emerald' },
	6:  { emoji: '💎', name: 'Pearl' },
	7:  { emoji: '💎', name: 'Ruby' },
	8:  { emoji: '💎', name: 'Peridot' },
	9:  { emoji: '💎', name: 'Sapphire' },
	10: { emoji: '💎', name: 'Opal' },
	11: { emoji: '💎', name: 'Topaz' },
	12: { emoji: '💎', name: 'Turquoise' },
};

export function getZodiacSign(birthDate: string): Sign {
	const d = new Date(birthDate + 'T12:00:00');
	const month = d.getMonth() + 1;
	const day = d.getDate();

	for (const range of ZODIAC_RANGES) {
		const { startMonth, startDay, endMonth, endDay } = range;
		if (startMonth === endMonth) {
			if (month === startMonth && day >= startDay && day <= endDay) return { emoji: range.emoji, name: range.name };
		} else if (startMonth > endMonth) {
			// wraps around year boundary (Capricorn: Dec 22 – Jan 19)
			if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
				return { emoji: range.emoji, name: range.name };
			}
		} else {
			if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
				return { emoji: range.emoji, name: range.name };
			}
		}
	}
	return { emoji: '♑', name: 'Capricorn' };
}

export function getBirthstone(birthDate: string): Sign {
	const d = new Date(birthDate + 'T12:00:00');
	return BIRTHSTONES[d.getMonth() + 1];
}

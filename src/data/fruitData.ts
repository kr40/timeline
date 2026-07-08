export type FruitEntry = {
	week:     number;
	fruit:    string;
	emoji:    string;
	lengthCm: number;
	weightG:  number;
	fact:     string;
};

export const fruitData: FruitEntry[] = [
	{ week: 4,  fruit: 'Poppy Seed',       emoji: '🌱', lengthCm: 0.1,  weightG: 0,    fact: 'The embryo is smaller than a grain of rice!' },
	{ week: 5,  fruit: 'Sesame Seed',       emoji: '🌿', lengthCm: 0.2,  weightG: 0,    fact: 'The heart is beginning to form.' },
	{ week: 6,  fruit: 'Sweet Pea',         emoji: '💚', lengthCm: 0.5,  weightG: 0,    fact: 'Tiny arm and leg buds are appearing.' },
	{ week: 7,  fruit: 'Blueberry',         emoji: '🫐', lengthCm: 1.0,  weightG: 0,    fact: 'The brain and face are developing rapidly.' },
	{ week: 8,  fruit: 'Kidney Bean',       emoji: '🫘', lengthCm: 1.6,  weightG: 1,    fact: 'Baby is moving, though you can\'t feel it yet.' },
	{ week: 9,  fruit: 'Grape',             emoji: '🍇', lengthCm: 2.3,  weightG: 2,    fact: 'Tiny fingers and toes are forming.' },
	{ week: 10, fruit: 'Kumquat',           emoji: '🍊', lengthCm: 3.1,  weightG: 4,    fact: 'Baby\'s vital organs are mostly formed.' },
	{ week: 11, fruit: 'Fig',               emoji: '🍂', lengthCm: 4.1,  weightG: 7,    fact: 'Baby can open and close their fingers.' },
	{ week: 12, fruit: 'Lime',              emoji: '🍋', lengthCm: 5.4,  weightG: 14,   fact: 'Risk of miscarriage drops significantly this week.' },
	{ week: 13, fruit: 'Lemon',             emoji: '🍋', lengthCm: 7.4,  weightG: 23,   fact: 'Baby\'s fingerprints are forming — completely unique.' },
	{ week: 14, fruit: 'Peach',             emoji: '🍑', lengthCm: 8.7,  weightG: 43,   fact: 'Baby can make facial expressions now.' },
	{ week: 15, fruit: 'Apple',             emoji: '🍎', lengthCm: 10.1, weightG: 70,   fact: 'Baby is practicing breathing with amniotic fluid.' },
	{ week: 16, fruit: 'Avocado',           emoji: '🥑', lengthCm: 11.6, weightG: 100,  fact: 'You may feel baby\'s first flutters of movement soon!' },
	{ week: 17, fruit: 'Pear',              emoji: '🍐', lengthCm: 13.0, weightG: 140,  fact: 'Baby can now hear sounds from outside the womb.' },
	{ week: 18, fruit: 'Bell Pepper',       emoji: '🫑', lengthCm: 14.2, weightG: 190,  fact: 'Baby is yawning, hiccupping, and sucking their thumb.' },
	{ week: 19, fruit: 'Mango',             emoji: '🥭', lengthCm: 15.3, weightG: 240,  fact: 'Baby\'s senses — taste, smell, touch — are developing.' },
	{ week: 20, fruit: 'Banana',            emoji: '🍌', lengthCm: 16.4, weightG: 300,  fact: 'Halfway there! Baby now has a sleep-wake cycle.' },
	{ week: 21, fruit: 'Carrot',            emoji: '🥕', lengthCm: 26.7, weightG: 360,  fact: 'Baby can swallow and taste the amniotic fluid.' },
	{ week: 22, fruit: 'Papaya',            emoji: '🍈', lengthCm: 27.8, weightG: 430,  fact: 'Baby\'s grip is getting stronger every day.' },
	{ week: 23, fruit: 'Large Mango',       emoji: '🥭', lengthCm: 28.9, weightG: 501,  fact: 'Your baby can now hear your voice — talk to them!' },
	{ week: 24, fruit: 'Ear of Corn',       emoji: '🌽', lengthCm: 30.0, weightG: 600,  fact: 'Baby\'s face is fully formed, complete with eyebrows.' },
	{ week: 25, fruit: 'Cauliflower',       emoji: '🥦', lengthCm: 34.6, weightG: 660,  fact: 'Baby is developing a sense of direction.' },
	{ week: 26, fruit: 'Scallion',          emoji: '🌿', lengthCm: 35.6, weightG: 760,  fact: 'Baby\'s eyes are starting to open for the first time!' },
	{ week: 27, fruit: 'Rutabaga',          emoji: '🥔', lengthCm: 36.6, weightG: 875,  fact: 'Baby is practicing breathing movements.' },
	{ week: 28, fruit: 'Eggplant',          emoji: '🍆', lengthCm: 37.6, weightG: 1005, fact: 'Baby can blink and has developed eyelashes.' },
	{ week: 29, fruit: 'Butternut Squash',  emoji: '🎃', lengthCm: 38.6, weightG: 1153, fact: 'Baby\'s brain is growing rapidly.' },
	{ week: 30, fruit: 'Cabbage',           emoji: '🥬', lengthCm: 39.9, weightG: 1319, fact: 'Baby is putting on fat to regulate temperature.' },
	{ week: 31, fruit: 'Coconut',           emoji: '🥥', lengthCm: 41.1, weightG: 1502, fact: 'Baby can process information from all five senses.' },
	{ week: 32, fruit: 'Jicama',            emoji: '🥔', lengthCm: 42.4, weightG: 1702, fact: 'Baby is practicing breathing and sucking every day.' },
	{ week: 33, fruit: 'Pineapple',         emoji: '🍍', lengthCm: 43.7, weightG: 1918, fact: 'Baby\'s bones are hardening — except the skull.' },
	{ week: 34, fruit: 'Cantaloupe',        emoji: '🍈', lengthCm: 45.0, weightG: 2146, fact: 'Baby\'s central nervous system is maturing.' },
	{ week: 35, fruit: 'Honeydew Melon',    emoji: '🍈', lengthCm: 46.2, weightG: 2383, fact: 'Baby is running out of room — kicks feel stronger.' },
	{ week: 36, fruit: 'Head of Lettuce',   emoji: '🥬', lengthCm: 47.4, weightG: 2622, fact: 'Baby is early term — lungs are nearly ready!' },
	{ week: 37, fruit: 'Swiss Chard',       emoji: '🥬', lengthCm: 48.6, weightG: 2859, fact: 'Baby is full term — they could arrive any day!' },
	{ week: 38, fruit: 'Leek',              emoji: '🌿', lengthCm: 49.8, weightG: 3083, fact: 'Baby\'s grip is incredibly strong now.' },
	{ week: 39, fruit: 'Mini Watermelon',   emoji: '🍉', lengthCm: 50.7, weightG: 3288, fact: 'Baby has shed most of the vernix on their skin.' },
	{ week: 40, fruit: 'Watermelon',        emoji: '🍉', lengthCm: 51.2, weightG: 3462, fact: 'Baby is fully ready to meet the world! 🎉' },
];

export function getFruitForWeek(week: number): FruitEntry {
	const clamped = Math.max(4, Math.min(40, week));
	return fruitData.find(f => f.week === clamped) ?? fruitData[fruitData.length - 1];
}

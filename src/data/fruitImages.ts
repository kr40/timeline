import type { EmojiName } from '../emoji';
import type { FruitEntry } from './fruitData';

/** Maps each fruitData emoji to its Fluent 3D picture. */
const FRUIT_IMAGES: Record<string, EmojiName> = {
	'🌱': 'seedling',   '🌿': 'herb',        '💚': 'green-heart', '🫐': 'blueberries',  '🫘': 'beans',
	'🍇': 'grapes',     '🍊': 'tangerine',   '🍂': 'fallen-leaf', '🍋': 'lemon',        '🍑': 'peach',
	'🍎': 'red-apple',  '🥑': 'avocado',     '🍐': 'pear',        '🫑': 'bell-pepper',  '🥭': 'mango',
	'🍌': 'banana',     '🥕': 'carrot',      '🍈': 'melon',       '🌽': 'ear-of-corn',  '🥦': 'broccoli',
	'🥔': 'potato',     '🍆': 'eggplant',    '🎃': 'jack-o-lantern', '🥬': 'leafy-green', '🥥': 'coconut',
	'🍍': 'pineapple',  '🍉': 'watermelon',
};

export const fruitImage = (entry: FruitEntry): EmojiName => FRUIT_IMAGES[entry.emoji] ?? 'baby';

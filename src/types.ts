export type IconType = 'camera' | 'heart' | 'baby' | 'star' | 'smile' | 'gift' | 'moon' | 'music' | 'footprints';

export type Milestone = {
	id:          number;
	title:       string;
	date:        string;
	description: string;
	image:       string | null;  // legacy column — kept until DB column is dropped
	images:      string[];       // canonical multi-image field
	icon:        IconType;
};

export type NewEvent = Omit<Milestone, 'id'>;

/** Normalises legacy single-image rows and new multi-image rows into one array. */
export const getImages = (m: Pick<Milestone, 'image' | 'images'>): string[] => {
	if (m.images && m.images.length > 0) return m.images;
	if (m.image) return [m.image];
	return [];
};

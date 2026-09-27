import type { EmojiName } from '../emoji';
import { FUN_POLLS, type FunPollId } from './funPolls';

export type Side = 'aditi' | 'kartik';
export type Gender = 'boy' | 'girl';
export type TraitId = 'eyes' | 'nose' | 'hair' | 'smile';

export const TRAIT_IDS: TraitId[] = ['eyes', 'nose', 'hair', 'smile'];

export type SideResult = { mine: Side | null; counts: Record<Side, number> };

export type PollsState = {
	loading: boolean;
	gender: { mine: Gender | null; boys: number; girls: number };
	traits: Record<TraitId, SideResult>;
	fun: Record<FunPollId, SideResult>;
};

export type PollItem =
	| { kind: 'gender'; id: 'gender'; tag: string; question: string; emoji: EmojiName }
	| { kind: 'trait'; id: TraitId; tag: string; question: string; emoji: EmojiName }
	| { kind: 'fun'; id: FunPollId; tag: string; question: string; emoji: EmojiName; aditiLabel: string; kartikLabel: string };

const TRAITS: { id: TraitId; question: string; emoji: EmojiName }[] = [
	{ id: 'eyes',  question: 'Whose eyes will baby have?',  emoji: 'eyes' },
	{ id: 'nose',  question: 'Whose nose will baby have?',  emoji: 'nose' },
	{ id: 'hair',  question: 'Whose hair will baby have?',  emoji: 'person-curly-hair' },
	{ id: 'smile', question: 'Whose smile will baby have?', emoji: 'smiling-face-with-smiling-eyes' },
];

/** Deck order: boy/girl, then the four look-alike traits, then Aditi vs Kartik. */
export const POLL_ITEMS: PollItem[] = [
	{ kind: 'gender', id: 'gender', tag: 'Boy or girl?', question: 'What do you think baby is?', emoji: 'thinking-face' },
	...TRAITS.map(t => ({ kind: 'trait' as const, id: t.id, tag: 'Who will baby look like?', question: t.question, emoji: t.emoji })),
	...FUN_POLLS.map(p => ({
		kind: 'fun' as const,
		id: p.id,
		tag: 'Aditi vs Kartik',
		question: p.question,
		emoji: p.emoji,
		aditiLabel: p.aditiLabel,
		kartikLabel: p.kartikLabel,
	})),
];

/** Each fun poll is one point for whoever leads it; ties count for neither. */
export function scoreFun(fun: Record<FunPollId, SideResult>): { aditi: number; kartik: number; started: number } {
	let aditi = 0;
	let kartik = 0;
	let started = 0;
	for (const poll of FUN_POLLS) {
		const { counts } = fun[poll.id];
		if (counts.aditi + counts.kartik === 0) continue;
		started++;
		if (counts.aditi > counts.kartik) aditi++;
		else if (counts.kartik > counts.aditi) kartik++;
	}
	return { aditi, kartik, started };
}

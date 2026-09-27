import type { EmojiName } from '../emoji';

export type FunPollId = 'sleep' | 'diaper' | 'inherit' | 'pushover' | 'googler';
export type FunPollChoice = 'aditi' | 'kartik';

export type FunPollDef = {
	id: FunPollId;
	question: string;
	aditiLabel: string;
	kartikLabel: string;
	emoji: EmojiName;
};

export const FUN_POLLS: FunPollDef[] = [
	{ id: 'sleep',    question: 'Whose sleep schedule will baby ruin first?',      aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'sleeping-face' },
	{ id: 'diaper',   question: 'Who will cry more during diaper changes?',        aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'loudly-crying-face' },
	{ id: 'inherit',  question: 'What will baby inherit?',                         aditiLabel: "Aditi's patience", kartikLabel: "Kartik's appetite", emoji: 'dna' },
	{ id: 'pushover', question: 'Who will baby have wrapped around their finger?', aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'melting-face' },
	{ id: 'googler',  question: 'Who googles "is this normal?" at 3am more?',      aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'magnifying-glass' },
];

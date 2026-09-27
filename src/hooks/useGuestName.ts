import { useSyncExternalStore } from 'react';

const KEY = 'timeline_guest_name';
const listeners = new Set<() => void>();

function read(): string {
	try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => { listeners.delete(listener); };
}

/** Remembers the visitor's name so every form can prefill it. */
export function saveGuestName(name: string): void {
	const trimmed = name.trim();
	if (!trimmed) return;
	try { localStorage.setItem(KEY, trimmed); } catch { /* storage unavailable */ }
	listeners.forEach(listener => listener());
}

export function useGuestName(): string {
	return useSyncExternalStore(subscribe, read, () => '');
}

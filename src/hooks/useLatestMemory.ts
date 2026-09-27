import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Milestone } from '../types';

/** The most recently added memory (highest id), independent of the timeline's pagination. Read-only. */
export function useLatestMemory(): Milestone | null {
	const [latest, setLatest] = useState<Milestone | null>(null);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data } = await supabase
				.from('milestones')
				.select('*')
				.order('id', { ascending: false })
				.limit(1)
				.maybeSingle();
			if (!cancelled) setLatest(data ?? null);
		})();
		return () => { cancelled = true; };
	}, []);
	return latest;
}

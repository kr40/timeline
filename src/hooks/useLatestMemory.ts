import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Milestone } from '../types';

/** The most recently added memory (highest id), independent of the timeline's pagination. Read-only.
 *  Pass `rev` (bump it after a save/delete elsewhere) to force a refetch so this doesn't go stale. */
export function useLatestMemory(rev = 0): Milestone | null {
	const [latest, setLatest] = useState<Milestone | null>(null);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data, error } = await supabase
				.from('milestones')
				.select('*')
				.order('id', { ascending: false })
				.limit(1)
				.maybeSingle();
			// A failed fetch just hides the card; log it so it isn't mistaken for "no memories yet".
			if (error) console.error(error);
			if (!cancelled) setLatest(data ?? null);
		})();
		return () => { cancelled = true; };
	}, [rev]);
	return latest;
}

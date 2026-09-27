import { SyntheticEvent } from 'react';

/** Display-only resized URL for ImageKit images; other URLs pass through unchanged. Never store the result. */
export function ikResize(url: string, width: number): string {
	if (!url.includes('ik.imagekit.io')) return url;
	return `${url}${url.includes('?') ? '&' : '?'}tr=w-${Math.round(width)},c-at_max`;
}

/** `<img onError>` that retries once with the original URL if the resized one fails. */
export const fallbackTo = (original: string) => (e: SyntheticEvent<HTMLImageElement>) => {
	const img = e.currentTarget;
	if (img.dataset.fallback === original) return;
	img.dataset.fallback = original;
	img.src = original;
};

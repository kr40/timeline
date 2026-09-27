/** Display-only resized URL for ImageKit images; other URLs pass through unchanged. Never store the result. */
export function ikResize(url: string, width: number): string {
	if (!url.includes('ik.imagekit.io')) return url;
	return `${url}${url.includes('?') ? '&' : '?'}tr=w-${Math.round(width)},c-at_max`;
}

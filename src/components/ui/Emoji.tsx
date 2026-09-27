import { EmojiName, emojiSrc } from '../../emoji';

type Props = {
	name: EmojiName;
	size?: number;
	className?: string;
	/** Leave empty for decorative pictures (the default). */
	alt?: string;
	/** Load immediately (above-the-fold pictures). */
	eager?: boolean;
};

export const Emoji = ({ name, size = 32, className = '', alt = '', eager = false }: Props) => (
	<img
		src={emojiSrc(name)}
		width={size}
		height={size}
		alt={alt}
		aria-hidden={alt ? undefined : true}
		loading={eager ? 'eager' : 'lazy'}
		decoding='async'
		draggable={false}
		style={{ width: size, height: size }}
		className={`inline-block shrink-0 select-none object-contain drop-shadow-[0_3px_3px_rgba(43,35,64,0.14)] ${className}`}
	/>
);

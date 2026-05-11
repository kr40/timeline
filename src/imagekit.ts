export const uploadToImageKit = async (file: File): Promise<string> => {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('fileName', file.name || 'uploaded_image.jpg');

	const authRes = await fetch('/.netlify/functions/auth');
	if (!authRes.ok) {
		const errorData = await authRes.json();
		throw new Error(errorData.error || 'Failed to fetch upload signature');
	}
	const authData = await authRes.json();

	const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
	if (!publicKey) throw new Error('Missing ImageKit public key in environment configuration.');

	formData.append('publicKey', publicKey);
	formData.append('signature', authData.signature);
	formData.append('expire', authData.expire.toString());
	formData.append('token', authData.token);

	const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || 'Image upload failed');
	}

	return (await response.json()).url;
};

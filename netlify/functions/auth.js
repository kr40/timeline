const crypto = require('crypto');

exports.handler = async function (event, context) {
	// The Private key stays safely on Netlify's backend servers
	const privateApiKey = process.env.IMAGEKIT_PRIVATE_KEY;

	if (!privateApiKey) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY is not configured on the server.' }),
		};
	}

	try {
		// Generate random token
		const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

		// Valid for 40 minutes into the future
		const expire = Math.floor(Date.now() / 1000) + 2400;

		// Create HMAC SHA1 signature
		const signature = crypto
			.createHmac('sha1', privateApiKey)
			.update(token + expire.toString())
			.digest('hex');

		return {
			statusCode: 200,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token, expire, signature }),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to generate signature' }),
		};
	}
};

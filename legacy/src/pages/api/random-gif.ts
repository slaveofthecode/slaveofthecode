import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
	const gifs: Record<number, string> = {
		0: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif',
		1: 'https://media.giphy.com/media/fQZX2aoRC1Tqw/giphy.gif',
		2: 'https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif',
		3: 'https://media.giphy.com/media/f3iwJFOVOwuy7K6FFw/giphy.gif',
		4: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
		5: 'https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif',
		6: 'https://media.giphy.com/media/LMcB8XospGZO8UQq87/giphy.gif',
		7: 'https://media.giphy.com/media/iIqmM5tTjmpOB9mpbn/giphy.gif',
		8: 'https://media.giphy.com/media/MD0svLSDeudszrNrp0/giphy.gif',
		9: 'https://media.giphy.com/media/xT1XGJEEqTOVq7IW4g/giphy.gif',
		10: 'https://media.giphy.com/media/KVr0JbrdBp9KX644Bk/giphy.gif',
		11: 'https://media.giphy.com/media/qqDVCetD9mhYLyoies/giphy.gif',
		12: 'https://media.giphy.com/media/n1LogPiNbCe3ebpqjt/giphy.gif',
	};

	const urls = Object.values(gifs);
	const randomIndex = Math.floor(Math.random() * urls.length);
	const gifUrl = urls[randomIndex];

	return new Response(null, {
		status: 302,
		headers: {
			Location: gifUrl,
			'Cache-Control': 'no-store',
			'Content-Type': 'image/gif',
			'Content-Disposition': 'inline', // ⚠️ IMPORTANT to prevent download
		},
	});
};

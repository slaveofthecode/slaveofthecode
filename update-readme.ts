const fs = require('fs');

const gifs = [
	'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif',
	'https://media.giphy.com/media/fQZX2aoRC1Tqw/giphy.gif',
	'https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif',
	'https://media.giphy.com/media/f3iwJFOVOwuy7K6FFw/giphy.gif',
	'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
	'https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif',
	'https://media.giphy.com/media/LMcB8XospGZO8UQq87/giphy.gif',
	'https://media.giphy.com/media/iIqmM5tTjmpOB9mpbn/giphy.gif',
	'https://media.giphy.com/media/MD0svLSDeudszrNrp0/giphy.gif',
	'https://media.giphy.com/media/xT1XGJEEqTOVq7IW4g/giphy.gif',
	'https://media.giphy.com/media/KVr0JbrdBp9KX644Bk/giphy.gif',
	'https://media.giphy.com/media/qqDVCetD9mhYLyoies/giphy.gif',
	'https://media.giphy.com/media/n1LogPiNbCe3ebpqjt/giphy.gif',
];

const randomIndex = Math.floor(Math.random() * gifs.length);
const randomGif = gifs[randomIndex];

// Lee el archivo README.md
const readmePath = 'README.md';
fs.readFile(readmePath, 'utf8', (err: any, data: string) => {
	if (err) {
		console.error('Error reading README.md:', err);
		return;
	}

	const updatedData = data.replace(
		/!\[Random GIF\]\(.*?\)/,
		`![Random GIF](${randomGif})`
	);

	fs.writeFile(readmePath, updatedData, 'utf8', (err: any) => {
		if (err) {
			console.error('Error writing to README.md:', err);
			return;
		}
		console.log('README.md updated with random GIF.');
	});
});

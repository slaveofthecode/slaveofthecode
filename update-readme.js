const fs = require('fs');

const gifs = {
	0: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif', // Sunday
	1: 'https://media.giphy.com/media/fQZX2aoRC1Tqw/giphy.gif', // Monday
	2: 'https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif', // Tuesday
	3: 'https://media.giphy.com/media/f3iwJFOVOwuy7K6FFw/giphy.gif', // Wednesday
	4: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', // Thursday
	5: 'https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif', // Friday
	6: 'https://media.giphy.com/media/LMcB8XospGZO8UQq87/giphy.gif', // Saturday
	7: 'https://media.giphy.com/media/iIqmM5tTjmpOB9mpbn/giphy.gif',
	8: 'https://media.giphy.com/media/MD0svLSDeudszrNrp0/giphy.gif',
	9: 'https://media.giphy.com/media/xT1XGJEEqTOVq7IW4g/giphy.gif',
	10: 'https://media.giphy.com/media/KVr0JbrdBp9KX644Bk/giphy.gif',
	11: 'https://media.giphy.com/media/qqDVCetD9mhYLyoies/giphy.gif',
	12: 'https://media.giphy.com/media/n1LogPiNbCe3ebpqjt/giphy.gif',
};

const maxLengthGifs = Object.keys(gifs).length;
const index = Math.floor(Math.random() * maxLengthGifs);

const selectedGif = gifs[index];
const readmePath = 'README.md';
let readme = fs.readFileSync(readmePath, 'utf8');

// Replace the GIF block
const newBlock = `<div align="center">\n  <img src="${selectedGif}" width="450"/>\n</div>`;
readme = readme.replace(
	/<div align="center">[\s\S]*?<img src=".*?" width="450"\/>[\s\S]*?<\/div>/,
	newBlock
);

fs.writeFileSync(readmePath, readme, 'utf8');
console.log(`✅ README updated with today's GIF.`);

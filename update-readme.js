const fs = require('fs');

const gifs = {
	0: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif', // Sunday
	1: 'https://media.giphy.com/media/fQZX2aoRC1Tqw/giphy.gif?cid=ecf05e47jcmjqtaqpfecedcolfn2j0euo278nd29khk583fs&ep=v1_gifs_search&rid=giphy.gif&ct=g', // Monday
	2: 'https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif', // Tuesday
	3: 'https://media.giphy.com/media/f3iwJFOVOwuy7K6FFw/giphy.gif', // Wednesday
	4: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', // Thursday
	5: 'https://media.giphy.com/media/26xBwdIuRJiAIqHwA/giphy.gif', // Friday
	6: 'https://media.giphy.com/media/LMcB8XospGZO8UQq87/giphy.gif', // Saturday
};

const today = new Date().getDay();
const selectedGif = gifs[today];

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

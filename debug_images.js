const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'Assets', 'Mons');
console.log('Searching in:', dir);

async function loadIdleGifs() {
  const result = [];
  async function walk(folder) {
    try {
      const entries = await fs.promises.readdir(folder, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile()) {
          const name = entry.name.toLowerCase();
          if (name === 'idle.gif' || name === 'idle.png') {
            result.push(full.replace(/\\/g, '/'));
          }
        }
      }
    } catch (err) {
      console.error('Error reading folder:', folder, err.message);
    }
  }
  await walk(dir);
  return result;
}

loadIdleGifs().then((list) => {
  console.log('Found idle gifs:', list.length);
  list.forEach((p) => console.log(p));

  if (list.length > 0) {
    const choice = list[0];
    const relative = path.relative(__dirname, choice).replace(/\\/g, '/');
    console.log('Relative path example:', relative);
  }
});

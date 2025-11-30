const path = require('path');
const fs = require('fs');
const { createLogger } = require('./logger');
const logger = createLogger('IdleAssets');

let idleGifsCache = null;

// Base do projeto (subindo de scripts/utils para a raiz)
const DEFAULT_BASE_DIR = path.join(__dirname, '..', '..');

async function loadIdleGifs(baseDir = DEFAULT_BASE_DIR) {
  if (idleGifsCache) return idleGifsCache;
  const dir = path.join(baseDir, 'Assets', 'Mons');
  const result = [];
  async function walk(folder) {
    let entries = [];
    try {
      entries = await fs.promises.readdir(folder, { withFileTypes: true });
    } catch (err) {
      logger.error('Erro ao ler diretório idle', err);
      return;
    }
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
  }
  await walk(dir);
  idleGifsCache = result;
  return idleGifsCache;
}

function resolveIdleGif(relativePath, baseDir = DEFAULT_BASE_DIR) {
  if (!relativePath) return null;
  const cleaned = relativePath.replace(/^[Aa]ssets[\\/][Mm]ons[\\/]/, '').replace(/\\/g, '/');
  const monsBase = path.join(baseDir, 'Assets', 'Mons');
  const directGif = cleaned.replace(/front\.(gif|png)$/i, 'idle.gif');
  if (fs.existsSync(path.join(monsBase, directGif))) return directGif;
  const altGif = path.posix.join(path.posix.dirname(cleaned), 'idle.gif');
  if (fs.existsSync(path.join(monsBase, altGif))) return altGif;
  const directPng = cleaned.replace(/front\.(gif|png)$/i, 'idle.png');
  if (fs.existsSync(path.join(monsBase, directPng))) return directPng;
  const altPng = path.posix.join(path.posix.dirname(cleaned), 'idle.png');
  if (fs.existsSync(path.join(monsBase, altPng))) return altPng;
  return cleaned;
}

async function getRandomEnemyIdle(exclude, baseDir = DEFAULT_BASE_DIR) {
  const list = await loadIdleGifs(baseDir);
  let filtered = list;
  if (exclude) {
    const normalized = exclude.replace(/\\/g, '/');
    filtered = list.filter((p) => !p.endsWith(normalized));
  }
  if (filtered.length === 0) filtered = list;
  if (filtered.length === 0) return null;
  const choice = filtered[Math.floor(Math.random() * filtered.length)];
  return path.relative(baseDir, choice).replace(/\\/g, '/');
}

function extractElementFromPath(p) {
  if (!p) return null;
  const parts = p.replace(/\\/g, '/').split('/');
  const monsIdx = parts.indexOf('Mons');
  if (monsIdx >= 0 && parts.length > monsIdx + 2) {
    return parts[monsIdx + 2].toLowerCase();
  }
  return null;
}

module.exports = { loadIdleGifs, resolveIdleGif, getRandomEnemyIdle, extractElementFromPath };

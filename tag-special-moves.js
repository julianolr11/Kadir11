const fs = require('fs');
const path = require('path');

const movesPath = path.join(__dirname, 'data', 'moves.json');
const moves = JSON.parse(fs.readFileSync(movesPath, 'utf8'));

function isSpecialByName(name) {
  const kw = [
    'Chama', 'Orbe', 'Ritual', 'Círculo', 'Espiral', 'Runas', 'Pulso', 'Luz', 'Raio',
    'Bruma', 'Brilho', 'Torrente', 'Maré', 'Aura', 'Avalanche', 'Lança', 'Prisão',
    'Símbolo', 'Onda', 'Toxina', 'Fôlego', 'Eclipse', 'Hidro', 'Explosão', 'Rajada'
  ];
  const lower = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  return kw.some(k => lower.includes(k.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()));
}

function decideType(move) {
  // Default physical
  let type = 'physical';
  const elements = Array.isArray(move.elements) ? move.elements : [move.elements].filter(Boolean);
  const set = new Set(elements);

  // Heurísticas por elemento
  if (set.size === 1) {
    const e = [...set][0];
    if (['puro', 'agua', 'ar'].includes(e)) type = 'special';
    if (e === 'terra') type = 'physical';
    if (e === 'fogo') type = 'physical';
  }

  // Palavras-chave do nome sobrepõem
  if (move.name && isSpecialByName(move.name)) type = 'special';

  // Ajustes finos por alguns nomes claramente físicos
  const forcePhysical = [
    'Arranhão', 'Mordida', 'Empurrar', 'Corte', 'Garra', 'Cauda', 'Pedrada', 'Escamas',
    'Esmagamento', 'Rasante', 'Asas', 'Terremoto', 'Lâmina', 'Investida', 'Presa', 'Presas'
  ];
  const nm = (move.name || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (forcePhysical.some(k => nm.includes(k.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()))) {
    type = 'physical';
  }

  // Golpes sem dano mantêm type se houver, mas não é crítico
  if (move.effect === 'cura') return move.type || type;

  return type;
}

let updated = 0;
for (const m of moves) {
  const prev = m.type;
  const t = decideType(m);
  if (prev !== t) {
    m.type = t;
    updated++;
  } else if (!prev) {
    m.type = t;
    updated++;
  }
}

fs.writeFileSync(movesPath, JSON.stringify(moves, null, 2), 'utf8');
console.log(`✅ Tipagem aplicada. Golpes atualizados: ${updated}`);

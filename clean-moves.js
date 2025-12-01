const fs = require('fs');
const path = require('path');

const movesPath = path.join(__dirname, 'data', 'moves.json');
const data = JSON.parse(fs.readFileSync(movesPath, 'utf8'));

console.log(`📊 Total de golpes no arquivo: ${data.length}`);

// Identifica duplicatas
const nameCount = new Map();
const duplicates = [];

data.forEach((move, index) => {
  if (nameCount.has(move.name)) {
    duplicates.push({ name: move.name, index, first: nameCount.get(move.name) });
  } else {
    nameCount.set(move.name, index);
  }
});

if (duplicates.length > 0) {
  console.log(`\n❌ Encontradas ${duplicates.length} duplicatas:`);
  duplicates.forEach(dup => {
    console.log(`   - "${dup.name}" (índices ${dup.first} e ${dup.index})`);
  });
}

// Remove duplicatas mantendo primeira ocorrência
const uniqueMoves = Array.from(new Map(data.map(m => [m.name, m])).values());

console.log(`\n✅ Após remoção: ${uniqueMoves.length} golpes únicos`);
console.log(`🗑️  Removidos: ${data.length - uniqueMoves.length} duplicados`);

// Salva arquivo limpo
fs.writeFileSync(movesPath, JSON.stringify(uniqueMoves, null, 2), 'utf8');
console.log('✅ Arquivo data/moves.json limpo e salvo!\n');

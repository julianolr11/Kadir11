const fs = require('fs');
const path = require('path');

// Lê o arquivo de golpes
const movesPath = path.join(__dirname, 'data', 'moves.json');
const moves = JSON.parse(fs.readFileSync(movesPath, 'utf8'));

// Tabela de poder base por nível e raridade (estilo Pokémon)
const powerTable = {
  1: { Comum: 40, Incomum: 50, Raro: 60, MuitoRaro: 70, Epico: 80, Lendario: 90 },
  2: { Comum: 55, Incomum: 65, Raro: 75, MuitoRaro: 85, Epico: 95, Lendario: 105 },
  3: { Comum: 70, Incomum: 80, Raro: 90, MuitoRaro: 100, Epico: 110, Lendario: 120 },
  4: { Comum: 85, Incomum: 95, Raro: 105, MuitoRaro: 115, Epico: 125, Lendario: 135 },
  5: { Comum: 100, Incomum: 110, Raro: 120, MuitoRaro: 130, Epico: 140, Lendario: 150 },
  6: { Comum: 115, Incomum: 125, Raro: 135, MuitoRaro: 145, Epico: 155, Lendario: 165 },
  7: { Comum: 130, Incomum: 140, Raro: 150, MuitoRaro: 160, Epico: 170, Lendario: 180 }
};

// Golpes especiais (cura, status puro sem dano)
const specialMoves = ['Bênção Curativa', 'Toque Restaurador'];

// Aplica rebalanceamento
let updated = 0;
moves.forEach(move => {
  // Se é golpe de cura, mantém poder 0
  if (specialMoves.includes(move.name)) {
    move.power = 0;
    return;
  }

  // Pega poder base da tabela
  const level = move.level || 1;
  const rarity = move.rarity || 'Comum';
  
  if (powerTable[level] && powerTable[level][rarity]) {
    const newPower = powerTable[level][rarity];
    
    // Ajustes especiais
    if (move.effect && move.effect !== 'nenhum') {
      // Golpes com efeito de status ficam 10% mais fracos
      move.power = Math.round(newPower * 0.9);
    } else {
      move.power = newPower;
    }
    
    updated++;
  } else {
    console.warn(`⚠️ Golpe "${move.name}" tem nível ${level} ou raridade "${rarity}" inválida`);
  }
});

// Salva arquivo atualizado
fs.writeFileSync(movesPath, JSON.stringify(moves, null, 2), 'utf8');

console.log(`✅ Rebalanceamento concluído!`);
console.log(`📊 ${updated} golpes atualizados com poder estilo Pokémon`);
console.log(`🎯 Exemplo: Arranhão (nv1 comum) = 40 | Explosão Ígnea (nv4 raro) = 105`);

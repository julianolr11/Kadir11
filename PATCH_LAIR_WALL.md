# Patch: Remover camada extra de parede no lair-mode

## Problema
No lado direito e inferior do mapa aparece uma camada dupla de paredes.

## Solução
Remover o código da função `trimExtraWalls()` em `scripts/lair-mode.js` (linhas 147-156).

## Modificação necessária:

### `scripts/lair-mode.js` - Linhas 147-156

**Substituir:**
```javascript
function trimExtraWalls() {
  for (let x = 0; x < MAP_W; x++) {
    if (map[MAP_H - 2][x] === 'FLOOR') map[MAP_H - 2][x] = 'WALL';
  }
  for (let y = 0; y < MAP_H; y++) {
    if (map[y][MAP_W - 2] === 'FLOOR') map[y][MAP_W - 2] = 'WALL';
  }
}
```

**Por:**
```javascript
function trimExtraWalls() {
  // Função vazia: removida lógica que criava parede dupla
  // nas bordas inferior e direita
}
```

Isso resolve o problema da camada extra de paredes no canto inferior direito do mapa.

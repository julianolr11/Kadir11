# Guia de Integração - Refatoração Fases 1 & 2

Este guia foi atualizado para refletir a conclusão das Fases 1 e 2 da refatoração. Todos os handlers IPC foram modularizados; a lógica de progressão, aprendizado de golpes, timers e assets foi extraída. O `main.js` agora atua apenas como orquestrador (1042 linhas → antes 2100+).

## 📦 Módulos Criados (Fase 1)

### 1. **Logger System** (`scripts/utils/logger.js`)
Sistema de logging com níveis para substituir console.log.

**Uso:**
```javascript
const { createLogger } = require('./scripts/utils/logger');
const logger = createLogger('ModuleName');

logger.debug('Mensagem de debug (apenas em dev)');
logger.info('Mensagem informativa');
logger.warn('Aviso');
logger.error('Erro crítico');

// Medir performance
const endTimer = logger.time('operacao');
// ... código ...
endTimer(); // Loga o tempo decorrido
```

### 2. **State Manager** (`scripts/managers/stateManager.js`)
Gerenciador centralizado de estado global (currentPet, janelas).

**Uso:**
```javascript
const state = require('./scripts/managers/stateManager');

// Pet
state.currentPet = petObject;  // Setter com validação
const pet = state.currentPet;  // Getter
if (state.hasPet()) { ... }

// Janelas
state.registerWindow('tray', trayWindow);
const win = state.getWindow('tray');
state.closeWindow('tray');
state.closeAllWindows();

// Broadcast
state.broadcast('pet-data', petData); // Envia para todas as janelas
```

### 3. **Pet Handlers** (`scripts/handlers/petHandlers.js`)
Handlers IPC para operações de pets.

**Migrado do main.js:**
- `create-pet`
- `list-pets`
- `select-pet`
- `delete-pet`
- `rename-pet`
- `animation-finished`

### 4. **Window Handlers** (`scripts/handlers/windowHandlers.js`)
Handlers IPC para gerenciamento de janelas.

**Migrado do main.js:**
- `exit-app`
- `open-*-window` (create-pet, load-pet, pen, hatch, start, tray, status, gift)
- `close-*-window`

### 5. **Game Handlers** (`scripts/handlers/gameHandlers.js`)
Handlers IPC para fluxo de jogo (batalha, jornada, lair, treino, cena de jornada, recompensas, atributos).

**Ativo (Fase 2):**
- `battle-pet`
- `open-battle-mode-window`
- `journey-complete`
- `open-journey-mode-window`
- `open-journey-scene-window`
- `reward-pet`
- `train-pet` (energia / validações)
- `increase-attribute`
- `open-train-*` windows
- `open-lair-mode-window`
- `battle-result`

### 6. **Store Handlers** (`scripts/handlers/storeHandlers.js`)
Loja, inventário, presentes, som/mute, desequipar item.

**Ativo:**
- `buy-item`
- `use-item`
- `unequip-item`
- `redeem-gift-code`
- `get-gift-history`
- `get-mute-state` / `set-mute-state`
- Integra com coins e items via funções injetadas.

---

## 📦 Módulos Criados (Fase 2)

### 7. **Moves Handlers** (`scripts/handlers/movesHandlers.js`)
Wrapper IPC para aprendizado de golpes chamando lógica pura (`logic/moveLearning.js`).

### 8. **Logic Modules**
- `logic/moveLearning.js`: custo, reaprendizado (meio custo), slots (máx 4).
- `logic/progression.js`: XP, múltiplos level-ups, recompensas de jornada/batalha.

### 9. **Settings Handlers** (`scripts/handlers/settingsHandlers.js`)
Pen size, nests (quantidade / preço), dificuldade (get/set).

### 10. **Assets Handlers** (`scripts/handlers/assetsHandlers.js`)
Carregamento de species info + imagens de jornada com cache em memória.

### 11. **Lifecycle Handlers** (`scripts/handlers/lifecycleHandlers.js`)
Timers de decaimento (fome, felicidade, energia/vida), battle handler setup, exposição de `resetTimers` global.

### 12. **Window Positioning Handlers** (`scripts/handlers/windowPositioningHandlers.js`)
Alinhamento lado-a-lado (itens ↔ loja), resize de journey/pen/lair.

### 13. **Nest Handlers** (`scripts/handlers/nestHandlers.js`)
Colocar ovo em ninho, chocar ovo com rollback em caso de erro.

### 14. **Battle Mechanics Handlers** (`scripts/handlers/battleMechanicsHandlers.js`)
Consumo de energia em movimentos, bravura, atualização de vida.

### 15. **Extensão de Pet Handlers (Fase 2)**
Adicionado cheat `kadirfull` (restaura pet) e integração com timers.

---

## 🔧 Como Integrar no main.js (Estado Final)

### **Importações Essenciais (topo do main.js)**

```javascript
// === IMPORTS REFATORADOS ===
const { createLogger } = require('./scripts/utils/logger');
const state = require('./scripts/managers/stateManager');
const { registerPetHandlers } = require('./scripts/handlers/petHandlers');
const { registerWindowHandlers } = require('./scripts/handlers/windowHandlers');
const { registerGameHandlers } = require('./scripts/handlers/gameHandlers');
const { registerStoreHandlers } = require('./scripts/handlers/storeHandlers');

const logger = createLogger('main');
```

### **Estado Global (StateManager vs main.js)**

**ANTES:**
```javascript
let currentPet = null;
let lastUpdate = Date.now();
let battleModeWindow = null;
let journeyModeWindow = null;
// ... 15+ variáveis de janelas ...
```

**DEPOIS:**
```javascript
// Usar state.currentPet em vez de currentPet
// Janelas gerenciadas pelo StateManager ou windowManager
```

### **Logging Unificado**

**ANTES:**
```javascript
console.log('Recebido select-pet');
console.error('Erro ao criar pet:', err);
```

**DEPOIS:**
```javascript
logger.debug('Recebido select-pet');
logger.error('Erro ao criar pet:', err);
```

### **Registro de Handlers (após app.whenReady)**

```javascript
```javascript
app.whenReady().then(() => {
  // Registro em ordem de dependências
  registerWindowHandlers(...);
  registerPetHandlers(...);
  registerStoreHandlers(...);
  registerGameHandlers({ /* inclui cena/jornada/recompensas */ });
  registerMovesHandlers({ ... });
  registerSettingsHandlers({ ... });
  registerAssetsHandlers({ ... });
  const { resetTimers } = registerLifecycleHandlers({ ... });
  setupWindowPositioningHandlers({ ... });
  setupNestHandlers({ ... });
  setupBattleMechanicsHandlers({ ... });
  global.resetTimers = resetTimers; // usado em seleção de pet
});
```
```

---

## 📝 Estado de Migração

Todos os handlers foram migrados. Restos inline no `main.js` agora são apenas:
- `get-current-pet` (acesso simples)
- Comentários de referência "(movido para ... )" para rastreabilidade

Não há lógica de domínio restante em `main.js`.

---

## ✅ Checklist Final

- [x] Modularização completa (15 módulos + 2 lógica)
- [x] Timers isolados (`lifecycleHandlers`)
- [x] Aprendizado de golpes testado (`learnMove.test.js`)
- [x] Progressão/XP testada (`progression.test.js`)
- [x] Janelas reposicionáveis (items/store, resize pen/journey/lair)
- [x] Sistema de ninhos (place/hatch) modular
- [x] Consumo de energia/bravura centralizado
- [x] Cheat `kadirfull` isolado
- [x] Zero handlers complexos no `main.js`
- [x] 11 testes passando

---

## 🎯 Resultado Consolidado

| Métrica | Antes | Depois |
|--------|-------|--------|
| Tamanho `main.js` | >2100 linhas | 1042 linhas (apenas orquestração) |
| Handlers inline | Todos | Apenas trivial (`get-current-pet`) |
| Módulos handlers | 0 | 15 |
| Lógica de progressão | Inline misto | `logic/progression.js` testado |
| Aprendizado de golpes | Inline / inexistente | `logic/moveLearning.js` testado |
| Testes | 2 básicos | 11 (species, moves, progression) |
| Reposicionamento janelas | Manual ad-hoc | `windowPositioningHandlers` |
| Gestão de ninhos | Inline | `nestHandlers` |
| Timers de decay | Inline | `lifecycleHandlers` |
| Consumo de energia/bravura | Espalhado | `battleMechanicsHandlers` |


---

## 🚀 Próximos Passos (Fase 3 Planejada)

1. JSDoc abrangente para todos os módulos
2. Testes adicionais (nestHandlers, battleMechanics corner cases)
3. Diagrama de arquitetura (IPC flow) em `docs/` (plantuml ou mermaid)
4. Estrutura de configuração (feature flags para cheats / debug)
5. Possível migração gradual para TypeScript (camadas de lógica)

---

## ⚠️ Observações

1. Comentários "(movido para ...)" podem ser removidos quando desejado.
2. `get-current-pet` pode migrar para petHandlers se quiser 100% puro.
3. Cheats (kadirfull) devem ser protegidos em produção (flag/env futuro).
4. Garantir que novos handlers sempre atualizem `currentPet.items` antes de broadcast.
5. Evitar adicionar lógica nos handlers: delegar a módulos em `logic/`.

---

**Autor:** GitHub Copilot  
**Atualização:** 29/11/2025 (Fase 2 concluída)  
**Branch:** main

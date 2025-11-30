# API Documentation - Handlers & Helpers

## 📦 Battle Mechanics Handlers

### `setupBattleMechanicsHandlers(options)`

Registra handlers IPC para mecânicas de batalha.

**Parâmetros:**
```typescript
interface BattleMechanicsOptions {
  getCurrentPet: () => Pet;
  petManager: PetManager;
  ipcMain?: IpcMain;
  BrowserWindow?: typeof BrowserWindow;
}
```

**IPC Handlers Registrados:**
- `use-move` - Aplica custo de energia de um golpe
- `update-health` - Atualiza vida do pet (com clamp)
- `update-bravura` - Consome bravura

**Helpers:**

#### `broadcastPetData(pet)`
Envia dados atualizados do pet para todas as janelas abertas.

```javascript
// Uso interno
broadcastPetData(currentPet);
// Equivalente a:
BrowserWindow.getAllWindows().forEach(w => {
  if (w.webContents) w.webContents.send('pet-data', pet);
});
```

**Exemplo:**
```javascript
setupBattleMechanicsHandlers({
  getCurrentPet: () => myPet,
  petManager: petManagerInstance
});
```

---

## 🥚 Nest Handlers

### `setupNestHandlers(options)`

Gerencia sistema de ninhos e eclosão de ovos.

**Parâmetros:**
```typescript
interface NestHandlersOptions {
  getCurrentPet: () => Pet;
  getItems: () => Items;
  setItems: (items: Items) => void;
  getNestCount: () => number;
  getNestsData: () => Nest[];
  setNestsData: (nests: Nest[]) => void;
  generateRarity: () => string;
  generatePetFromEgg: (eggId: string, rarity: string) => PetData;
  petManager: PetManager;
  broadcastPenUpdate: () => void;
  getHatchWindow: () => BrowserWindow | null;
  ipcMain?: IpcMain;
  BrowserWindow?: typeof BrowserWindow;
}
```

**IPC Handlers Registrados:**
- `place-egg-in-nest` - Coloca ovo em ninho disponível
- `hatch-egg` - Eclode ovo e cria novo pet

**Helpers:**

#### `broadcastToWindows(callback)`
Executa callback para todas as janelas com webContents válidos.

```javascript
// Uso interno
broadcastToWindows(wc => {
  wc.send('nests-data-updated', nests);
  wc.send('pet-data', pet);
});
```

**Validações:**
- Pet selecionado deve existir
- Ovo deve estar no inventário
- Capacidade de ninhos não pode ser excedida
- Rollback automático em caso de erro

---

## 🪟 Window Positioning Handlers

### `setupWindowPositioningHandlers(options)`

Gerencia abertura e posicionamento de janelas.

**Parâmetros:**
```typescript
interface WindowPositioningOptions {
  createItemsWindow: () => BrowserWindow;
  createStoreWindow: () => BrowserWindow;
  getStoreWindow: () => BrowserWindow | null;
  getItemsWindow: () => BrowserWindow | null;
  getCurrentPet: () => Pet;
  getCoins: () => number;
  getItems: () => Items;
  ipcMain?: IpcMain;
  BrowserWindow?: typeof BrowserWindow;
  screen?: Screen;
}
```

**IPC Handlers Registrados:**
- `itens-pet` - Abre janela de itens (com alinhamento opcional)
- `store-pet` - Abre janela de loja (com alinhamento opcional)
- `resize-journey-window` - Redimensiona janela de jornada
- `resize-lair-window` - Redimensiona janela de covil
- `resize-pen-window` - Redimensiona janela de cerca

**Helpers:**

#### `setupWindow(createFn, failMsg, sendDataFn, alignOptions)`
Helper unificado para criação e setup de janelas.

**Parâmetros:**
```typescript
function setupWindow(
  createFn: () => BrowserWindow,
  failMsg: string,
  sendDataFn: () => void,
  alignOptions?: {
    enabled: boolean;
    otherWindow: BrowserWindow;
    win1: BrowserWindow;
    win2: BrowserWindow;
    side: 'left' | 'right';
    logMsg: string;
    errMsg: string;
  }
): BrowserWindow | null
```

**Recursos:**
- Validação automática de criação
- Setup de listener `did-finish-load`
- Alinhamento side-by-side (opcional)
- Error handling integrado

---

## 🏪 Store Handlers

### `registerStoreHandlers(deps)`

Sistema de loja, itens e gift codes.

**IPC Handlers:**
- `get-coins` - Retorna moedas atuais
- `get-items` - Retorna inventário
- `buy-item` - Compra item/upgrade
- `use-item` - Usa item consumível ou equipamento
- `unequip-item` - Remove item equipado
- `redeem-gift-code` - Resgata código de presente
- `get-gift-history` - Histórico de presentes
- `get-mute-state` / `set-mute-state` - Estado de áudio

**Itens Especiais:**
- `terrainMedium` / `terrainLarge` - Upgrades de terreno
- `nest` - Adiciona slot de ninho
- `finger`, `turtleShell`, `feather`, `orbe` - Equipamentos

**Gift Codes:**
```javascript
const giftCodes = {
  KADIR5: { type: 'kadirPoints', amount: 5 },
  WELCOME: { type: 'coins', amount: 100 },
  STARTER: { type: 'item', item: 'healthPotion', qty: 5 },
  NEWPET: { type: 'pet', egg: 'eggFera' },
  STARTERPACK: { type: 'multi', items: [...] }
};
```

---

## 📈 Progression Logic

### `applyBattleProgress(pet, options, xpUtils)`

Aplica ganho de XP e level ups.

**Parâmetros:**
```typescript
function applyBattleProgress(
  pet: Pet,
  options: { baseXp?: number },
  xpUtils: {
    calculateXpGain: (baseXp: number, rarity: string) => number;
    getRequiredXpForNextLevel: (level: number) => number;
    increaseAttributesOnLevelUp: (pet: Pet) => void;
  }
): {
  pet: Pet;
  xpGain: number;
  levelsGained: number;
  kadirGained: number;
} | { error: string }
```

**Comportamento:**
- Calcula XP baseado em raridade
- Loop de level up (máx level 100)
- +5 Kadir Points por level
- Aumenta atributos automaticamente

### `applyJourneyRewards(pet, rewards, storeFns)`

Aplica recompensas de jornada.

**Parâmetros:**
```typescript
function applyJourneyRewards(
  pet: Pet,
  rewards: {
    eggId?: string;
    coins?: number;
    kadirPoints?: number;
  },
  storeFns: {
    getItems: () => Items;
    setItems: (items: Items) => void;
    getCoins: () => number;
    setCoins: (coins: number) => void;
  }
): {
  pet: Pet;
  eggId?: string;
  coinsAwarded: number;
  kadirPointsAwarded: number;
} | { error: string }
```

---

## 🎓 Move Learning

### `learnMove(pet, move, moveCost, existingMoves)`

Sistema de aprendizado de golpes.

**Parâmetros:**
```typescript
function learnMove(
  pet: Pet,
  move: Move,
  moveCost: number,
  existingMoves?: Move[]
): {
  success: boolean;
  pet: Pet;
  replaced?: string;
} | { error: string }
```

**Lógica:**
- Custo completo para golpe novo
- Custo pela metade (ceil) para re-aprender
- Limite de 4 golpes conhecidos
- Substitui primeiro golpe se lista cheia

---

## 🛠️ Logger Utility

### `createLogger(namespace)`

Cria instância de logger com namespace.

**Métodos:**
```typescript
interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  group(label: string): void;
  groupEnd(): void;
  time(label: string): () => void;
}
```

**Controle Global:**
```javascript
const logger = require('./utils/logger');

logger.enable();   // Ativa logs
logger.disable();  // Desativa logs
```

**Formato:**
```
[HH:MM:SS,mmm] [LEVEL] [Namespace] Message
```

---

## 🔧 Padrões de Uso

### Dependency Injection
Todos os handlers usam DI para testabilidade:

```javascript
// Produção
setupHandler({
  getCurrentPet: () => currentPet,
  petManager: petManagerInstance
});

// Testes
setupHandler({
  getCurrentPet: () => mockPet,
  petManager: mockPetManager
});
```

### Error Handling
Padrão consistente de rollback:

```javascript
const previous = pet.stat;
pet.stat = newValue;
try {
  await petManager.updatePet(pet.petId, { stat: newValue });
  broadcastPetData(pet);
} catch (err) {
  logger.error('Operation failed', err);
  pet.stat = previous; // rollback
}
```

### Broadcasting
Sempre valide `webContents`:

```javascript
BrowserWindow.getAllWindows().forEach(w => {
  if (w.webContents) {
    w.webContents.send('event', data);
  }
});
```

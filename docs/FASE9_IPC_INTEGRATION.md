# FASE 9 - Integração IPC (Instruções)

## Objetivo
Conectar o SPA com o petManager real via IPC, permitindo:
- ✅ Carregar pets salvos
- ✅ Atualizar dados em tempo real
- ✅ Sincronizar moedas e inventário
- ✅ Criar novos pets

---

## Instalação

### 1. Adicionar no main.js (início do arquivo)

```javascript
// Após a linha: const store = new Store();
const { setupSPAIpcHandlers } = require('./scripts/handlers/spa-ipc-handler');

// Logo após criar a mainWindow, adicione:
setupSPAIpcHandlers(ipcMain, petManager, store);
```

**Exemplo de localização:**
```javascript
// main.js - linhas ~50-80
const Store = require('electron-store');
const store = new Store();

// ADICIONAR AQUI:
const { setupSPAIpcHandlers } = require('./scripts/handlers/spa-ipc-handler');

// ... resto do código ...

// Após criar mainWindow:
setupSPAIpcHandlers(ipcMain, petManager, store);
```

### 2. Verificar preload.js

Garantir que os canais IPC estão expostos:

```javascript
const validSendChannels = [
  'create-pet',
  'select-pet',
  'buy-item',
  // ... outros channels
];

const validInvokeChannels = [
  'get-current-pet',
  'get-all-pets',
  'get-store-data',
  'update-pet',
  'update-coins',
  'create-pet',
  'select-pet',
  // ... adicione os novos
];

const validReceiveChannels = [
  'pet-data',
  'coins-updated',
  'inventory-updated',
  'pets-list-updated',
  // ... adicione os novos
];
```

---

## Como Funciona

### Carregamento Inicial (quando initSPA() é chamado)

```
User: initSPA()
  ↓
SPA inicializa Bridge
  ↓
Bridge chama: get-current-pet (IPC)
  ↓
Main Process responde com dados do petManager
  ↓
GameState sincroniza com dados reais
  ↓
SPA renderiza com pets reais ✅
```

### Atualização em Tempo Real

```
User: Treina pet no SPA
  ↓
SPA chama: spaBridge.updatePet(newData)
  ↓
Bridge envia: update-pet (IPC)
  ↓
Main Process atualiza petManager
  ↓
Main envia: pet-data (broadcast)
  ↓
SPA recebe e atualiza UI ✅
```

---

## Teste de Integração

### 1. Iniciar o app
```bash
npm start
```

### 2. No DevTools console (F12)
```javascript
// Ver status do bridge
spaBridge.getStatus()

// Resultado esperado:
{
  ready: true,
  hasElectronAPI: true,
  gameState: {
    currentPet: 'NomeDoPet',
    coins: 1000,
    pets: 3
  }
}
```

### 3. Testar carregar pet
```javascript
// Deve carregar pet real
gameState.get('currentPet')

// Deve ter dados como force, defense, etc
gameState.get('currentPet').force
```

### 4. Testar atualizar moedas
```javascript
// Adicionar moedas
spaBridge.updateCoins(gameState.get('coins') + 100)

// Verificar em ambas as versões (SPA e tray)
// Deve estar sincronizado
```

---

## Estrutura IPC

### Invoke Channels (SPA → Main)

| Canal | Parâmetro | Retorno | Descrição |
|-------|-----------|---------|-----------|
| `get-current-pet` | - | `{pet}` | Carrega pet atual |
| `get-all-pets` | - | `[pets]` | Lista todos os pets |
| `get-store-data` | - | `{coins, isMiniMode}` | Dados da store |
| `update-pet` | `{pet}` | `{pet}` | Atualiza pet |
| `update-coins` | `coins` | `coins` | Atualiza moedas |
| `create-pet` | `{data}` | `{pet}` | Cria novo pet |
| `select-pet` | `petId` | `{pet}` | Seleciona pet |

### Receive Channels (Main → SPA)

| Canal | Dados | Descrição |
|-------|-------|-----------|
| `pet-data` | `{pet}` | Pet atualizado |
| `coins-updated` | `coins` | Moedas atualizadas |
| `inventory-updated` | `[items]` | Inventário atualizado |
| `pets-list-updated` | `[pets]` | Lista de pets atualizada |

---

## Checklist de Implementação

- [ ] Adicionar import de `setupSPAIpcHandlers` em main.js
- [ ] Chamar `setupSPAIpcHandlers(ipcMain, petManager, store)` após criar mainWindow
- [ ] Atualizar preload.js com novos canais
- [ ] Testar `spaBridge.getStatus()` no console
- [ ] Testar carregamento de pet real
- [ ] Testar atualização de moedas
- [ ] Testar criar novo pet
- [ ] Testar sincronização entre SPA e versão normal
- [ ] Commit: "feat(spa): FASE 9 - Integração IPC completa"

---

## Troubleshooting

**`spaBridge is not defined`**
- Verificar se spa-bridge.js foi carregado (verificar network tab)
- Garantir que foi incluído em index.html antes de spa-init.js

**`Cannot read property 'invoke' of undefined`**
- Verificar se preload.js está exposindo electronAPI
- Testar: `console.log(window.electronAPI)`

**Dados não carregam**
- Verificar se handlers estão registrados em main.js
- Verificar console do main process por erros
- Testar: `await window.electronAPI.invoke('get-current-pet')`

**Bridge pronto mas sem dados**
- Criar um pet na versão normal primeiro
- Dados estão em localStorage por fallback
- Sincronizar com: `spaBridge.syncToLocalStorage()`

---

**Status**: FASE 9 Pronta para Integração  
**Próxima**: FASE 10 - Mini-Mode SPA

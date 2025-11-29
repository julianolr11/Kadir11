# Guia de Integração - Refatoração Fase 1

## 📦 Módulos Criados

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
Handlers IPC para modos de jogo.

**Preparado para:**
- `battle-pet`
- `train-pet`
- `journey-pet`
- `battle-result`
- `journey-complete`

### 6. **Store Handlers** (`scripts/handlers/storeHandlers.js`)
Handlers IPC para loja e itens.

**Preparado para:**
- `get-coins` / `get-items`
- `buy-item` / `use-item`
- `redeem-gift-code`
- `get-gift-history`
- `get-mute-state` / `set-mute-state`

---

## 🔧 Como Integrar no main.js

### **Passo 1: Importar Módulos (topo do main.js)**

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

### **Passo 2: Substituir Variáveis Globais**

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

### **Passo 3: Substituir console.log**

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

### **Passo 4: Registrar Handlers (após app.whenReady)**

```javascript
app.whenReady().then(() => {
    logger.info('Aplicativo iniciado');
    
    // Limpar pets órfãos
    petManager.cleanOrphanPets().catch(err => {
        logger.error('Erro ao limpar pets órfãos:', err);
    });

    // === REGISTRAR HANDLERS MODULARES ===
    registerPetHandlers(
        windowManager, 
        getItems, 
        getCoins, 
        broadcastPenUpdate, 
        closeAllGameWindows
    );
    
    registerWindowHandlers(
        windowManager,
        getPenInfo,
        getNestCount,
        getItems,
        createNestsWindow,
        closeNestsWindow,
        createHatchWindow,
        closeHatchWindow,
        updateNestsPosition
    );
    
    registerGameHandlers(
        openBattleModeWindow,
        openTrainWindow,
        openJourneyModeWindow,
        handleBattleResult,
        handleJourneyComplete
    );
    
    registerStoreHandlers(
        getCoins,
        setCoins,
        getItems,
        setItems,
        handleBuyItem,
        handleUseItem,
        handleRedeemGift,
        getGiftHistory
    );
    
    // Iniciar pet updater
    startPetUpdater(
        () => state.currentPet,
        (pet) => { state.currentPet = pet; },
        () => state.lastUpdate,
        () => { state.updateTimestamp(); }
    );

    // Registrar atalho DevTools
    registerDevToolsShortcut();

    // Abrir janela inicial
    windowManager.createStartWindow();
});
```

---

## 📝 Handlers que Ainda Precisam Migração Completa

Os seguintes handlers foram **preparados** mas ainda executam lógica no main.js:

### Game Handlers
- `battle-result` (linhas 1889-2030 do main.js)
- `journey-complete` (linhas 1857-1887)
- Toda lógica de batalha, treino e jornada

### Store Handlers
- `buy-item` (linhas 1411-1472)
- `use-item` (linhas 1474-1758)
- `redeem-gift-code` (linhas 1760-1855)

**Por quê não foram completamente migrados?**
- Lógica complexa com muitas dependências
- Requer testes extensivos
- Migração incremental reduz risco de bugs

**Como completar:**
1. Mover a lógica completa para os handlers
2. Passar apenas funções auxiliares como parâmetros
3. Testar cada handler individualmente

---

## ✅ Checklist de Integração

- [ ] Importar todos os módulos refatorados
- [ ] Substituir `currentPet` por `state.currentPet`
- [ ] Substituir console.log por logger.*
- [ ] Registrar todos os handlers no app.whenReady()
- [ ] Testar criar pet
- [ ] Testar selecionar pet
- [ ] Testar deletar pet
- [ ] Testar abrir/fechar janelas
- [ ] Testar batalha
- [ ] Testar loja
- [ ] Verificar se nenhum handler foi esquecido
- [ ] Remover handlers duplicados do main.js
- [ ] Verificar no DevTools se não há erros de IPC

---

## 🎯 Resultado Esperado

**Antes:**
- main.js: 2100+ linhas
- Handlers inline misturados
- Sem logging estruturado
- Variáveis globais desorganizadas

**Depois:**
- main.js: ~300-400 linhas (orquestração)
- Handlers modulares em /handlers/
- Logger com níveis
- Estado centralizado no StateManager
- Código testável e manutenível

---

## 🚀 Próximos Passos

1. **Testar esta refatoração** antes de prosseguir
2. **Fase 2** (se aprovado):
   - Extrair lógica completa dos handlers restantes
   - Adicionar validação de dados
   - Criar testes unitários
3. **Fase 3**:
   - Reorganizar /scripts/ em subpastas
   - Adicionar JSDoc completo
   - Documentar arquitetura

---

## ⚠️ Observações Importantes

1. **Não deletar handlers antigos do main.js** até confirmar que os novos funcionam
2. **Testar em ambiente de desenvolvimento** primeiro
3. **Fazer backup** antes de integrar
4. **Integrar um handler por vez** se preferir abordagem mais segura
5. **StateManager é singleton** - usar o mesmo módulo em todos os arquivos

---

**Autor:** GitHub Copilot  
**Data:** 29/11/2025  
**Branch:** refactor/core-improvements

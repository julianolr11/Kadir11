# FASE 9 - IPC Integration: Quick Start Guide

## 🚀 Como Testar a Integração

### Passo 1: Iniciar o App

```bash
npm start
```

O app abre com o tray (versão multi-window normal). Console mostra:
```
[SPA IPC] Configurando handlers novos...
[SPA IPC] ✅ 5 handlers novos registrados
[SPA] Handlers IPC registrados
```

### Passo 2: Abrir DevTools

Pressione `Ctrl+Shift+D` para abrir DevTools

### Passo 3: Inicializar SPA no Console

No console DevTools, digite:
```javascript
initSPA()
```

**Resultado esperado**:
- Tray desaparece
- SPA aparece com interface de menu
- Console mostra: `[SPA] Inicializado com sucesso`

### Passo 4: Verificar Status do Bridge

```javascript
spaBridge.getStatus()
```

**Resultado esperado** (exemplo):
```javascript
{
  ready: true,
  hasElectronAPI: true,
  gameState: {
    currentPet: {
      id: 'pet_000001',
      name: 'lalako',
      element: 'Ignis',
      rarity: 'Raro',
      // ... mais propriedades
    },
    coins: 235,
    items: {
      potion: 5,
      antidote: 2,
      // ...
    },
    pets: [
      { id: 'pet_000001', name: 'lalako', ... },
      { id: 'pet_000002', name: 'outro pet', ... }
    ]
  }
}
```

**Se ready = false**, verificar console para erros:
```
[SPABridge] Erro em init():...
[SPABridge] Usando localStorage como fallback
```

### Passo 5: Testar Sincronização

#### Teste 5a: Atualizar Pet

No console:
```javascript
spaBridge.updatePet({
  force: 50,
  defense: 40,
  speed: 35
})
```

**Resultado esperado**:
- SPA mostra novos valores
- Console mostra: `[SPABridge] Pet atualizado via IPC`

#### Teste 5b: Atualizar Moedas

```javascript
spaBridge.updateCoins(1000)
```

**Resultado esperado**:
- SPA mostra 1000 moedas
- Console mostra: `[SPABridge] Moedas atualizadas: 1000`

#### Teste 5c: Verificar Sincronização Multi-Window

1. Em outra janela, abra DevTools também
2. No console da SPA, execute:
```javascript
spaBridge.updateCoins(999)
```
3. **Verificar**: A outra janela recebe `coins-updated`?

### Passo 6: Testar Páginas SPA

Clique em botões para navegar:

```
Home → Status do Pet
  ↓
/status → Mostra dados completos do pet atual
  ↓
Items → Lista de itens do inventário
  ↓
Store → Interface de loja
  ↓
Training Menu → Opções de treino
  ↓
Battle Menu → Preparar batalha
```

Cada navegação deve ser instantânea (dentro da mesma janela, sem recarregar).

## 📊 Handlers Testáveis via Console

### Handlers Novos (SPA-specific)

```javascript
// 1. get-store-data
await window.electronAPI.invoke('get-store-data')
// Retorna: { coins: 235, isMiniMode: false }

// 2. update-coins-spa
await window.electronAPI.invoke('update-coins-spa', 500)
// Retorna: { coins: 500 }

// 3. update-pet-spa
await window.electronAPI.invoke('update-pet-spa', {
  force: 60,
  defense: 50
})
// Retorna: { id: 'pet_000001', force: 60, ... }

// 4. create-pet-spa (requires valid pet data)
await window.electronAPI.invoke('create-pet-spa', {
  name: 'New Pet',
  element: 'agua',
  // ... more required fields
})

// 5. select-pet-spa
await window.electronAPI.invoke('select-pet-spa', 'pet_000002')
// Retorna: { id: 'pet_000002', name: 'outro pet', ... }
```

### Handlers Compartilhados (reutilizados)

```javascript
// get-current-pet (existing)
await window.electronAPI.invoke('get-current-pet')
// Retorna: { id: 'pet_000001', name: 'lalako', ... }

// list-pets (existing)
await window.electronAPI.invoke('list-pets')
// Retorna: Array de todos os pets
```

## 🔊 Listeners de Broadcast

Testar listeners no console:

```javascript
// Verificar listeners ativos
window.electronAPI.on('pet-data', (event, pet) => {
  console.log('Pet atualizado!', pet)
})

window.electronAPI.on('coins-updated', (event, coins) => {
  console.log('Moedas atualizadas!', coins)
})

window.electronAPI.on('pets-list-updated', (event, pets) => {
  console.log('Lista atualizada!', pets.length, 'pets')
})
```

Agora qualquer mudança em qualquer janela disparará esses listeners.

## 🐛 Troubleshooting

### Problema: initSPA() não existe
**Causa**: Script spa-init.js não carregou
**Solução**: Verificar DevTools → Sources → scripts/spa-init.js

### Problema: spaBridge is not defined
**Causa**: SPABridge não inicializou
**Solução**: Esperar 1-2 segundos e tentar novamente

### Problema: Bridge.ready = false
**Causa**: IPC falhou, usando localStorage
**Solução**: Verificar console para erros específicos
```javascript
// Restaurar de localStorage manualmente:
spaBridge.restoreFromLocalStorage()
```

### Problema: "No handler registered"
**Causa**: Canal não está em preload.js validChannels
**Solução**: Verificar preload.js e adicionar ao array correto

## 📈 Performance Test

Testar rapidez das operações:

```javascript
// Teste 1: IPC Speed
console.time('get-store-data')
await window.electronAPI.invoke('get-store-data')
console.timeEnd('get-store-data')
// Esperado: < 5ms

// Teste 2: Broadcast Speed
console.time('update-coins')
await spaBridge.updateCoins(999)
console.timeEnd('update-coins')
// Esperado: < 50ms
```

## ✅ Checklist Final

- [ ] App inicia sem erros
- [ ] DevTools mostra "[SPA IPC] ✅ 5 handlers"
- [ ] initSPA() funciona
- [ ] spaBridge.getStatus() retorna ready: true
- [ ] Handlers novos: invoke funciona
- [ ] Handlers compartilhados: invoke funciona
- [ ] Listeners: receivem broadcasts
- [ ] Sincronização multi-window funciona
- [ ] Navegação SPA é fluida
- [ ] Console sem erros

## 🎯 Próximos Passos

Se todos os testes passarem:
1. ✅ FASE 9 - IPC Integration: **COMPLETO**
2. ⏳ FASE 10 - Mini-Mode SPA Integration
3. ⏳ FASE 11 - Cleanup & Optimization

---

**Última Atualização**: 2024
**Status**: 🚀 PRONTO PARA TESTES

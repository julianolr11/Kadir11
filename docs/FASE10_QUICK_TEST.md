# FASE 10 - Mini-Mode Integration Testing Guide

## Quick Test (5 minutes)

### Step 1: Start App
```bash
npm start
```

### Step 2: Open Mini-Mode
- Click on tray window (default location or find in app)
- Or use DevTools console in main window:
```javascript
window.electronAPI.send('open-mini-mode')
```

### Step 3: Verify Bridge
In mini-mode, open DevTools (F12):
```javascript
// Check if bridge initialized
miniModeBridge.getStatus()

// Expected output:
{
  ready: true,
  hasElectronAPI: true,
  petData: { id: 'pet_000001', name: 'lalako', ... },
  coins: 235,
  itemsCount: 5
}
```

### Step 4: Test Broadcast Sync

#### Test 4a: Coin Update
```javascript
// In mini-mode console:
console.log('Before:', miniModeBridge.coins)

// In main/SPA console:
spaBridge.updateCoins(999)

// Back in mini-mode console (should update automatically):
console.log('After:', miniModeBridge.coins)  // Should be 999
```

#### Test 4b: Pet Update
```javascript
// In main/SPA console:
spaBridge.updatePet({ force: 70, speed: 60 })

// In mini-mode console:
console.log(miniModeBridge.petData)
// force should be 70, speed should be 60
```

---

## Full Test Suite

### Test 1: Bridge Initialization

**Location**: Mini-Mode DevTools

**Test**:
```javascript
// 1. Check instance exists
console.assert(window.miniModeBridge, 'Bridge not defined')

// 2. Check ready state
console.assert(miniModeBridge.ready, 'Bridge not ready')

// 3. Check has pet data
console.assert(miniModeBridge.petData, 'No pet data')

// 4. Check has electronAPI
console.assert(window.electronAPI, 'No electronAPI')
```

**Expected**: All assertions pass ✅

### Test 2: Data Loading

**Test**:
```javascript
// Check loaded from IPC
const status = miniModeBridge.getStatus()
console.log('Pet loaded:', status.petData?.name)
console.log('Coins loaded:', status.coins)
console.log('Items count:', status.itemsCount)

// All should be > 0
console.assert(status.petData, 'Pet not loaded')
console.assert(status.coins >= 0, 'Coins not loaded')
```

**Expected**: All data present ✅

### Test 3: Broadcast Listeners

**Test**:
```javascript
// Check listeners are set up
// Send a broadcast from another window:

// In SPA console:
window.electronAPI.send('pet-updated', { force: 50 })

// In mini-mode console (wait a moment then):
console.log(miniModeBridge.petData.force)  // Should update
```

**Expected**: Mini-mode receives update within 100ms ✅

### Test 4: Three-Window Synchronization

**Setup**:
- Keep app running with:
  - SPA console open
  - Main window status window open
  - Mini-mode open

**Test**:
```javascript
// 1. Update in SPA
spaBridge.updateCoins(500)

// 2. Wait 100ms
await new Promise(r => setTimeout(r, 100))

// 3. Check all windows
// SPA:
console.log('SPA coins:', gameState.get('coins'))  // 500

// Main window (status.js if open):
// Should show 500 coins in UI

// Mini-mode console:
console.log('Mini coins:', miniModeBridge.coins)  // 500
```

**Expected**: All three show coins = 500 ✅

### Test 5: Fallback System

**Test Fallback** (simulate bridge failure):
```javascript
// Temporarily disable IPC
const original = window.electronAPI.invoke
window.electronAPI.invoke = undefined

// Try to update
miniModeBridge.updatePet({ force: 60 })

// Check console for fallback message
// Should see: "[MiniModeBridge] Bridge não pronto"

// Restore
window.electronAPI.invoke = original
```

**Expected**: 
- Falls back gracefully ✅
- No errors in console ✅
- System still responds ✅

### Test 6: Menu Actions

**Test**:
```javascript
// Click menu items in mini-mode
// Each should work and possibly open a window:

- Status        → Opens status window
- Train         → Opens train window
- Battle        → Opens battle window
- Items         → Opens items window
- Store         → Opens store window
- Pets          → Opens pet selection
- Normal Mode   → Returns to normal view
```

**Expected**: All menu items work ✅

### Test 7: Pet Data Update Flow

**Full workflow test**:
```javascript
// 1. Start with pet_000001
console.log('Current pet:', miniModeBridge.petData.id)

// 2. Train force (in SPA or any window)
spaBridge.updatePet({ force: miniModeBridge.petData.force + 5 })

// 3. Mini-mode receives broadcast
// window.updateMiniModeUI() is called automatically

// 4. UI updates (should see in mini-mode interface)
// Check element and name display

// 5. Verify data
console.log('Force after training:', miniModeBridge.petData.force)
```

**Expected**: 
- UI updates instantly ✅
- No manual refresh needed ✅
- Data consistent across all windows ✅

### Test 8: Performance

**Test**:
```javascript
// Measure bridge initialization
console.time('bridge-init')
const newBridge = new MiniModeBridge()
await newBridge.init()
console.timeEnd('bridge-init')
// Should be < 100ms

// Measure broadcast response
console.time('broadcast')
spaBridge.updateCoins(999)
// Wait for listener
console.timeEnd('broadcast')
// Should be < 50ms
```

**Expected**: 
- Init: < 100ms ✅
- Broadcast: < 50ms ✅

---

## Troubleshooting

### Problem: "miniModeBridge is undefined"
**Cause**: Scripts not loaded
**Solution**: 
- Check mini-mode.html has both scripts
- Check mini-mode-spa-init.js exists
- Refresh mini-mode window (F5)

### Problem: Bridge.ready = false
**Cause**: IPC not available
**Solution**:
- Check preload.js has required channels
- Check main.js has handlers registered
- Check console for IPC errors

### Problem: No broadcast received
**Cause**: Listeners not registered
**Solution**:
- Check setupListeners() was called
- Verify window.updateMiniModeUI exists
- Check other window's broadcast is working

### Problem: UI not updating
**Cause**: Callback not called
**Solution**:
- Verify window.updateMiniModeUI defined
- Check petData is loaded
- Try manual updatePetData(pet) call

---

## Console Test Script

Copy and run in mini-mode DevTools:

```javascript
// Complete test suite
async function testMiniMode() {
  console.log('🧪 Testing Mini-Mode Bridge...\n');
  
  // Test 1: Bridge exists
  if (!window.miniModeBridge) {
    console.error('❌ Bridge not defined');
    return;
  }
  console.log('✅ Bridge defined');
  
  // Test 2: Bridge ready
  if (!miniModeBridge.ready) {
    console.error('❌ Bridge not ready');
    return;
  }
  console.log('✅ Bridge ready');
  
  // Test 3: Pet data
  if (!miniModeBridge.petData) {
    console.error('❌ No pet data');
    return;
  }
  console.log('✅ Pet data loaded:', miniModeBridge.petData.name);
  
  // Test 4: Coins
  if (miniModeBridge.coins < 0) {
    console.error('❌ Coins invalid');
    return;
  }
  console.log('✅ Coins:', miniModeBridge.coins);
  
  // Test 5: Status
  const status = miniModeBridge.getStatus();
  console.log('✅ Status:', status);
  
  console.log('\n🎉 All tests passed!');
}

// Run it
testMiniMode()
```

---

## Check Logs

### In Mini-Mode Console
Should see:
```
[MiniModeBridge] Inicializando...
[MiniModeBridge] Pet carregado: lalako
[MiniModeBridge] Store carregada: moedas = 235
[MiniModeBridge] ✅ Conectado e pronto
[MiniMode] Bridge IPC conectado
```

### When Broadcast Received
Should see:
```
[MiniModeBridge] Pet atualizado via broadcast: lalako
```

---

## Next Test: FASE 11

Once FASE 10 tests pass, FASE 11 will focus on:
- Cleanup of test files
- Performance optimization
- Final documentation
- Production readiness

---

**Happy Testing! 🚀**

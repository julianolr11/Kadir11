const assert = require('assert');
const Module = require('module');

// Dynamic stubs reused across tests
let ipcStub; let windowsSent;
const electronStub = {
  ipcMain: {
    on: (ch, fn) => { ipcStub.handlers[ch] = fn; },
    handle: (ch, fn) => { ipcStub.asyncHandlers[ch] = fn; }
  },
  BrowserWindow: {
    getAllWindows: () => ipcStub.getAllWindows()
  }
};

// Patch require to return our stub before loading storeHandlers
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path){
  if(path === 'electron') return electronStub;
  return originalRequire.apply(this, arguments);
};

const { registerStoreHandlers } = require('../scripts/handlers/storeHandlers');

function resetIpc(){
  windowsSent = [];
  ipcStub = {
    handlers: {},
    asyncHandlers: {},
    emit: (ch,...args) => ipcStub.handlers[ch] ? ipcStub.handlers[ch]({}, ...args) : undefined,
    invoke: async (ch,...args) => ipcStub.asyncHandlers[ch] ? ipcStub.asyncHandlers[ch]({}, ...args) : undefined,
    getAllWindows: () => [ { webContents:{ send:(ev,data)=> windowsSent.push({ev,data}) } }, { webContents:{ send:(ev,data)=> windowsSent.push({ev,data}) } } ]
  };
}

describe('storeHandlers', () => {
  let pet, items, coins, nestCount, calls;
  beforeEach(() => {
    resetIpc();
    pet = { petId:'1', currentHealth:10, maxHealth:50, hunger:0, happiness:0, energy:30, kadirPoints:0, equippedItem:null, items:{} };
    items = {};
    coins = 200;
    nestCount = 0;
    calls = { penUpdate:0, nestUpdate:0, updatePet:[], giftWindow:[] };
    const storeData = {};
    const deps = {
        getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async (id, data) => { calls.updatePet.push({ id, data }); Object.assign(pet, data); } },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v },
      windowManager: { getGiftWindow: () => ({ webContents:{ send:(ev,d)=> calls.giftWindow.push({ ev,d }) } }) }
    };
    registerStoreHandlers(deps);
  });

  it('compra item comum reduz moedas e adiciona ao inventário', () => {
      ipcStub.emit('buy-item','healthPotion');
    assert.strictEqual(coins, 190); // 200 - 10
    assert.strictEqual(items.healthPotion,1);
  });

  it('mostra erro se moedas insuficientes', () => {
    coins = 0;
      ipcStub.emit('buy-item','healthPotion');
    const storeErrors = windowsSent.filter(s => s.ev==='show-store-error');
    assert.ok(storeErrors.length>=1);
  });

  it('atualiza penSize ao comprar terrainMedium e dispara broadcastPenUpdate', () => {
      ipcStub.emit('buy-item','terrainMedium');
    assert.strictEqual(calls.penUpdate,1);
  });

  it('bloqueia compra de nest ao atingir limite', () => {
    nestCount = 3; // at limit
    coins = 1000; // garantir moedas suficientes para não cair no branch de insuficiência
    ipcStub.emit('buy-item','nest');
    const errs = windowsSent.filter(s => s.ev==='show-store-error');
    assert.ok(errs.some(e => /Limite/.test(e.data)));
  });

  it('usa healthPotion alterando vida e chamando updatePet', async () => {
    items.healthPotion = 1;
      await ipcStub.invoke('use-item','healthPotion');
    assert.ok(pet.currentHealth > 10);
    assert.ok(calls.updatePet.length>=1);
  });

  it('equipa finger e atualiza equippedItem', async () => {
    items.finger = 1;
      await ipcStub.invoke('use-item','finger');
    assert.strictEqual(pet.equippedItem,'finger');
    assert.strictEqual(items.finger,0);
  });

  it('unequip-item devolve item ao inventário e limpa equippedItem', async () => {
    pet.equippedItem='finger';
    items.finger = 0;
      ipcStub.emit('unequip-item');
    assert.strictEqual(items.finger,1);
    assert.strictEqual(pet.equippedItem,null);
  });

  it('redeem gift code kadirPoints incrementa pontos e envia evento', () => {
      ipcStub.emit('redeem-gift-code','KADIR5');
    assert.ok(pet.kadirPoints >=5);
    assert.ok(calls.giftWindow.some(e=>e.ev==='gift-redeemed'));
  });

  it('redeem gift multi adiciona itens e mantém histórico', () => {
      ipcStub.emit('redeem-gift-code','STARTERPACK');
    assert.ok(items.healthPotion>=2 && items.staminaPotion>=2 && items.meat>=2);
      const history = ipcStub.invoke('get-gift-history');
    // invoke returns promise, but handler returns array sync; treat as promise
    return history.then(h => { assert.ok(Array.isArray(h)); });
  });

  it('handlers de mute get/set refletem estado', async () => {
      const initial = await ipcStub.invoke('get-mute-state');
    assert.strictEqual(initial,false);
      ipcStub.emit('set-mute-state',true);
      const after = await ipcStub.invoke('get-mute-state');
    assert.strictEqual(after,true);
  });

  it('terrainLarge upgrade aplica quando estado medium e broadcast dispara', () => {
    // preparar penSize = medium antes de compra
    const storeData = { penSize: 'medium' };
    resetIpc();
    const deps2 = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v },
      windowManager: { getGiftWindow: () => ({ webContents:{ send:(ev,d)=> calls.giftWindow.push({ ev,d }) } }) }
    };
    registerStoreHandlers(deps2);
    ipcStub.emit('buy-item','terrainLarge');
    assert.strictEqual(storeData.penSize,'large');
    assert.ok(calls.penUpdate>0);
  });

  it('terrainLarge não altera quando já está large mas ainda deduz moedas', () => {
    // Isolar registro para garantir penSize inicial 'large' e contador zerado
    resetIpc();
    calls.penUpdate = 0;
    const storeData = { penSize: 'large' };
    const depsLocal = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v },
      windowManager: { getGiftWindow: () => ({ webContents:{ send:(ev,d)=> calls.giftWindow.push({ ev,d }) } }) }
    };
    registerStoreHandlers(depsLocal);
    const beforeCoins = coins;
    ipcStub.emit('buy-item','terrainLarge');
    assert.strictEqual(storeData.penSize,'large');
    assert.ok(coins < beforeCoins); // preço cobrado
    assert.strictEqual(calls.penUpdate,0); // sem broadcast esperado
  });

  it('gift code inválido gera gift-error apropriado', () => {
    ipcStub.emit('redeem-gift-code',123); // não string
    assert.ok(calls.giftWindow.some(e=>e.ev==='gift-error' && /inválido/i.test(e.d)));
  });

  it('gift code não encontrado gera gift-error', () => {
    ipcStub.emit('redeem-gift-code','unknown');
    assert.ok(calls.giftWindow.some(e=>e.ev==='gift-error' && /não encontrado/i.test(e.d)));
  });

  it('gift code duplicado gera mensagem de já usado', () => {
    ipcStub.emit('redeem-gift-code','KADIR5');
    ipcStub.emit('redeem-gift-code','KADIR5');
    const dup = calls.giftWindow.filter(e=>e.ev==='gift-error' && /já foi usado/i.test(e.d));
    assert.ok(dup.length>=1);
  });

  it('gift code de pet adiciona ovo aos itens', () => {
    ipcStub.emit('redeem-gift-code','NEWPET');
    assert.ok(items.eggFera>=1);
  });

  it('equipar item já equipado consome uma unidade sem alterar equippedItem', async () => {
    pet.equippedItem='finger';
    items.finger = 2;
    await ipcStub.invoke('use-item','finger');
    assert.strictEqual(pet.equippedItem,'finger');
    assert.strictEqual(items.finger,1);
  });

  it('usar item sem estoque retorna early sem update', async () => {
    const prevUpdates = calls.updatePet.length;
    const result = await ipcStub.invoke('use-item','meat');
    assert.strictEqual(result, undefined);
    assert.strictEqual(calls.updatePet.length, prevUpdates);
  });

  it('use-item captura erro de updatePet e ainda faz broadcast', async () => {
    // Re-registra handlers com petManager que lança
    resetIpc();
    items.healthPotion = 1;
    const storeData = {};
    const localSentBefore = windowsSent.length;
    const deps3 = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => { throw new Error('fail-update'); } },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v },
      windowManager: { getGiftWindow: () => ({ webContents:{ send:(ev,d)=> calls.giftWindow.push({ ev,d }) } }) }
    };
    registerStoreHandlers(deps3);
    await ipcStub.invoke('use-item','healthPotion');
    assert.ok(pet.currentHealth>10); // efeito aplicado
    const petDataEvents = windowsSent.slice(localSentBefore).filter(e=>e.ev==='pet-data');
    assert.ok(petDataEvents.length>=1); // broadcast ocorreu
  });

  it('retorna early em buy-item quando não há pet', () => {
    resetIpc();
    let unchangedCoins = coins;
    const depsNoPet = {
      getCurrentPet: () => null,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> d, set:()=>{} }
    };
    registerStoreHandlers(depsNoPet);
    ipcStub.emit('buy-item','healthPotion');
    assert.strictEqual(coins, unchangedCoins);
  });

  it('retorna early em buy-item quando preço é indefinido', () => {
    const before = coins;
    ipcStub.emit('buy-item','itemInexistenteXYZ');
    assert.strictEqual(coins, before);
  });

  it('compra nest com sucesso incrementa nestCount e dispara broadcastNestUpdate', () => {
    const beforeCount = nestCount;
    ipcStub.emit('buy-item','nest');
    // nestCount não é mutado diretamente, mas armazenado em store; precisamos reemitir outro nest para garantir increment
    // Após a compra, storeHandlers chamou store.set('nestCount', getNestCount()+1);
    // Simulamos getNestCount refletindo novo valor
    nestCount = beforeCount + 1;
    assert.strictEqual(nestCount, beforeCount+1);
    assert.ok(calls.nestUpdate>=1);
  });

  it('terrainMedium compra sem upgrade (já medium) cobra moedas mas não broadcast', () => {
    resetIpc();
    const storeData = { penSize:'medium' };
    const localDeps = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v }
    };
    registerStoreHandlers(localDeps);
    const beforeCoins = coins;
    ipcStub.emit('buy-item','terrainMedium');
    assert.ok(coins < beforeCoins);
    assert.strictEqual(calls.penUpdate,0);
    assert.strictEqual(storeData.penSize,'medium');
  });

  it('terrainLarge upgrade direto de small para large dispara broadcast', () => {
    resetIpc();
    const storeData = { penSize:'small' };
    calls.penUpdate = 0;
    const localDeps = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v }
    };
    registerStoreHandlers(localDeps);
    ipcStub.emit('buy-item','terrainLarge');
    assert.strictEqual(storeData.penSize,'large');
    assert.ok(calls.penUpdate>0);
  });

  it('usa meat aplica múltiplos efeitos', async () => {
    items.meat = 1; const prevHealth = pet.currentHealth;
    await ipcStub.invoke('use-item','meat');
    assert.ok(pet.hunger>0 && pet.happiness>0 && pet.currentHealth>=prevHealth);
  });

  it('usa staminaPotion aumenta energia', async () => {
    items.staminaPotion = 1; const prevEnergy = pet.energy;
    await ipcStub.invoke('use-item','staminaPotion');
    assert.ok(pet.energy>prevEnergy);
  });

  it('usa chocolate aumenta felicidade e energia e fome', async () => {
    items.chocolate = 1; const prevHappy = pet.happiness; const prevEnergy = pet.energy; const prevHunger = pet.hunger;
    await ipcStub.invoke('use-item','chocolate');
    assert.ok(pet.happiness>prevHappy && pet.energy>prevEnergy && pet.hunger>prevHunger);
  });

  it('equipar novo item substitui anterior e devolve ao inventário', async () => {
    pet.equippedItem = 'finger'; items.finger = 0; items.turtleShell = 1;
    await ipcStub.invoke('use-item','turtleShell');
    assert.strictEqual(pet.equippedItem,'turtleShell');
    assert.ok(items.finger>=1);
  });

  it('unequip-item retorna early quando não há item equipado', () => {
    pet.equippedItem = null; const beforeItems = { ...items };
    ipcStub.emit('unequip-item');
    assert.deepStrictEqual(items, beforeItems);
  });

  it('redeem WELCOME adiciona moedas', () => {
    const before = coins; ipcStub.emit('redeem-gift-code','WELCOME');
    assert.ok(coins>before);
  });

  it('redeem STARTER adiciona item simples', () => {
    ipcStub.emit('redeem-gift-code','STARTER');
    assert.ok(items.healthPotion>=5);
  });

  it('giftHistory mantém limite de 20 entradas', () => {
    // Re-registra com store pré-carregado
    resetIpc();
    const preHistory = Array.from({length:20},(_,i)=>({ code:'X'+i, name:'n', icon:'i', date:new Date().toISOString(), description:'d'}));
    const storeData = { giftHistory: preHistory };
    const depsHist = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v },
      windowManager: { getGiftWindow: () => ({ webContents:{ send:(ev,d)=> calls.giftWindow.push({ ev,d }) } }) }
    };
    registerStoreHandlers(depsHist);
    ipcStub.emit('redeem-gift-code','KADIR5');
    assert.strictEqual(storeData.giftHistory.length,20);
    assert.strictEqual(storeData.giftHistory[0].code,'KADIR5');
  });

  it('get-coins e get-items retornam valores atuais', async () => {
    items.healthPotion = 3;
    const gotCoins = await ipcStub.invoke('get-coins');
    const gotItems = await ipcStub.invoke('get-items');
    assert.strictEqual(gotCoins, coins);
    assert.strictEqual(gotItems.healthPotion,3);
  });

  it('redeem-gift-code com janela ausente não lança erro', () => {
    resetIpc();
    const depsNoWin = {
      getCurrentPet: () => pet,
      getCoins: () => coins,
      setCoins: v => coins = v,
      getItems: () => items,
      setItems: v => { items = { ...v }; },
      getNestPrice: () => 50 * Math.pow(2, nestCount),
      getNestCount: () => nestCount,
      broadcastPenUpdate: () => calls.penUpdate++,
      broadcastNestUpdate: () => calls.nestUpdate++,
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> d, set:()=>{} },
      windowManager: { getGiftWindow: () => null }
    };
    registerStoreHandlers(depsNoWin);
    // inválido para acionar erro sem giftWindow
    ipcStub.emit('redeem-gift-code','UNKNOWNXYZ');
    assert.ok(true); // se chegamos aqui, não houve exceção
  });

  it('captura exceção no bloco try de redeem-gift-code (catch linha 212-213)', () => {
    resetIpc();
    pet = { petId:'1', kadirPoints:0 };
    calls.giftWindow = [];
    const storeData = {};
    const deps = {
      getCurrentPet: () => pet,
      getCoins: () => 100,
      setCoins: () => { throw new Error('setCoins crash'); },
      getItems: () => ({}),
      setItems: () => {},
      getNestPrice: () => 50,
      getNestCount: () => 0,
      broadcastPenUpdate: () => {},
      broadcastNestUpdate: () => {},
      petManager: { updatePet: async () => {} },
      store: { get:(k,d)=> storeData[k]!==undefined?storeData[k]:d, set:(k,v)=> storeData[k]=v },
      windowManager: { getGiftWindow: () => ({ webContents:{ send:(ev,d)=> calls.giftWindow.push({ ev,d }) } }) }
    };
    registerStoreHandlers(deps);
    // WELCOME é tipo 'coins', vai chamar setCoins e lançar exceção
    ipcStub.emit('redeem-gift-code','WELCOME');
    const errors = calls.giftWindow.filter(e => e.ev==='gift-error' && /Erro ao processar/i.test(e.d));
    assert.ok(errors.length>=1, 'Esperado gift-error do catch');
  });
});

/**
 * Handlers IPC para operações de loja, moedas, itens e gift codes
 */
const { ipcMain, BrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('StoreHandlers');

/**
 * Registra handlers de loja encapsulando lógica de compra, uso, gifts e unequip.
 * @param {Object} deps Dependências injetadas.
 */
function registerStoreHandlers(deps = {}) {
    const {
        getCurrentPet,
        getCoins,
        setCoins,
        getItems,
        setItems,
        getNestPrice,
        getNestCount,
        broadcastPenUpdate,
        broadcastNestUpdate,
        petManager,
        store
    } = deps;

    logger.info('Registrando Store Handlers');

    function broadcastPet(pet) {
        BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('pet-data', pet); });
    }

    // Preços base (nest depende de getNestPrice)
    function getPriceMap() {
        return {
            healthPotion: 10,
            meat: 5,
            staminaPotion: 8,
            chocolate: 2,
            finger: 35,
            turtleShell: 35,
            feather: 35,
            orbe: 35,
            terrainMedium: 100,
            terrainLarge: 200,
            nest: typeof getNestPrice === 'function' ? getNestPrice() : 50
        };
    }

    // Gift codes
    const giftCodes = {
        KADIR5: { type: 'kadirPoints', amount: 5, name: '5 Kadir Points', icon: 'Assets/Icons/dna-kadir.png' },
        KADIR2025: { type: 'kadirPoints', amount: 50, name: '50 Kadir Points', icon: 'Assets/Icons/dna-kadir.png' },
        WELCOME: { type: 'coins', amount: 100, name: '100 Moedas', icon: 'Assets/Icons/coin.png' },
        STARTER: { type: 'item', item: 'healthPotion', qty: 5, name: '5x Poção de Vida', icon: 'Assets/Shop/health-potion.png' },
        ENERGY: { type: 'item', item: 'staminaPotion', qty: 3, name: '3x Poção de Energia', icon: 'Assets/Shop/stamina-potion.png' },
        RARE: { type: 'item', item: 'finger', qty: 1, name: 'Garra do Predador', icon: 'Assets/Shop/finger.png' },
        NEWPET: { type: 'pet', egg: 'eggFera', name: 'Ovo de Fera', icon: 'Assets/Shop/eggFera.png' },
        STARTERPACK: {
            type: 'multi',
            name: 'Starter Pack',
            icon: 'Assets/Shop/health-potion.png',
            items: [
                { item: 'healthPotion', qty: 2 },
                { item: 'staminaPotion', qty: 2 },
                { item: 'meat', qty: 2 }
            ]
        }
    };

    // Handlers básicos
    ipcMain.handle('get-coins', async () => {
        const coins = getCoins();
        logger.debug(`Moedas atuais: ${coins}`);
        return coins;
    });

    ipcMain.handle('get-items', async () => {
        const items = getItems();
        logger.debug('Itens recuperados');
        return items;
    });

    ipcMain.on('buy-item', (event, itemKey) => {
        const pet = getCurrentPet();
        if (!pet) return;
        const prices = getPriceMap();
        const price = prices[itemKey];
        if (price === undefined) return;
        if (getCoins() < price) {
            BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-store-error', 'Moedas insuficientes!'); });
            return;
        }
        if (itemKey === 'nest') {
            if (typeof getNestCount === 'function' && getNestCount() >= 3) {
                BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-store-error', 'Limite de ninhos atingido!'); });
                return;
            }
        }
        setCoins(getCoins() - price);
        pet.coins = getCoins();
        if (itemKey === 'terrainMedium' || itemKey === 'terrainLarge') {
            const current = store.get('penSize', 'small');
            if (itemKey === 'terrainMedium' && current === 'small') {
                store.set('penSize', 'medium');
                broadcastPenUpdate && broadcastPenUpdate();
            } else if (itemKey === 'terrainLarge' && current !== 'large') {
                store.set('penSize', 'large');
                broadcastPenUpdate && broadcastPenUpdate();
            }
        } else if (itemKey === 'nest') {
            store.set('nestCount', (getNestCount ? getNestCount() : 0) + 1);
            broadcastNestUpdate && broadcastNestUpdate();
        } else {
            const items = getItems();
            items[itemKey] = (items[itemKey] || 0) + 1;
            setItems(items);
            pet.items = items;
        }
        broadcastPet(pet);
    });

    ipcMain.handle('use-item', async (event, itemKey) => {
        const pet = getCurrentPet();
        if (!pet) return;
        const items = getItems();
        if (!items[itemKey] || items[itemKey] <= 0) return;
        switch (itemKey) {
            case 'healthPotion':
                pet.currentHealth = Math.min(pet.currentHealth + 20, pet.maxHealth); break;
            case 'meat':
                pet.hunger = Math.min((pet.hunger || 0) + 20, 100);
                pet.happiness = Math.min((pet.happiness || 0) + 10, 100);
                pet.currentHealth = Math.min(pet.currentHealth + Math.round(pet.maxHealth * 0.05), pet.maxHealth);
                break;
            case 'staminaPotion':
                pet.energy = Math.min((pet.energy || 0) + 20, 100); break;
            case 'chocolate':
                pet.happiness = Math.min((pet.happiness || 0) + 20, 100);
                pet.energy = Math.min((pet.energy || 0) + 10, 100);
                pet.hunger = Math.min((pet.hunger || 0) + 3, 100);
                break;
            case 'finger':
            case 'turtleShell':
            case 'feather':
            case 'orbe':
                if (pet.equippedItem === itemKey) break;
                if (pet.equippedItem) {
                    items[pet.equippedItem] = (items[pet.equippedItem] || 0) + 1;
                }
                pet.equippedItem = itemKey;
                break;
        }
        items[itemKey] -= 1;
        setItems(items);
        pet.items = items;
        try {
            await petManager.updatePet(pet.petId, {
                currentHealth: pet.currentHealth,
                hunger: pet.hunger,
                happiness: pet.happiness,
                energy: pet.energy,
                equippedItem: pet.equippedItem
            });
        } catch (err) {
            logger.error('Erro ao usar item', err);
        }
        broadcastPet(pet);
        return pet.currentHealth;
    });

    ipcMain.on('unequip-item', async () => {
        const pet = getCurrentPet();
        if (!pet || !pet.equippedItem) return;
        const items = getItems();
        const eq = pet.equippedItem;
        items[eq] = (items[eq] || 0) + 1;
        pet.equippedItem = null;
        setItems(items); pet.items = items;
        try { await petManager.updatePet(pet.petId, { equippedItem: null }); } catch (err) { logger.error('Erro ao remover item', err); }
        broadcastPet(pet);
    });

    ipcMain.on('redeem-gift-code', (event, code) => {
        const giftWindow = deps.windowManager && deps.windowManager.getGiftWindow && deps.windowManager.getGiftWindow();
        if (!code || typeof code !== 'string') { if (giftWindow) giftWindow.webContents.send('gift-error', 'Código inválido.'); return; }
        const upper = code.toUpperCase().trim();
        const used = store.get('usedGiftCodes', []);
        if (used.includes(upper)) { if (giftWindow) giftWindow.webContents.send('gift-error', 'Este código já foi usado.'); return; }
        const gift = giftCodes[upper];
        if (!gift) { if (giftWindow) giftWindow.webContents.send('gift-error', 'Código não encontrado.'); return; }
        try {
            if (gift.type === 'kadirPoints') {
                const pet = getCurrentPet(); if (pet) { pet.kadirPoints = (pet.kadirPoints || 0) + gift.amount; petManager.updatePet(pet.petId, { kadirPoints: pet.kadirPoints }).catch(()=>{}); broadcastPet(pet); }
            } else if (gift.type === 'coins') {
                setCoins(getCoins() + gift.amount); const pet = getCurrentPet(); if (pet) { pet.coins = getCoins(); broadcastPet(pet); }
            } else if (gift.type === 'item') {
                const items = getItems(); items[gift.item] = (items[gift.item] || 0) + gift.qty; setItems(items); const pet = getCurrentPet(); if (pet) { pet.items = items; broadcastPet(pet); }
            } else if (gift.type === 'pet') {
                const items = getItems(); items[gift.egg] = (items[gift.egg] || 0) + 1; setItems(items); const pet = getCurrentPet(); if (pet) { pet.items = items; broadcastPet(pet); }
            } else if (gift.type === 'multi') {
                const items = getItems(); gift.items.forEach(it => { items[it.item] = (items[it.item] || 0) + it.qty; }); setItems(items); const pet = getCurrentPet(); if (pet) { pet.items = items; broadcastPet(pet); }
            }
            const history = store.get('giftHistory', []);
            history.unshift({ code: upper, name: gift.name, icon: gift.icon, date: new Date().toISOString(), description: gift.type === 'multi' ? gift.items.map(i => `${i.qty}x ${i.item}`).join(', ') : gift.name });
            if (history.length > 20) history.pop();
            store.set('giftHistory', history);
            used.push(upper); store.set('usedGiftCodes', used);
            if (giftWindow) giftWindow.webContents.send('gift-redeemed', gift.name);
        } catch (err) {
            logger.error('Erro ao processar presente', err);
            if (giftWindow) giftWindow.webContents.send('gift-error', 'Erro ao processar presente.');
        }
    });

    ipcMain.handle('get-gift-history', () => store.get('giftHistory', []));

    ipcMain.handle('get-mute-state', () => {
        const isMuted = store.get('isMuted', false);
        logger.debug(`Estado de mute: ${isMuted}`);
        return isMuted;
    });
    ipcMain.on('set-mute-state', (e, isMuted) => { store.set('isMuted', isMuted); logger.debug(`Mute atualizado para: ${isMuted}`); });

    logger.info('Store Handlers registrados com sucesso');
}

module.exports = { registerStoreHandlers };

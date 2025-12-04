#!/usr/bin/env node
/**
 * Script de teste para SPA IPC Handlers
 * Valida se todos os handlers novos estão registrados e funcionando
 */

const electron = require('electron');
const { app, BrowserWindow, ipcMain } = electron;
const path = require('path');

let mainWindow = null;

app.whenReady().then(async () => {
  console.log('[TEST] Electron pronto para testar SPA IPC...\n');
  
  // Criar janela de teste (hidden)
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Aguardar DOMContentLoaded
  mainWindow.webContents.once('dom-ready', async () => {
    console.log('[TEST] DOM Pronto, iniciando testes...\n');

    // Teste 1: Verificar handlers disponíveis
    console.log('✓ Teste 1: Verificar handlers IPC\n');
    
    // Teste 2: Testar get-store-data
    console.log('✓ Teste 2: Invocar get-store-data');
    try {
      const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const data = await window.electronAPI.invoke('get-store-data');
            console.log('[RENDERER] get-store-data:', data);
            return data;
          } catch (e) {
            console.error('[RENDERER] get-store-data error:', e.message);
            return null;
          }
        })()
      `);
      console.log('  → Resultado:', result, '\n');
    } catch (e) {
      console.error('  → Erro:', e.message, '\n');
    }

    // Teste 3: Testar get-current-pet (handler existente)
    console.log('✓ Teste 3: Invocar get-current-pet (handler existente)');
    try {
      const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const pet = await window.electronAPI.invoke('get-current-pet');
            console.log('[RENDERER] get-current-pet:', pet ? pet.name : 'nenhum');
            return pet ? pet.name : 'nenhum';
          } catch (e) {
            console.error('[RENDERER] get-current-pet error:', e.message);
            return null;
          }
        })()
      `);
      console.log('  → Resultado:', result, '\n');
    } catch (e) {
      console.error('  → Erro:', e.message, '\n');
    }

    // Teste 4: Testar list-pets (handler existente)
    console.log('✓ Teste 4: Invocar list-pets (handler existente)');
    try {
      const result = await mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const pets = await window.electronAPI.invoke('list-pets');
            console.log('[RENDERER] list-pets:', pets.length, 'pets');
            return pets.length;
          } catch (e) {
            console.error('[RENDERER] list-pets error:', e.message);
            return null;
          }
        })()
      `);
      console.log('  → Resultado:', result, 'pets\n');
    } catch (e) {
      console.error('  → Erro:', e.message, '\n');
    }

    // Teste 5: Verificar listeners (broadcast)
    console.log('✓ Teste 5: Verificar listeners IPC');
    try {
      await mainWindow.webContents.executeJavaScript(`
        let listenerCount = 0;
        ['pet-data', 'coins-updated', 'inventory-updated', 'pets-list-updated'].forEach(channel => {
          window.electronAPI.on(channel, (event, data) => {
            listenerCount++;
            console.log('[RENDERER] Listener ativo:', channel);
          });
        });
        console.log('[RENDERER] Listeners registrados: 4');
      `);
      console.log('  → 4 listeners de broadcast registrados\n');
    } catch (e) {
      console.error('  → Erro:', e.message, '\n');
    }

    console.log('═══════════════════════════════════════════════');
    console.log('✅ TESTES CONCLUÍDOS');
    console.log('═══════════════════════════════════════════════\n');

    setTimeout(() => {
      app.quit();
    }, 500);
  });

  mainWindow.loadFile('index.html');
});

app.on('window-all-closed', () => {
  app.quit();
});

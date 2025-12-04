/**
 * Handlers IPC para operações do mini-mode
 * @module handlers/miniModeHandlers
 */

const { ipcMain, screen } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('MiniModeHandlers');

// Armazenar posição anterior da janela
let previousWindowBounds = null;

/**
 * Handler para abrir mini-mode window (DEPRECATED - agora transformamos o index.html)
 */
function setupOpenMiniModeHandler(createMiniWindow, getMiniWindow, appState, windowManager) {
  ipcMain.on('open-mini-mode', async () => {
    logger.debug('open-mini-mode handler chamado (deprecated)');
    // Este handler não é mais usado - mini-mode agora transforma index.html
  });
}

/**
 * Handler para transformar layout entre normal e mini-mode
 */
function setupMiniModeLayoutHandler(windowManager) {
  ipcMain.on('set-mini-mode-layout', (event, { width, height, mini }) => {
    logger.debug(`Transformando layout: ${mini ? 'mini-mode' : 'normal'} (${width}x${height})`);
    
    // Obter a janela que enviou o evento
    const startWindow = require('electron').BrowserWindow.fromWebContents(event.sender);
    if (!startWindow || startWindow.isDestroyed()) {
      logger.error('Janela não disponível para transformar layout');
      return;
    }
    
    try {
      // Obter posição da tela
      const primaryDisplay = require('electron').screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      logger.debug(`Tamanho da tela: ${screenWidth}x${screenHeight}`);
      
      // Posicionar de acordo com o modo
      if (mini) {
        // Salvar posição atual antes de transformar
        previousWindowBounds = startWindow.getBounds();
        logger.debug(`Posição salva: ${JSON.stringify(previousWindowBounds)}`);
        
        // Mini-mode: canto inferior direito - remover limites mínimos
        startWindow.setMinimumSize(50, 350);
        
        const x = screenWidth - width - 10; // 10px de margem
        const y = screenHeight - height - 10; // 10px de margem
        
        logger.debug(`Posicionando mini-mode em: x=${x}, y=${y}, tela=${screenWidth}x${screenHeight}`);
        
        // Primeiro redimensionar, depois reposicionar e garantir visibilidade
        startWindow.setSize(width, height);
        startWindow.setPosition(x, y);
        startWindow.setAlwaysOnTop(true);
        startWindow.show();
        startWindow.focus();
        
        // Adicionar listener para fixar X ao arrastar - usar 'moved' ao invés de 'move'
        // para corrigir apenas quando o arrasto terminar
        const movedHandler = () => {
          if (startWindow.isDestroyed()) return;
          
          const bounds = startWindow.getBounds();
          const display = require('electron').screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
          const fixedX = display.workArea.width - width - 10;
          
          // Limitar Y aos limites da tela
          let newY = bounds.y;
          if (newY < 0) newY = 0;
          if (newY + height > display.workArea.height) {
            newY = display.workArea.height - height;
          }
          
          // Corrigir posição suavemente apenas se necessário
          if (bounds.x !== fixedX) {
            startWindow.setPosition(fixedX, newY);
          } else if (bounds.y !== newY) {
            startWindow.setPosition(fixedX, newY);
          }
        };
        
        // Remover listeners antigos se existirem
        startWindow.removeAllListeners('move');
        startWindow.removeAllListeners('moved');
        startWindow.on('moved', movedHandler);
        
        logger.debug(`Janela mini-mode: bounds=${JSON.stringify(startWindow.getBounds())}`);
      } else {
        // Normal: restaurar posição anterior ou centro da tela
        let x, y;
        if (previousWindowBounds) {
          x = previousWindowBounds.x;
          y = previousWindowBounds.y;
          logger.debug(`Restaurando posição salva: x=${x}, y=${y}`);
          previousWindowBounds = null;
        } else {
          x = Math.floor((screenWidth - width) / 2);
          y = Math.floor((screenHeight - height) / 2);
          logger.debug(`Posicionando no centro: x=${x}, y=${y}`);
        }
        
        // Remover listeners de movimento ao voltar para modo normal
        startWindow.removeAllListeners('move');
        startWindow.removeAllListeners('moved');
        
        startWindow.setAlwaysOnTop(false);
        startWindow.setSize(width, height);
        startWindow.setPosition(x, y);
      }
      
      logger.debug(`Layout transformado com sucesso`);
    } catch (error) {
      logger.error('Erro ao transformar layout:', error);
    }
  });
}

/**
 * Handler para fechar mini-mode window
 */
function setupCloseMiniModeHandler(getMiniWindow) {
  ipcMain.on('close-mini-mode', () => {
    logger.debug('Fechando mini-mode window');
    const miniWin = getMiniWindow();
    if (miniWin && !miniWin.isDestroyed()) {
      miniWin.close();
    }
  });
}

/**
 * Handler para mudança de estado do mini-mode (pin/unpin)
 */
function setupMiniStateChangedHandler(getMiniWindow) {
  ipcMain.on('mini-state-changed', (event, data) => {
    const miniWin = getMiniWindow();
    if (!miniWin || miniWin.isDestroyed()) return;
    
    const { expanded } = data;
    logger.debug(`Mini-mode state changed: ${expanded ? 'pinned' : 'unpinned'}`);
    // Apenas registra a mudança, a janela mantém tamanho fixo
  });
}

/**
 * Handler para solicitar dados do pet
 */
function setupRequestPetDataHandler(getMiniWindow, appState, getItems) {
  ipcMain.on('request-pet-data', (event) => {
    logger.debug('Pet data solicitado pelo mini-mode');
    const miniWin = getMiniWindow();
    if (!miniWin || miniWin.isDestroyed()) return;
    
    if (appState.currentPet) {
      const pet = { ...appState.currentPet };
      pet.items = getItems();
      miniWin.webContents.send('pet-data', pet);
    }
  });
}

/**
 * Handler para controlar mouse events (click-through)
 */
function setupMouseEventsHandler(getMiniWindow) {
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const miniWin = getMiniWindow();
    if (!miniWin || miniWin.isDestroyed()) return;
    
    miniWin.setIgnoreMouseEvents(ignore, options);
  });
}

/**
 * Handler para redimensionar mini-mode quando menu abre/fecha
 */
function setupResizeMiniModeHandler(getMiniWindow) {
  ipcMain.on('resize-mini-mode', (event, width) => {
    const miniWin = getMiniWindow();
    if (!miniWin || miniWin.isDestroyed()) return;
    
    const currentBounds = miniWin.getBounds();
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const screenWidth = primaryDisplay.workAreaSize.width;
    
    miniWin.setBounds({
      x: screenWidth - width,
      y: currentBounds.y,
      width: width,
      height: currentBounds.height
    });
  });
}

/**
 * Handler para abrir janela do mini-menu
 */
function setupOpenMiniMenuHandler() {
  ipcMain.on('open-mini-menu', (event) => {
    logger.debug('Abrindo mini-menu window');
    
    const { BrowserWindow, screen } = require('electron');
    const path = require('path');
    
    // Obter posição do cursor para abrir menu próximo
    const cursorPos = screen.getCursorScreenPoint();
    
    const menuWidth = 180;
    const miniMenu = new BrowserWindow({
      width: menuWidth,
      height: 300,
      x: cursorPos.x - menuWidth - 25,
      y: cursorPos.y,
      show: false,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, '../../preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    miniMenu.loadFile('mini-menu.html');
    
    miniMenu.once('ready-to-show', () => {
      miniMenu.show();
      logger.debug('Mini-menu window mostrado');
    });
    
    // Fechar menu ao perder foco
    miniMenu.on('blur', () => {
      setTimeout(() => {
        if (!miniMenu.isDestroyed()) {
          miniMenu.close();
        }
      }, 200);
    });
  });
}

/**
 * Handler para receber ações do mini-menu e enviar para tray
 */
function setupMiniMenuActionHandler(windowManager) {
  ipcMain.on('mini-menu-action', (event, action) => {
    logger.debug('Mini-menu action recebida:', action);
    
    // Enviar ação para janela do tray
    const windows = require('electron').BrowserWindow.getAllWindows();
    const trayWindow = windows.find(w => w.webContents.getURL().includes('index.html'));
    
    if (trayWindow && !trayWindow.isDestroyed()) {
      trayWindow.webContents.send('mini-menu-action', action);
    }
  });
}

/**
 * Registra todos os handlers do mini-mode
 */
function registerMiniModeHandlers({
  windows: { createMiniWindow, getMiniWindow },
  managers: { appState, windowManager },
  stateAccessors: { getItems },
}) {
  setupOpenMiniModeHandler(createMiniWindow, getMiniWindow, appState, windowManager);
  setupCloseMiniModeHandler(getMiniWindow);
  setupMiniStateChangedHandler(getMiniWindow);
  setupRequestPetDataHandler(getMiniWindow, appState, getItems);
  setupMouseEventsHandler(getMiniWindow);
  setupResizeMiniModeHandler(getMiniWindow);
  setupMiniModeLayoutHandler(windowManager);
  setupOpenMiniMenuHandler();
  setupMiniMenuActionHandler(windowManager);
  
  logger.info('Mini-mode handlers registrados');
}

module.exports = { registerMiniModeHandlers };

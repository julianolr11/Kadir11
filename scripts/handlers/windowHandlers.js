/**
 * Handlers IPC para operações de gerenciamento de janelas
 * @module handlers/windowHandlers
 */

const { ipcMain, app } = require('electron');
const state = require('../managers/stateManager');
const { createLogger } = require('../utils/logger');

const logger = createLogger('WindowHandlers');

/**
 * Handler para sair do aplicativo
 */
function setupExitAppHandler() {
  ipcMain.on('exit-app', () => {
    logger.info('Encerrando aplicativo');
    app.quit();
  });
}

/**
 * Handler para abrir janela de criar pet
 */
function setupOpenCreatePetWindowHandler(windowManager) {
  ipcMain.on('open-create-pet-window', () => {
    logger.debug('Abrindo janela de criar pet');
    windowManager.createCreatePetWindow();
  });
}

/**
 * Handler para abrir janela de carregar pet
 */
function setupOpenLoadPetWindowHandler(windowManager, updateNestsPosition) {
  ipcMain.on('open-load-pet-window', () => {
    logger.debug('Abrindo janela de carregar pet');

    const loadWin = windowManager.createLoadPetWindow();
    const penWin = windowManager.penWindow;

    if (loadWin && penWin) {
      const lb = loadWin.getBounds();
      penWin.setPosition(lb.x + lb.width, lb.y);
      updateNestsPosition();

      if (!penWin.__nestsMoveListener) {
        const reposition = updateNestsPosition;
        penWin.on('move', reposition);
        penWin.on('resize', reposition);
        penWin.__nestsMoveListener = true;
      }
    } else if (loadWin) {
      windowManager.centerWindow(loadWin);
    }
  });
}

/**
 * Handler para abrir janela do cercado (pen)
 */
function setupOpenPenWindowHandler(
  windowManager,
  getPenInfo,
  getNestCount,
  createNestsWindow,
  closeNestsWindow,
  updateNestsPosition
) {
  ipcMain.on('open-pen-window', () => {
    logger.debug('Abrindo janela do cercado');

    const loadWin = windowManager.loadPetWindow;
    if (!loadWin) {
      logger.warn('Load-pet window não está aberta. Ignorando pedido de abrir cercado.');
      return;
    }

    const info = getPenInfo();
    const dimsMap = {
      small: { w: 4, h: 3 },
      medium: { w: 5, h: 4 },
      large: { w: 7, h: 5 },
    };
    const dims = dimsMap[info.size] || dimsMap.small;
    const w = (dims.w + 2) * 32;
    const h = (dims.h + 2) * 32;
    const border = 5;

    const penWin = windowManager.createPenWindow(w + border, h + border);

    // Sempre criar janela de ninhos (mesmo com 0 para mostrar link de compra)
    createNestsWindow(getNestCount);

    if (penWin) {
      const lb = loadWin.getBounds();
      penWin.setPosition(lb.x + lb.width, lb.y);
      penWin.setSize(w + border, h + border);
      updateNestsPosition();

      if (!penWin.__nestsMoveListener) {
        const reposition = updateNestsPosition;
        penWin.on('move', reposition);
        penWin.on('resize', reposition);
        penWin.__nestsMoveListener = true;
      }

      // Fechar ninhos quando pen fechar
      if (!penWin.__nestsCloseListener) {
        penWin.on('closed', () => {
          closeNestsWindow();
        });
        penWin.__nestsCloseListener = true;
      }
    }
  });
}

/**
 * Handler para fechar janela de criar pet
 */
function setupCloseCreatePetWindowHandler(windowManager) {
  ipcMain.on('close-create-pet-window', () => {
    logger.debug('Fechando janela de criar pet');
    windowManager.closeCreatePetWindow();
  });
}

/**
 * Handler para fechar janela de carregar pet
 */
function setupCloseLoadPetWindowHandler(windowManager, closeNestsWindow) {
  ipcMain.on('close-load-pet-window', () => {
    logger.debug('Fechando janela de carregar pet');
    windowManager.closeLoadPetWindow();
    windowManager.closePenWindow();
    closeNestsWindow();
  });
}

/**
 * Handler para fechar janela do cercado
 */
function setupClosePenWindowHandler(windowManager, closeNestsWindow) {
  ipcMain.on('close-pen-window', () => {
    logger.debug('Fechando janela do cercado');
    windowManager.closePenWindow();
    closeNestsWindow();
  });
}

/**
 * Handler para abrir janela de chocagem
 */
function setupOpenHatchWindowHandler(createHatchWindow) {
  ipcMain.on('open-hatch-window', () => {
    logger.debug('Abrindo janela de chocagem');
    createHatchWindow();
  });
}

/**
 * Handler para fechar janela de chocagem
 */
function setupCloseHatchWindowHandler(closeHatchWindow) {
  ipcMain.on('close-hatch-window', () => {
    logger.debug('Fechando janela de chocagem');
    closeHatchWindow();
  });
}

/**
 * Handler para abrir janela inicial (start)
 */
function setupOpenStartWindowHandler(windowManager) {
  ipcMain.on('open-start-window', () => {
    logger.debug('Abrindo janela inicial');
    windowManager.createStartWindow();
  });
}

/**
 * Handler para fechar janela inicial
 */
function setupCloseStartWindowHandler(windowManager) {
  ipcMain.on('close-start-window', () => {
    logger.debug('Fechando janela inicial');
    windowManager.closeStartWindow();
  });
}

/**
 * Handler para abrir janela da bandeja (tray)
 */
function setupOpenTrayWindowHandler(windowManager) {
  ipcMain.on('open-tray-window', () => {
    logger.debug('Abrindo janela da bandeja');
    windowManager.createTrayWindow();
  });
}

/**
 * Handler para abrir janela de status
 */
function setupOpenStatusWindowHandler(windowManager, getItems) {
  ipcMain.on('open-status-window', () => {
    logger.debug('Abrindo janela de status');

    if (!state.hasPet()) {
      logger.error('Nenhum pet selecionado para abrir status');
      return;
    }

    const statusWindow = windowManager.createStatusWindow();
    statusWindow.webContents.on('did-finish-load', () => {
      const petWithItems = {
        ...state.currentPet,
        items: getItems(),
      };
      logger.debug('Enviando pet-data para status window');
      statusWindow.webContents.send('pet-data', petWithItems);
    });
  });
}

/**
 * Handler para abrir janela de presentes
 */
function setupOpenGiftWindowHandler(windowManager) {
  ipcMain.on('open-gift-window', () => {
    logger.debug('Abrindo janela de presentes');
    windowManager.createGiftWindow();
  });
}

/**
 * Handler para fechar janela de presentes
 */
function setupCloseGiftWindowHandler(windowManager) {
  ipcMain.on('close-gift-window', () => {
    logger.debug('Fechando janela de presentes');
    windowManager.closeGiftWindow();
  });
}

/**
 * Registra todos os handlers de janelas
 */
function registerWindowHandlers(
  windowManager,
  getPenInfo,
  getNestCount,
  getItems,
  createNestsWindow,
  closeNestsWindow,
  createHatchWindow,
  closeHatchWindow,
  updateNestsPosition
) {
  logger.info('Registrando Window Handlers');

  setupExitAppHandler();
  setupOpenCreatePetWindowHandler(windowManager);
  setupOpenLoadPetWindowHandler(windowManager, updateNestsPosition);
  setupOpenPenWindowHandler(
    windowManager,
    getPenInfo,
    getNestCount,
    createNestsWindow,
    closeNestsWindow,
    updateNestsPosition
  );
  setupCloseCreatePetWindowHandler(windowManager);
  setupCloseLoadPetWindowHandler(windowManager, closeNestsWindow);
  setupClosePenWindowHandler(windowManager, closeNestsWindow);
  setupOpenHatchWindowHandler(createHatchWindow);
  setupCloseHatchWindowHandler(closeHatchWindow);
  setupOpenStartWindowHandler(windowManager);
  setupCloseStartWindowHandler(windowManager);
  setupOpenTrayWindowHandler(windowManager);
  setupOpenStatusWindowHandler(windowManager, getItems);
  setupOpenGiftWindowHandler(windowManager);
  setupCloseGiftWindowHandler(windowManager);

  logger.info('Window Handlers registrados com sucesso');
}

module.exports = { registerWindowHandlers };

const { BrowserWindow, screen } = require('electron');
const path = require('path');

function fadeInWindow(win) {
  if (!win) return;
  win.setOpacity(0);
  win.show();
  let opacity = 0;
  const step = 0.05;
  const interval = setInterval(() => {
    if (win.isDestroyed()) {
      clearInterval(interval);
      return;
    }
    opacity += step;
    if (opacity >= 1) {
      win.setOpacity(1);
      clearInterval(interval);
    } else {
      win.setOpacity(opacity);
    }
  }, 16);
}

function fadeOutAndDestroy(win) {
  if (!win) return;
  let opacity = win.getOpacity();
  const step = 0.05;
  const interval = setInterval(() => {
    if (win.isDestroyed()) {
      clearInterval(interval);
      return;
    }
    opacity -= step;
    if (opacity <= 0) {
      clearInterval(interval);
      win.removeAllListeners('close');
      win.destroy();
    } else {
      win.setOpacity(opacity);
    }
  }, 16);
}

function animateMove(win, targetX, targetY) {
  if (!win) return;
  const { x: startX, y: startY } = win.getBounds();
  const duration = 300; // ms
  const frames = Math.max(1, Math.round(duration / 16));
  let frame = 0;
  const deltaX = (targetX - startX) / frames;
  const deltaY = (targetY - startY) / frames;
  const interval = setInterval(() => {
    if (win.isDestroyed()) {
      clearInterval(interval);
      return;
    }
    frame++;
    const newX = Math.round(startX + deltaX * frame);
    const newY = Math.round(startY + deltaY * frame);
    win.setPosition(newX, newY);
    if (frame >= frames) {
      win.setPosition(targetX, targetY);
      clearInterval(interval);
    }
  }, 16);
}

function attachFadeHandlers(win) {
  if (!win) return;
  win.once('ready-to-show', () => fadeInWindow(win));
  win.on('close', (e) => {
    if (win.__fading) return;
    e.preventDefault();
    win.__fading = true;
    fadeOutAndDestroy(win);
  });
}

function centerWindowAnimated(win) {
  if (!win) return;
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const bounds = win.getBounds();
  const targetX = Math.round((screenWidth - bounds.width) / 2);
  const targetY = Math.round((screenHeight - bounds.height) / 2);
  animateMove(win, targetX, targetY);
}
function centerSideBySide(winLeft, winRight) {
  if (!winLeft || !winRight) return;
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const b1 = winLeft.getBounds();
  const b2 = winRight.getBounds();
  const totalW = b1.width + b2.width;
  const startX = Math.round((screenWidth - totalW) / 2);
  const startY = Math.round((screenHeight - Math.max(b1.height, b2.height)) / 2);
  animateMove(winLeft, startX, startY);
  animateMove(winRight, startX + b1.width, startY);
}

function centerVertical(winTop, winBottom) {
  if (!winTop || !winBottom) return;
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const b1 = winTop.getBounds();
  const b2 = winBottom.getBounds();
  const totalH = b1.height + b2.height;
  const startX = Math.round((screenWidth - Math.max(b1.width, b2.width)) / 2);
  const startY = Math.round((screenHeight - totalH) / 2);
  animateMove(winTop, startX, startY);
  animateMove(winBottom, startX, startY + b1.height);
}

class WindowManager {
  centerWindow(win) {
    centerWindowAnimated(win);
  }

  centerWindowsSideBySide(winLeft, winRight) {
    centerSideBySide(winLeft, winRight);
  }

  centerWindowsVertically(winTop, winBottom) {
    centerVertical(winTop, winBottom);
  }

  // Criar a janela inicial (start.html)
  createStartWindow() {
    if (this.startWindow) {
      this.startWindow.focus();
      return this.startWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');
    this.startWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.startWindow.loadFile('views/setup/start.html');
    attachFadeHandlers(this.startWindow);
    this.startWindow.on('closed', () => {
      this.startWindow = null;
    });

    return this.startWindow;
  }

  // Pegar a startWindow
  getStartWindow() {
    return this.startWindow;
  }

  // Fechar a startWindow
  closeStartWindow() {
    if (this.startWindow) {
      this.startWindow.close();
    }
  }

  // Criar a janela de criação de pet (create-pet.html)
  createCreatePetWindow() {
    if (this.createPetWindow) {
      this.createPetWindow.focus();
      return this.createPetWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');
    this.createPetWindow = new BrowserWindow({
      width: 600,
      height: 400,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.createPetWindow.loadFile('views/setup/create-pet.html');
    attachFadeHandlers(this.createPetWindow);
    this.createPetWindow.on('closed', () => {
      this.createPetWindow = null;
    });

    return this.createPetWindow;
  }

  // Fechar a createPetWindow
  closeCreatePetWindow() {
    if (this.createPetWindow) {
      this.createPetWindow.close();
    }
  }

  // Obter a createPetWindow
  getCreatePetWindow() {
    return this.createPetWindow;
  }

  // Criar a janela de carregar pet (load-pet.html)
  createLoadPetWindow() {
    if (this.loadPetWindow) {
      this.loadPetWindow.focus();
      return this.loadPetWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');
    this.loadPetWindow = new BrowserWindow({
      width: 600,
      height: 430,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.loadPetWindow.loadFile('views/setup/load-pet.html');
    attachFadeHandlers(this.loadPetWindow);
    this.loadPetWindow.on('closed', () => {
      this.loadPetWindow = null;
    });

    return this.loadPetWindow;
  }

  // Fechar a loadPetWindow
  closeLoadPetWindow() {
    if (this.loadPetWindow) {
      this.loadPetWindow.close();
    }
  }

  // Criar a bandeja (index.html)
  createTrayWindow() {
    if (this.trayWindow) {
      this.trayWindow.focus();
      return this.trayWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');

    // Pegar as dimensões da tela principal
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Definir o tamanho da janela
    const windowWidth = 256;
    const windowHeight = 256;

    // Calcular a posição no canto inferior direito (com uma margem de 10px)
    const margin = 10;
    const x = screenWidth - windowWidth - margin;
    const y = screenHeight - windowHeight - margin;

    this.trayWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: x, // Posição X (canto direito)
      y: y, // Posição Y (canto inferior)
      frame: false,
      transparent: true,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.trayWindow.loadFile('index.html');
    attachFadeHandlers(this.trayWindow);
    this.trayWindow.on('closed', () => {
      this.trayWindow = null;
    });

    return this.trayWindow;
  }

  // Fechar a trayWindow
  closeTrayWindow() {
    if (this.trayWindow) {
      this.trayWindow.close();
    }
  }

  // Criar a janela de status (status.html)
  createStatusWindow() {
    if (this.statusWindow) {
      this.statusWindow.focus();
      return this.statusWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');
    this.statusWindow = new BrowserWindow({
      width: 400,
      height: 500,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.statusWindow.loadFile('views/management/status.html');
    this.statusWindow.once('ready-to-show', () => {
      centerWindowAnimated(this.statusWindow);
    });
    attachFadeHandlers(this.statusWindow);
    this.statusWindow.on('closed', () => {
      this.statusWindow = null;
    });

    return this.statusWindow;
  }
  // Criar a janela do cercado (pen.html)
  createPenWindow(width, height) {
    if (this.penWindow) {
      this.penWindow.focus();
      return this.penWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');
    this.penWindow = new BrowserWindow({
      width: width || 370,
      height: height || 300,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.penWindow.loadFile('views/management/pen.html');
    attachFadeHandlers(this.penWindow);
    this.penWindow.on('closed', () => {
      this.penWindow = null;
    });

    return this.penWindow;
  }

  // Fechar a penWindow
  closePenWindow() {
    if (this.penWindow) {
      this.penWindow.close();
    }
  }

  // Fechar a statusWindow
  closeStatusWindow() {
    if (this.statusWindow) {
      this.statusWindow.close();
    }
  }
  // Criar a janela de presentes (gift.html)
  createGiftWindow() {
    if (this.giftWindow) {
      this.giftWindow.focus();
      return this.giftWindow;
    }

    const preloadPath = path.join(__dirname, '..', 'preload.js');
    this.giftWindow = new BrowserWindow({
      width: 400,
      height: 500,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.giftWindow.loadFile('views/management/gift.html');
    this.giftWindow.once('ready-to-show', () => {
      centerWindowAnimated(this.giftWindow);
    });
    attachFadeHandlers(this.giftWindow);
    this.giftWindow.on('closed', () => {
      this.giftWindow = null;
    });

    return this.giftWindow;
  }

  // Fechar a giftWindow
  closeGiftWindow() {
    if (this.giftWindow) {
      this.giftWindow.close();
    }
  }

  // Obter a giftWindow
  getGiftWindow() {
    return this.giftWindow;
  }
}

const windowManagerInstance = new WindowManager();

// Exportar a instância e as funções utilitárias
module.exports = windowManagerInstance;
module.exports.attachFadeHandlers = attachFadeHandlers;
module.exports.centerWindowAnimated = centerWindowAnimated;
module.exports.centerSideBySide = centerSideBySide;
module.exports.animateMove = animateMove;
module.exports.fadeInWindow = fadeInWindow;
module.exports.fadeOutAndDestroy = fadeOutAndDestroy;

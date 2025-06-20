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

function animateMove(win, startX, startY, endX, endY, duration = 300) {
    return new Promise((resolve) => {
        if (!win) {
            resolve();
            return;
        }

        const frames = Math.max(1, Math.round(duration / 16));
        let frame = 0;
        win.setPosition(Math.round(startX), Math.round(startY));
        const interval = setInterval(() => {
            if (win.isDestroyed()) {
                clearInterval(interval);
                resolve();
                return;
            }

            frame += 1;
            const progress = Math.min(frame / frames, 1);
            const x = Math.round(startX + (endX - startX) * progress);
            const y = Math.round(startY + (endY - startY) * progress);
            win.setPosition(x, y);

            if (progress >= 1) {
                clearInterval(interval);
                resolve();
            }
        }, 16);
    });
}

class WindowManager {
    constructor() {
        this.startWindow = null;
        this.createPetWindow = null;
        this.loadPetWindow = null;
        this.trayWindow = null;
        this.statusWindow = null;
    }

    attachFadeHandlers(win) {
        attachFadeHandlers(win);
    }

    animateMove(win, startX, startY, endX, endY, duration = 300) {
        return animateMove(win, startX, startY, endX, endY, duration);
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

        this.startWindow.loadFile('start.html');
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

        this.createPetWindow.loadFile('create-pet.html');
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

    // Criar a janela de carregar pet (load-pet.html)
    createLoadPetWindow() {
        if (this.loadPetWindow) {
            this.loadPetWindow.focus();
            return this.loadPetWindow;
        }

        const preloadPath = path.join(__dirname, '..', 'preload.js');
        this.loadPetWindow = new BrowserWindow({
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

        this.loadPetWindow.loadFile('load-pet.html');
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

        this.statusWindow.loadFile('status.html');
        attachFadeHandlers(this.statusWindow);
        this.statusWindow.on('closed', () => {
            this.statusWindow = null;
        });

        return this.statusWindow;
    }

    // Fechar a statusWindow
    closeStatusWindow() {
        if (this.statusWindow) {
            this.statusWindow.close();
        }
    }
}

module.exports = new WindowManager();
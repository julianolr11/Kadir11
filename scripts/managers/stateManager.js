/**
 * Gerenciador de estado global do Kadir11
 * @module managers/stateManager
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('StateManager');

class StateManager {
  constructor() {
    this._currentPet = null;
    this._windows = new Map();
    this._lastUpdate = Date.now();
  }

  /**
   * Obtém o pet atual
   * @returns {Object|null} Pet atual ou null
   */
  get currentPet() {
    return this._currentPet;
  }

  /**
   * Define o pet atual
   * @param {Object|null} pet - Pet para definir como atual
   * @throws {Error} Se pet for inválido
   */
  set currentPet(pet) {
    if (pet && (!pet.petId || !pet.name)) {
      throw new Error('Pet inválido: deve ter petId e name');
    }

    const oldPet = this._currentPet;
    this._currentPet = pet;

    if (pet) {
      logger.info(`Pet selecionado: ${pet.name} (${pet.petId})`);
    } else {
      logger.info('Pet desselecionado');
    }

    // Broadcast mudança para todas as janelas
    if (pet !== oldPet) {
      this.broadcast('pet-data', pet);
    }
  }

  /**
   * Verifica se há um pet selecionado
   * @returns {boolean}
   */
  hasPet() {
    return this._currentPet !== null;
  }

  /**
   * Registra uma janela no state manager
   * @param {string} name - Nome identificador da janela
   * @param {BrowserWindow} window - Instância da janela
   */
  registerWindow(name, window) {
    if (!window) {
      logger.warn(`Tentativa de registrar janela ${name} nula`);
      return;
    }

    this._windows.set(name, window);
    logger.debug(`Janela registrada: ${name}`);

    // Remove do map quando destruída
    window.on('closed', () => {
      this._windows.delete(name);
      logger.debug(`Janela removida: ${name}`);
    });
  }

  /**
   * Obtém uma janela registrada
   * @param {string} name - Nome da janela
   * @returns {BrowserWindow|undefined}
   */
  getWindow(name) {
    return this._windows.get(name);
  }

  /**
   * Verifica se uma janela existe e está aberta
   * @param {string} name - Nome da janela
   * @returns {boolean}
   */
  hasWindow(name) {
    const window = this._windows.get(name);
    return window && !window.isDestroyed();
  }

  /**
   * Fecha uma janela específica
   * @param {string} name - Nome da janela
   */
  closeWindow(name) {
    const window = this._windows.get(name);
    if (window && !window.isDestroyed()) {
      window.close();
      logger.debug(`Janela fechada: ${name}`);
    }
  }

  /**
   * Fecha todas as janelas registradas
   */
  closeAllWindows() {
    logger.info(`Fechando ${this._windows.size} janelas`);

    this._windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });

    this._windows.clear();
  }

  /**
   * Envia mensagem para todas as janelas
   * @param {string} channel - Canal IPC
   * @param {any} data - Dados para enviar
   */
  broadcast(channel, data) {
    let count = 0;

    this._windows.forEach((window, name) => {
      if (!window.isDestroyed()) {
        try {
          window.webContents.send(channel, data);
          count++;
        } catch (err) {
          logger.error(`Erro ao enviar ${channel} para ${name}:`, err.message);
        }
      }
    });

    if (count > 0) {
      logger.debug(`Broadcast ${channel} para ${count} janelas`);
    }
  }

  /**
   * Atualiza timestamp do último update
   */
  updateTimestamp() {
    this._lastUpdate = Date.now();
  }

  /**
   * Obtém timestamp do último update
   * @returns {number}
   */
  get lastUpdate() {
    return this._lastUpdate;
  }

  /**
   * Lista todas as janelas registradas
   * @returns {string[]}
   */
  listWindows() {
    return Array.from(this._windows.keys());
  }

  /**
   * Reseta o estado (útil para testes)
   */
  reset() {
    this.closeAllWindows();
    this._currentPet = null;
    this._lastUpdate = Date.now();
    logger.info('Estado resetado');
  }
}

// Singleton - uma única instância compartilhada
const state = new StateManager();

module.exports = state;

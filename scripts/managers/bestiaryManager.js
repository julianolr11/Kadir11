/**
 * Bestiário - Sistema de rastreamento de criaturas descobertas/capturadas
 * @module managers/bestiaryManager
 */

const Store = require('electron-store');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BestiaryManager');
const bestiaryStore = new Store({ name: 'bestiary' });

/**
 * Estrutura do bestiário:
 * {
 *   "Draconídeo": { status: "owned", firstSeen: "2025-11-30T..." },
 *   "Drazraq": { status: "seen", firstSeen: "2025-11-30T..." },
 *   ...
 * }
 * 
 * Status:
 * - undefined/null: não descoberto (? no bestiário)
 * - "seen": visto em batalha (50% opacidade)
 * - "owned": capturado/criado (100% opacidade)
 */

/**
 * Marca criatura como vista em batalha
 */
function markAsSeen(specieName) {
  if (!specieName) return;
  
  const current = bestiaryStore.get(specieName);
  if (current?.status === 'owned') {
    // Já possui, não altera
    return;
  }
  
  bestiaryStore.set(specieName, {
    status: 'seen',
    firstSeen: current?.firstSeen || new Date().toISOString(),
  });
  
  logger.debug(`Criatura vista: ${specieName}`);
}

/**
 * Marca criatura como capturada/criada
 */
function markAsOwned(specieName) {
  if (!specieName) return;
  
  const current = bestiaryStore.get(specieName);
  bestiaryStore.set(specieName, {
    status: 'owned',
    firstSeen: current?.firstSeen || new Date().toISOString(),
    firstOwned: current?.firstOwned || new Date().toISOString(),
  });
  
  logger.debug(`Criatura capturada: ${specieName}`);
}

/**
 * Retorna status de uma criatura
 */
function getStatus(specieName) {
  return bestiaryStore.get(specieName) || { status: null };
}

/**
 * Retorna todos os dados do bestiário
 */
function getAllData() {
  return bestiaryStore.store;
}

/**
 * Limpa todo o bestiário (debug/reset)
 */
function reset() {
  bestiaryStore.clear();
  logger.info('Bestiário resetado');
}

module.exports = {
  markAsSeen,
  markAsOwned,
  getStatus,
  getAllData,
  reset,
};

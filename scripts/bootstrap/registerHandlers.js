// Fase 3 Refactor: Bootstrap único de registro de handlers (assinatura agrupada - compatível legado)
/**
 * Nova assinatura agrupada (recomendada):
 * registerAllHandlers({
 *   electron: { ipcMain, BrowserWindow },
 *   managers: { windowManager, appState, petManager },
 *   store: { store },
 *   stateAccessors: { getCoins, setCoins, getItems, setItems, getPenInfo, getNestCount, getNestPrice, getNestsData, setNestsData, broadcastPenUpdate, broadcastNestUpdate, getDifficulty, setDifficulty },
 *   petGeneration: { generateRarity, generatePetFromEgg, getSpeciesData, baseDir },
 *   cache: { journeyImagesCacheRef },
 *   windows: { createBattleModeWindow, createJourneyModeWindow, createJourneySceneWindow, createLairModeWindow, createTrainWindow, createTrainMenuWindow, createTrainAttributesWindow, createTrainForceWindow, createTrainDefenseWindow, createItemsWindow, createStoreWindow, createNestsWindow, createHatchWindow, updateNestsPosition, getStoreWindow, getItemsWindow, getHatchWindow, closeAllGameWindows },
 *   xp: { xpUtils },
 *   handlers: { registerWindowHandlers, registerPetHandlers, registerStoreHandlers, registerGameHandlers, registerMovesHandlers, registerSettingsHandlers, registerAssetsHandlers, registerLifecycleHandlers, setupWindowPositioningHandlers, setupNestHandlers, setupBattleMechanicsHandlers }
 * })
 *
 * Formato legado ainda suportado: objeto flatten como antes.
 */
function registerAllHandlers(config) {
  // Detecta formato novo (agrupado) vs legado
  let windowManager, appState, store, petManager, ipcMain, BrowserWindow;
  let getCoins,
    setCoins,
    getItems,
    setItems,
    getPenInfo,
    getNestCount,
    getNestPrice,
    getNestsData,
    setNestsData,
    broadcastPenUpdate,
    broadcastNestUpdate,
    getDifficulty,
    setDifficulty;
  let generateRarity, generatePetFromEgg, getSpeciesData, journeyImagesCacheRef, baseDir;
  let createBattleModeWindow,
    createJourneyModeWindow,
    createJourneySceneWindow,
    createLairModeWindow,
    createTrainWindow,
    createTrainMenuWindow,
    createTrainAttributesWindow,
    createTrainForceWindow,
    createTrainDefenseWindow,
    createItemsWindow,
    createStoreWindow,
    createNestsWindow,
    createHatchWindow,
    createBestiaryWindow,
    createPetManagerWindow,
    createMiniWindow,
    updateNestsPosition,
    closeNestsWindow,
    getStoreWindow,
    getItemsWindow,
    getHatchWindow,
    getBestiaryWindow,
    getMiniWindow,
    closeAllGameWindows;
  let xpUtils;
  let registerWindowHandlers,
    registerPetHandlers,
    registerStoreHandlers,
    registerGameHandlers,
    registerMovesHandlers,
    registerSettingsHandlers,
    registerAssetsHandlers,
    registerLifecycleHandlers,
    registerBestiaryHandlers,
    registerPetManagerHandlers,
    setupWindowPositioningHandlers,
    setupNestHandlers,
    setupBattleMechanicsHandlers;

  if (config.electron) {
    ({ ipcMain, BrowserWindow } = config.electron);
    ({ windowManager, appState, petManager } = config.managers);
    ({ store } = config.store);
    ({
      getCoins,
      setCoins,
      getItems,
      setItems,
      getPenInfo,
      getNestCount,
      getNestPrice,
      getNestsData,
      setNestsData,
      broadcastPenUpdate,
      broadcastNestUpdate,
      getDifficulty,
      setDifficulty,
    } = config.stateAccessors);
    ({ generateRarity, generatePetFromEgg, getSpeciesData, baseDir } = config.petGeneration);
    ({ journeyImagesCacheRef } = config.cache);
    ({
      createBattleModeWindow,
      createJourneyModeWindow,
      createJourneySceneWindow,
      createLairModeWindow,
      createTrainWindow,
      createTrainMenuWindow,
      createTrainAttributesWindow,
      createTrainForceWindow,
      createTrainDefenseWindow,
      createItemsWindow,
      createStoreWindow,
      createNestsWindow,
      createHatchWindow,
      createBestiaryWindow,
      createPetManagerWindow,
      createMiniWindow,
      updateNestsPosition,
      closeNestsWindow,
      getStoreWindow,
      getItemsWindow,
      getHatchWindow,
      getBestiaryWindow,
      getMiniWindow,
      closeAllGameWindows,
    } = config.windows);
    ({ xpUtils } = config.xp);
    ({
      registerWindowHandlers,
      registerPetHandlers,
      registerStoreHandlers,
      registerGameHandlers,
      registerMovesHandlers,
      registerSettingsHandlers,
      registerAssetsHandlers,
      registerLifecycleHandlers,
      registerBestiaryHandlers,
      registerPetManagerHandlers,
      setupWindowPositioningHandlers,
      setupNestHandlers,
      setupBattleMechanicsHandlers,
    } = config.handlers);
  } else {
    ({
      windowManager,
      appState,
      store,
      petManager,
      ipcMain,
      BrowserWindow,
      getCoins,
      setCoins,
      getItems,
      setItems,
      getPenInfo,
      getNestCount,
      getNestPrice,
      getNestsData,
      setNestsData,
      broadcastPenUpdate,
      broadcastNestUpdate,
      getDifficulty,
      setDifficulty,
      generateRarity,
      generatePetFromEgg,
      getSpeciesData,
      journeyImagesCacheRef,
      baseDir,
      createBattleModeWindow,
      createJourneyModeWindow,
      createJourneySceneWindow,
      createLairModeWindow,
      createTrainWindow,
      createTrainMenuWindow,
      createTrainAttributesWindow,
      createTrainForceWindow,
      createTrainDefenseWindow,
      createItemsWindow,
      createStoreWindow,
      createNestsWindow,
      createHatchWindow,
      updateNestsPosition,
      getStoreWindow,
      getItemsWindow,
      getHatchWindow,
      closeAllGameWindows,
      xpUtils,
      registerWindowHandlers,
      registerPetHandlers,
      registerStoreHandlers,
      registerGameHandlers,
      registerMovesHandlers,
      registerSettingsHandlers,
      registerAssetsHandlers,
      registerLifecycleHandlers,
      setupWindowPositioningHandlers,
      setupNestHandlers,
      setupBattleMechanicsHandlers,
    } = config);
  }

  // 1. Handlers de janela básicos
  registerWindowHandlers(
    windowManager,
    getPenInfo,
    getNestCount,
    getItems,
    createNestsWindow,
    closeNestsWindow,
    createHatchWindow,
    () => {},
    updateNestsPosition
  );

  // 2. Pet handlers (seleção/criação/rename/delete)
  registerPetHandlers(windowManager, getItems, getCoins, broadcastPenUpdate, closeAllGameWindows);

  // 3. Store / economia / itens / gift codes
  registerStoreHandlers({
    getCurrentPet: () => appState.currentPet,
    getCoins,
    setCoins,
    getItems,
    setItems,
    getNestPrice,
    getNestCount,
    broadcastPenUpdate,
    broadcastNestUpdate,
    petManager,
    store,
    windowManager,
  });

  // 4. Jogo (batalha / jornada / treino / lair)
  registerGameHandlers({
    getCurrentPet: () => appState.currentPet,
    petManager,
    windowManager,
    createBattleModeWindow,
    createJourneyModeWindow,
    createJourneySceneWindow,
    createLairModeWindow,
    createTrainWindow,
    createTrainMenuWindow,
    createTrainAttributesWindow,
    createTrainForceWindow,
    createTrainDefenseWindow,
    createBestiaryWindow,
    getRandomEnemyIdle: require('../utils/idleAssets').getRandomEnemyIdle,
    resolveIdleGif: require('../utils/idleAssets').resolveIdleGif,
    extractElementFromPath: require('../utils/idleAssets').extractElementFromPath,
    xpUtils,
    storeFns: { getItems, setItems, getCoins, setCoins },
  });

  // 5. Moves (aprender golpes)
  registerMovesHandlers({ getCurrentPet: () => appState.currentPet, petManager });

  // 6. Settings / dificuldade / pen / nests
  registerSettingsHandlers({
    store,
    getPenInfo,
    getNestCount,
    getNestPrice,
    getNestsData,
    getDifficulty,
    setDifficulty,
  });

  // 7. Assets (species info + journey images cache)
  registerAssetsHandlers({
    loadSpeciesData: () => {},
    getSpeciesData: () => getSpeciesData(),
    getJourneyImagesCache: () => journeyImagesCacheRef.value,
    setJourneyImagesCache: (cache) => {
      journeyImagesCacheRef.value = cache;
    },
    baseDir,
  });

  // 8. Lifecycle (timers)
  const { resetTimers } = registerLifecycleHandlers({
    ipcMain,
    getCurrentPet: () => appState.currentPet,
    petManager,
    BrowserWindow,
  });
  global.resetTimers = resetTimers;

  // 9. Window positioning (alinhamento / resize / abrir items/store)
  setupWindowPositioningHandlers({
    createItemsWindow,
    createStoreWindow,
    getStoreWindow,
    getItemsWindow,
    getCurrentPet: () => appState.currentPet,
    getCoins,
    getItems,
  });

  // 10. Nests / hatching
  setupNestHandlers({
    getCurrentPet: () => appState.currentPet,
    getItems,
    setItems,
    getNestCount,
    getNestsData,
    setNestsData,
    generateRarity,
    generatePetFromEgg,
    petManager,
    broadcastPenUpdate,
    getHatchWindow,
  });

  // 11. Battle mechanics (stats em combate)
  setupBattleMechanicsHandlers({ getCurrentPet: () => appState.currentPet, petManager });

  // 12. Bestiário (descoberta de criaturas)
  registerBestiaryHandlers(windowManager);

  // 13. Sistema de Essências
  const { registerEssenceHandlers, enhanceDeletePetHandler } = require('../handlers/essenceHandlers');
  registerEssenceHandlers({
    electron: { ipcMain, BrowserWindow },
    managers: { appState, petManager },
    store: { store }
  });
  enhanceDeletePetHandler({
    electron: { ipcMain, BrowserWindow },
    managers: { appState, petManager },
    store: { store }
  });

  // 14. Pet Manager (modo desenvolvedor)
  registerPetManagerHandlers({ windows: { createPetManagerWindow } });

  // 15. Mini Mode (barra lateral)
  const { registerMiniModeHandlers } = require('../handlers/miniModeHandlers');
  registerMiniModeHandlers({
    windows: { createMiniWindow, getMiniWindow },
    managers: { appState, windowManager },
    stateAccessors: { getItems },
  });

  return { resetTimers };
}

module.exports = { registerAllHandlers };

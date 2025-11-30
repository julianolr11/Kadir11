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
    updateNestsPosition,
    closeNestsWindow,
    getStoreWindow,
    getItemsWindow,
    getHatchWindow,
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
      updateNestsPosition,
      closeNestsWindow,
      getStoreWindow,
      getItemsWindow,
      getHatchWindow,
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

  return { resetTimers };
}

module.exports = { registerAllHandlers }; // Fase 3 Refactor: Bootstrap único de registro de handlers\n\nfunction registerAllHandlers({\n  windowManager,\n  state,\n  appState,\n  store,\n  petManager,\n  ipcMain,\n  BrowserWindow,\n  // state accessors\n  getCoins, setCoins, getItems, setItems, getPenInfo, getNestCount, getNestPrice, getNestsData, setNestsData,\n  broadcastPenUpdate, broadcastNestUpdate, getDifficulty, setDifficulty,\n  // species / pet generation\n  generateRarity, generatePetFromEgg, getSpeciesData, journeyImagesCacheRef, baseDir,\n  // game windows api\n  createBattleModeWindow, createJourneyModeWindow, createJourneySceneWindow, createLairModeWindow,\n  createTrainWindow, createTrainMenuWindow, createTrainAttributesWindow, createTrainForceWindow, createTrainDefenseWindow,\n  createItemsWindow, createStoreWindow, createNestsWindow, createHatchWindow, updateNestsPosition, getStoreWindow, getItemsWindow, getHatchWindow, closeAllGameWindows,\n  // xp utils\n  xpUtils,\n  // handlers modules\n  registerWindowHandlers, registerPetHandlers, registerStoreHandlers, registerGameHandlers, registerMovesHandlers, registerSettingsHandlers, registerAssetsHandlers, registerLifecycleHandlers, setupWindowPositioningHandlers, setupNestHandlers, setupBattleMechanicsHandlers\n}) {\n  // 1. Handlers de janela básicos\n  registerWindowHandlers(\n    windowManager,\n    getPenInfo,\n    getNestCount,\n    getItems,\n    createNestsWindow,\n    () => {},\n    createHatchWindow,\n    () => {},\n    updateNestsPosition\n  );\n\n  // 2. Pet handlers (seleção/criação/rename/delete)\n  registerPetHandlers(\n    windowManager,\n    getItems,\n    getCoins,\n    broadcastPenUpdate,\n    closeAllGameWindows\n  );\n\n  // 3. Store / economia / itens / gift codes\n  registerStoreHandlers({\n    getCurrentPet: () => appState.currentPet,\n    getCoins, setCoins, getItems, setItems, getNestPrice, getNestCount, broadcastPenUpdate, broadcastNestUpdate, petManager, store, windowManager\n  });\n\n  // 4. Jogo (batalha / jornada / treino / lair)\n  registerGameHandlers({\n    getCurrentPet: () => appState.currentPet,\n    petManager,\n    windowManager,\n    createBattleModeWindow,\n    createJourneyModeWindow,\n    createJourneySceneWindow,\n    createLairModeWindow,\n    createTrainWindow,\n    createTrainMenuWindow,\n    createTrainAttributesWindow,\n    createTrainForceWindow,\n    createTrainDefenseWindow,\n    getRandomEnemyIdle: require('../utils/idleAssets').getRandomEnemyIdle,\n    resolveIdleGif: require('../utils/idleAssets').resolveIdleGif,\n    extractElementFromPath: require('../utils/idleAssets').extractElementFromPath,\n    xpUtils,\n    storeFns: { getItems, setItems, getCoins, setCoins }\n  });\n\n  // 5. Moves (aprender golpes)\n  registerMovesHandlers({ getCurrentPet: () => appState.currentPet, petManager });\n\n  // 6. Settings / dificuldade / pen / nests\n  registerSettingsHandlers({ store, getPenInfo, getNestCount, getNestPrice, getNestsData, getDifficulty, setDifficulty });\n\n  // 7. Assets (species info + journey images cache)\n  registerAssetsHandlers({\n    loadSpeciesData: () => {},\n    getSpeciesData: () => getSpeciesData(),\n    getJourneyImagesCache: () => journeyImagesCacheRef.value,\n    setJourneyImagesCache: (cache) => { journeyImagesCacheRef.value = cache; },\n    baseDir\n  });\n\n  // 8. Lifecycle (timers)\n  const { resetTimers } = registerLifecycleHandlers({\n    ipcMain,\n    getCurrentPet: () => appState.currentPet,\n    petManager,\n    BrowserWindow\n  });\n  global.resetTimers = resetTimers;\n\n  // 9. Window positioning (alinhamento / resize / abrir items/store)\n  setupWindowPositioningHandlers({\n    createItemsWindow,\n    createStoreWindow,\n    getStoreWindow,\n    getItemsWindow,\n    getCurrentPet: () => appState.currentPet,\n    getCoins,\n    getItems\n  });\n\n  // 10. Nests / hatching\n  setupNestHandlers({\n    getCurrentPet: () => appState.currentPet,\n    getItems, setItems, getNestCount, getNestsData, setNestsData, generateRarity, generatePetFromEgg, petManager, broadcastPenUpdate, getHatchWindow\n  });\n\n  // 11. Battle mechanics (stats em combate)\n  setupBattleMechanicsHandlers({ getCurrentPet: () => appState.currentPet, petManager });\n\n  return { resetTimers };\n}\n\nmodule.exports = { registerAllHandlers };\n

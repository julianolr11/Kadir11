// Aggregated export of all handler registration functions (Phase 3 cleanup)
module.exports = {
  registerWindowHandlers: require('./windowHandlers').registerWindowHandlers,
  registerPetHandlers: require('./petHandlers').registerPetHandlers,
  registerStoreHandlers: require('./storeHandlers').registerStoreHandlers,
  registerGameHandlers: require('./gameHandlers').registerGameHandlers,
  registerMovesHandlers: require('./movesHandlers').registerMovesHandlers,
  registerSettingsHandlers: require('./settingsHandlers').registerSettingsHandlers,
  registerAssetsHandlers: require('./assetsHandlers').registerAssetsHandlers,
  registerLifecycleHandlers: require('./lifecycleHandlers').registerLifecycleHandlers,
  setupWindowPositioningHandlers: require('./windowPositioningHandlers')
    .setupWindowPositioningHandlers,
  setupNestHandlers: require('./nestHandlers').setupNestHandlers,
  setupBattleMechanicsHandlers: require('./battleMechanicsHandlers').setupBattleMechanicsHandlers,
};

// Handler para processar resultado de batalhas
function setupBattleHandler(ipcMain, getCurrentPet, petManager, BrowserWindow) {
  ipcMain.on('battle-result', async (event, result) => {
    const currentPet = getCurrentPet();
    if (!currentPet || !result) return;
    const win = !!result.win;
    let delta = win ? 5 : -10;

    if (win) {
      currentPet.winStreak = (currentPet.winStreak || 0) + 1;
      currentPet.lossStreak = 0;
      if (currentPet.winStreak >= 5) {
        delta += 15;
        currentPet.winStreak = 0;
      }
    } else {
      currentPet.lossStreak = (currentPet.lossStreak || 0) + 1;
      currentPet.winStreak = 0;
      // Penalidade adicional de -5% da felicidade atual ao perder
      const lossPenalty = Math.ceil(currentPet.happiness * 0.05);
      delta -= lossPenalty;
      if (currentPet.lossStreak >= 5) {
        delta -= 30;
        currentPet.lossStreak = 0;
      }
    }

    currentPet.happiness = Math.max(0, Math.min(100, (currentPet.happiness || 0) + delta));

    try {
      await petManager.updatePet(currentPet.petId, {
        happiness: currentPet.happiness,
        winStreak: currentPet.winStreak,
        lossStreak: currentPet.lossStreak,
      });
      BrowserWindow.getAllWindows().forEach((w) => {
        if (w.webContents) w.webContents.send('pet-data', currentPet);
      });
    } catch (err) {
      console.error('Erro ao atualizar felicidade após batalha:', err);
    }
  });
}

module.exports = { setupBattleHandler };

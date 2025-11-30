const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');

function mockIpc() {
  const h = {};
  return { on: (c, f) => (h[c] = f), emit: (c, ...a) => h[c] && h[c]({}, ...a) };
}
function mockBrowserWindow() {
  return { getAllWindows: () => [] };
}

describe('nestHandlers missing pet early return', () => {
  it('place-egg-in-nest returns when no current pet', async () => {
    const ipc = mockIpc();
    setupNestHandlers({
      getCurrentPet: () => null,
      getItems: () => ({ eggAve: 1 }),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => [],
      setNestsData: () => {},
      generateRarity: () => 'Comum',
      generatePetFromEgg: () => ({}),
      petManager: { createPet: async (d) => d },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: mockBrowserWindow(),
    });
    await ipc.emit('place-egg-in-nest', 'eggAve');
  });
});

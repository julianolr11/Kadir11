# Kadir11 - Copilot Instructions

## Project Overview
Kadir11 is an Electron-based Tamagotchi RPG game written in JavaScript. It features pet management, battles, training, journey modes, and egg hatching systems. The architecture uses a main process (`main.js`) coordinating multiple BrowserWindows with IPC communication.

## Architecture & Core Components

### Main Process (`main.js`)
- Central coordinator with ~1900 lines managing all windows and game state
- Uses `electron-store` for persistent data (coins, settings)
- Global `currentPet` variable tracks active pet
- All IPC handlers are defined here using `ipcMain.on()` and `ipcMain.handle()`
- Window management delegated to `scripts/windowManager.js` with fade animations

### Pet Data Flow
- **Storage**: Pets saved as JSON files in `userData/pets/` directory (e.g., `pet_000001.json`)
- **Counter**: `pets/counter.json` tracks next pet ID (6-digit padded format)
- **Limits**: Max pets based on pen size: small=3, medium=6, large=10
- **Updates**: All pet modifications go through `petManager.updatePet()`, broadcasting to all windows via `window.webContents.send('pet-data', currentPet)`

### IPC Communication Pattern
- **preload.js**: Exposes `window.electronAPI` with whitelisted channels in two arrays:
  - `send` channels (renderer → main): 'create-pet', 'select-pet', 'buy-item', etc.
  - `on` channels (main → renderer): 'pet-data', 'pet-created', 'gift-redeemed', etc.
- **Adding new channels**: Must update BOTH arrays in preload.js or IPC will silently fail

### Window System
- Each game mode has dedicated HTML + JS files (e.g., `battle-mode.html` + `scripts/battle-mode.js`)
- Windows use fade-in/out animations via `windowManager.attachFadeHandlers()`
- Window positioning: `centerWindowAnimated()`, `centerSideBySide()`, `animateMove()`
- Multiple concurrent windows: battle, journey, lair, train, items, store, nests, hatch

## Pet System

### Species & Elements
- **Species**: Defined in `scripts/constants.js` (`specieData` object)
  - Maps species name → directory, race, element (e.g., `'Pidgly': { dir: 'Ave', race: 'Pidgly', element: 'terra' }`)
- **Elements**: fogo, agua, terra, ar, puro (affects battles via `scripts/elements.js` multiplier table)
- **Rarity**: Comum, Incomum, Raro, MuitoRaro, Epico, Lendario (generated in `generateRarity()`)

### Asset Structure
- **Images**: `Assets/Mons/{Species}/{element}/{race}/` contains:
  - `front.gif` or `front.png` (status/battle display)
  - `{race}.png` (bio image)
- **Fallback**: `Assets/Mons/eggsy.png` if no specific image exists
- **Status vs Bio**: Pets track both `statusImage` (animated) and `bioImage` (static portrait)

### Pet Generation
- Eggs mapped in `eggSpecieMap` (e.g., `eggAve: ['Pidgly', 'Ignis']`)
- `generatePetFromEgg()` creates initial pet with:
  - Random attributes (1-5 base, life x10)
  - Default name "Eggsy", 10 kadirPoints, full stats (100 hunger/happiness/energy)
  - Rarity-based stats and starting moves

### Pet Stats & Updates
- **Decay System** (`scripts/petUpdater.js` runs every 1 second):
  - Hunger: -1 every 180 seconds
  - Happiness: -1 every 300 seconds
  - Recovery: +1 HP/energy every 90 seconds if below max
  - Kadir Points: +1 every 10 minutes if happiness ≥ 80
- **Battle Impact**: 
  - Win: +5 happiness, streak of 5 wins = +15 bonus
  - Loss: -10 happiness -5% current happiness, streak of 5 losses = -30 penalty

## Battle System

### Moves & Data Files
- **Moves**: `data/moves.json` defines attacks with:
  - `elements` array (which elements can use it)
  - `species` array (which species can learn it)
  - `power`, `cost`, `level`, `effect` (status effects)
- **Status Effects**: `data/status-effects.json` defines queimado, envenenamento, sangramento, dormencia, congelamento, paralisia
- **Items**: `data/items.json` defines consumables and equipment

### Battle Flow
1. Main process creates `battleModeWindow` and `battleSceneWindow` (side-by-side)
2. Scene loads background + pet sprites via `scene-data` IPC event
3. Battle logic in `scripts/battle-scene.js` (not fully shown, inferred from structure)
4. Result sent via `ipcMain.on('battle-result')` in `scripts/battleHandler.js`
5. Happiness/stats updated and broadcast to all windows

### Elemental Effectiveness
- Implemented in `scripts/elements.js` with `getElementMultiplier(attacker, defender)`
- Cycle: Fogo ⇄ Água ⇄ Terra ⇄ Ar (1.2x advantage, 0.8x disadvantage)
- Puro: 0.9x vs all elements, 1.2x vs itself

## Development Workflows

### Running the App
```bash
npm install      # Install dependencies
npm start        # Launch Electron app (opens start.html)
npm test         # Run Mocha tests
```

### Dev Tools
- **Global shortcut**: `Ctrl+Shift+D` opens DevTools in focused window (registered in main.js)
- **Testing**: `test/` directory with Mocha tests for species generation

### Adding New Features

#### Adding a New Window
1. Create HTML file in root (e.g., `gift.html`)
2. Create script in `scripts/` (e.g., `scripts/gift.js`)
3. Add window variable in main.js (e.g., `let giftWindow = null;`)
4. Create `createGiftWindow()` function using `windowManager` patterns
5. Add IPC handlers for `open-gift-window` and `close-gift-window`
6. **Critical**: Update `preload.js` validChannels arrays

#### Adding Initial Moves to Pets
- Reference `INSTRUCOES_GOLPE_INICIAL.md` for detailed steps
- Either run `add-moves-to-pets.js` script for existing pets
- Or modify `generatePetFromEgg()` to include `moves` and `knownMoves` arrays

#### Adding Gift Code System
- Reference `INSTRUCOES_PRESENTES.md` and `GIFT_CODE_TO_ADD.txt`
- Define codes object in main.js handlers
- Requires preload.js channel updates

## Conventions & Patterns

### File Naming
- HTML files in root: kebab-case (e.g., `battle-mode.html`)
- Scripts in `scripts/`: kebab-case matching HTML (e.g., `battle-mode.js`)
- Data files in `data/`: kebab-case JSON (e.g., `status-effects.json`)

### IPC Channel Naming
- Actions: verb-noun format (e.g., `create-pet`, `open-status-window`, `buy-item`)
- Events: noun-past-tense (e.g., `pet-created`, `gift-redeemed`)
- Errors: noun-error (e.g., `gift-error`)

### Pet Image Resolution
- Function `ensureStatusImage()` in `petManager.js` auto-resolves front.gif → front.png fallback
- Always use forward slashes in paths (POSIX format) for cross-platform compatibility
- Check file existence with `fs.existsSync()` before setting image paths

### Window Lifecycle
1. Create with `new BrowserWindow({ show: false, ... })`
2. Attach fade handlers: `windowManager.attachFadeHandlers(win)`
3. Load HTML: `win.loadFile('path.html')`
4. Show triggered automatically by fade-in on `ready-to-show`
5. Close intercept: fade-out animation before destroy

## Known Issues & Quirks

- **electron-store**: Must be loaded in main process, throws if used incorrectly (see main.js line 10-23)
- **Pet limit enforcement**: Checked in `petManager.createPet()` against pen size
- **Timer resets**: Call `petUpdater.resetTimers()` when selecting new pet to avoid immediate decay
- **Asset paths**: Use `path.posix.join()` for stored paths, `path.join()` for filesystem operations
- **Window focus**: DevTools shortcut only works on focused window

## Testing Patterns
- Tests in `test/` use Mocha framework
- Focus on data generation (species, attributes) rather than UI
- Mock filesystem for pet manager tests (pattern: see existing test files)

---

**Key Insight**: This is a heavily IPC-driven architecture. When adding features, always trace the full flow: renderer UI → IPC send → main.js handler → petManager operation → broadcast to all windows. Missing any step (especially preload.js channel registration) breaks functionality silently.

/**
 * Simple wrapper around backend API functions.
 *
 * The current implementation delegates to `window.electronAPI` so the
 * renderer can work completely offline using Electron IPC.
 * When the remote HTTP server is available, replace these calls with
 * `fetch` requests to your endpoints and return the parsed responses.
 */

export function createPet(petData) {
    window.electronAPI.createPet(petData);
}

export function listPets() {
    return window.electronAPI.listPets();
}

export function redeemCode(code) {
    if (window.electronAPI.redeemCode) {
        return window.electronAPI.redeemCode(code);
    }
    return Promise.reject(new Error('redeemCode not implemented'));
}

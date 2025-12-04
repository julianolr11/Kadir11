/**
 * Script para mini-menu em janela separada
 */

const menuItems = [
    { action: 'bestiary', text: 'Bestiário' },
    { action: 'status', text: 'Status' },
    { action: 'presentes', text: 'Presentes' },
    { action: 'train', text: 'Treinar' },
    { action: 'battle', text: 'Batalhar' },
    { action: 'items', text: 'Itens' },
    { action: 'store', text: 'Loja' },
    { action: 'pets', text: 'Pets' },
    { action: 'normal-mode', text: 'Modo Normal' },
    { action: 'exit', text: 'Sair' }
];

const container = document.getElementById('menu-container');

// Preencher menu
menuItems.forEach(({ action, text }) => {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.dataset.action = action;
    item.textContent = text;
    
    item.addEventListener('click', () => {
        console.log('Mini-menu action:', action);
        
        if (action === 'exit') {
            window.electronAPI.send('exit-app');
        } else {
            // Enviar ação para tray através do IPC (incluindo normal-mode)
            window.electronAPI.send('mini-menu-action', action);
        }
        
        // Fechar o menu
        setTimeout(() => {
            window.close();
        }, 100);
    });
    
    container.appendChild(item);
});

// Fechar menu se clicar fora (não necessário aqui pois é janela separada)
document.addEventListener('blur', () => {
    setTimeout(() => window.close(), 100);
});

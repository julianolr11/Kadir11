/**
 * Home Page - Página inicial SPA simplificada
 * Layout limpo: apenas pet com background de raridade + botão de menu
 */

function homePage(state = {}) {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet') || {
    name: 'Eggsy',
    level: 1,
    element: 'puro',
    rarity: 'Comum',
    currentHealth: 100,
    maxHealth: 100,
    energy: 100,
    statusImage: 'eggsy.png'
  };

  // Gradientes de raridade
  const rarityGradients = {
    'Comum': 'linear-gradient(135deg, #808080, #A9A9A9)',
    'Incomum': 'linear-gradient(135deg, #D3D3D3, #DCDCDC)',
    'Raro': 'linear-gradient(135deg, #32CD32, #00FA9A)',
    'MuitoRaro': 'linear-gradient(135deg, #4682B4, #00BFFF)',
    'Epico': 'linear-gradient(135deg, #800080, #DA70D6)',
    'Lendario': 'linear-gradient(135deg, #FFD700, #FF8C00)'
  };

  const rarityBg = rarityGradients[currentPet.rarity] || rarityGradients['Comum'];
  const healthPercent = (currentPet.currentHealth / currentPet.maxHealth) * 100;
  const energyPercent = currentPet.energy || 100;
  
  return `
    <div class="spa-clean-layout">
      <!-- Pet centralizado -->
      <div class="spa-pet-display">
        <!-- Background de raridade -->
        <div class="spa-pet-background" style="background: ${rarityBg};"></div>
        
        <!-- Textura -->
        <div class="spa-pet-texture"></div>
        
        <!-- Imagem do pet -->
        <img 
          src="Assets/Mons/${currentPet.statusImage || currentPet.image || 'eggsy.png'}" 
          alt="${currentPet.name}"
          class="spa-pet-image"
          onerror="this.src='Assets/Mons/eggsy.png'"
        >
        
        <!-- Info do pet -->
        <div class="spa-pet-info">
          <div class="spa-pet-name">${currentPet.name}</div>
          <div class="spa-pet-bars">
            <div class="spa-status-bar">
              <div class="spa-status-bar-fill health" style="width: ${healthPercent}%;"></div>
            </div>
            <div class="spa-status-bar">
              <div class="spa-status-bar-fill energy" style="width: ${energyPercent}%;"></div>
            </div>
          </div>
          <div class="spa-pet-level">Nv ${currentPet.level || 1}</div>
        </div>
        
        <!-- Ícones de alerta -->
        <div class="spa-alert-icons" id="alert-icons">
          <!-- Alertas serão adicionados aqui dinamicamente -->
        </div>
      </div>
      
      <!-- Botão de menu flutuante -->
      <div class="spa-menu-button" id="spa-menu-btn" onclick="window.toggleSPAMenu()">
        <img src="Assets/Icons/Hamburger_icon.svg.png" alt="Menu">
      </div>
      
      <!-- Dropdown do menu -->
      <div class="spa-menu-dropdown" id="spa-menu-dropdown">
        <div class="spa-menu-item" onclick="router.navigate('/status')">📊 Status</div>
        <div class="spa-menu-item" onclick="router.navigate('/create-pet')">🐣 Criar Pet</div>
        <div class="spa-menu-item" onclick="router.navigate('/pen')">🏠 Meus Pets</div>
        <div class="spa-menu-item" onclick="router.navigate('/items')">🎒 Inventário</div>
        <div class="spa-menu-item" onclick="router.navigate('/store')">🛍️ Loja</div>
        <div class="spa-menu-item" onclick="router.navigate('/nests')">🥚 Ninhos</div>
        <div class="spa-menu-item" onclick="router.navigate('/training-menu')">🏋️ Treinar</div>
        <div class="spa-menu-item" onclick="router.navigate('/battle-menu')">⚔️ Batalhar</div>
        <div class="spa-menu-item" onclick="router.navigate('/journey-menu')">🗺️ Jornada</div>
        <div class="spa-menu-item" onclick="router.navigate('/bestiary')">📖 Bestiário</div>
        <div class="spa-menu-item" onclick="router.navigate('/settings')">⚙️ Configurações</div>
        <div class="spa-menu-item" onclick="closeSPA()" style="color: #ff4444;">✕ Fechar SPA</div>
      </div>
    </div>

    <script>
      // Aguardar que o DOM esteja pronto
      setTimeout(() => {
        const menuBtn = document.getElementById('spa-menu-btn');
        const menuDropdown = document.getElementById('spa-menu-dropdown');
        
        console.log('[Home] Inicializando menu:', { menuBtn: !!menuBtn, menuDropdown: !!menuDropdown });
        
        if (menuBtn && menuDropdown) {
          // Fechar ao clicar fora
          document.addEventListener('click', (e) => {
            if (e.target !== menuBtn && !menuDropdown.contains(e.target)) {
              window.closeSPAMenu?.();
            }
          });
          
          console.log('[Home] Menu inicializado ✅');
        } else {
          console.error('[Home] Menu ou dropdown não encontrados no DOM');
        }
        
        // Mostrar alertas
        showAlerts();
      }, 150);
      
      // Mostrar alertas de fome/felicidade
      function showAlerts() {
        const alertIcons = document.getElementById('alert-icons');
        if (!alertIcons) return;
        
        const pet = window.gameState?.get('currentPet');
        if (!pet) return;
        
        let alertsHTML = '';
        
        if (pet.hunger < 30) {
          alertsHTML += '<img src="Assets/Shop/meat1.png" alt="Fome" class="spa-alert-icon" onerror="this.src=\\'Assets/Shop/health-potion.png\\'">';
        }
        
        if (pet.happiness < 30) {
          alertsHTML += '<img src="Assets/Shop/sad.png" alt="Felicidade" class="spa-alert-icon" onerror="this.src=\\'Assets/Shop/smile.png\\'">';
        }
        
        alertIcons.innerHTML = alertsHTML;
      }
      
      // Listener para updates do gameState
      if (window.gameState) {
        window.gameState.subscribe((state) => {
          if (router.getCurrentPage() === 'home') {
            showAlerts();
          }
        });
      }
    </script>
  `;
}

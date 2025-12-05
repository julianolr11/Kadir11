/**
 * Create Pet Page - Página SPA de criação de pet
 * Design centralizado em modal (600x500)
 */

function createPetPage(state = {}) {
  const gameState = window.gameState;
  
  return `
    <div class="spa-page create-pet-page">
      <!-- Overlay escuro -->
      <div class="create-pet-overlay" onclick="if(event.target === this) router.back()"></div>
      
      <!-- Modal centralizado -->
      <div class="create-pet-modal">
        <!-- Header -->
        <div class="modal-header">
          <h1 class="modal-title">🐣 Criar Novo Pet</h1>
          <button class="modal-close-btn" onclick="router.back()" title="Fechar">×</button>
        </div>

        <!-- Content -->
        <div class="modal-content">
          <!-- Grid de 2 colunas: Seleção de Ovo + Formulário -->
          <div class="modal-grid">
            <!-- Coluna 1: Preview do Ovo -->
            <div class="egg-preview-section">
              <h3 class="section-subtitle">Escolha seu Ovo</h3>
              <div class="eggs-grid" id="eggs-grid">
                <!-- Ovos serão renderizados aqui -->
              </div>
              <div class="egg-preview-display" id="egg-preview">
                <img src="Assets/Mons/eggsy.png" alt="Ovo" class="egg-image" id="selected-egg-image">
                <p class="egg-name" id="selected-egg-name">Selecione um ovo</p>
              </div>
            </div>

            <!-- Coluna 2: Formulário -->
            <div class="pet-form-section">
              <h3 class="section-subtitle">Dados do Pet</h3>
              
              <div class="form-group">
                <label for="pet-name">Nome</label>
                <input 
                  type="text" 
                  id="pet-name" 
                  class="modal-input" 
                  placeholder="Digite o nome" 
                  maxlength="15"
                  autocomplete="off"
                >
              </div>

              <div class="form-group">
                <label>Ovo Selecionado</label>
                <div class="selected-egg-info" id="selected-egg-info">
                  <span class="egg-type-badge" id="egg-type-badge">Nenhum</span>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  class="modal-btn modal-btn-success" 
                  id="create-pet-btn"
                  onclick="handleCreatePet()"
                  disabled
                >
                  🎉 Criar Pet
                </button>
                <button 
                  class="modal-btn modal-btn-secondary" 
                  onclick="router.back()"
                >
                  Cancelar
                </button>
              </div>

              <div class="creation-info">
                <p class="info-text">
                  💡 Cada ovo gera pets com elementos únicos
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <span class="footer-text">Pets: <span id="pet-limit-text">—</span></span>
        </div>
      </div>
    </div>

    <style>
      /* Overlay escuro de fundo */
      .create-pet-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 9998;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      /* Modal centralizado */
      .create-pet-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 700px;
        max-width: 90vw;
        max-height: 85vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid rgba(68, 170, 255, 0.5);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modalSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes modalSlideIn {
        from {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
        }
        to {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

      /* Header do Modal */
      .modal-header {
        padding: 20px 24px;
        border-bottom: 2px solid rgba(68, 170, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 0, 0, 0.3);
      }

      .modal-title {
        font-size: 1.5em;
        font-weight: 600;
        color: #44aaff;
        margin: 0;
      }

      .modal-close-btn {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 2em;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .modal-close-btn:hover {
        background: rgba(255, 0, 0, 0.2);
        color: #ff4444;
      }

      /* Content do Modal */
      .modal-content {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }

      .modal-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }

      @media (max-width: 768px) {
        .create-pet-modal {
          width: 95vw;
          max-height: 90vh;
        }
        
        .modal-grid {
          grid-template-columns: 1fr;
          gap: 20px;
        }
      }

      .section-subtitle {
        font-size: 1.1em;
        font-weight: 600;
        color: #44aaff;
        margin: 0 0 12px 0;
        text-align: center;
      }      /* Egg Selection */
      .egg-preview-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .eggs-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        max-height: 160px;
        overflow-y: auto;
      }

      .egg-option {
        background: rgba(20, 20, 30, 0.8);
        border: 2px solid rgba(100, 100, 120, 0.5);
        border-radius: 8px;
        padding: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .egg-option:hover {
        background: rgba(68, 170, 255, 0.2);
        border-color: #44aaff;
        transform: translateY(-2px);
      }

      .egg-option.selected {
        background: rgba(68, 170, 255, 0.3);
        border-color: #44aaff;
        box-shadow: 0 0 12px rgba(68, 170, 255, 0.5);
      }

      .egg-option img {
        width: 48px;
        height: 48px;
        object-fit: contain;
        margin-bottom: 4px;
      }

      .egg-option-name {
        font-size: 0.7em;
        color: #ccc;
        display: block;
      }

      .egg-preview-display {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        border: 2px solid rgba(68, 170, 255, 0.3);
        min-height: 140px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .egg-image {
        width: 96px;
        height: 96px;
        object-fit: contain;
        animation: eggFloat 3s ease-in-out infinite;
      }

      @keyframes eggFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }

      .egg-name {
        font-size: 1em;
        font-weight: 600;
        color: #44aaff;
        margin-top: 8px;
      }

      /* Form Section */
      .pet-form-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-group label {
        font-size: 0.9em;
        font-weight: 600;
        color: #aaa;
      }

      .modal-input {
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(100, 100, 120, 0.5);
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 1em;
        color: #fff;
        font-family: 'PixelOperator', sans-serif;
        transition: all 0.3s ease;
      }

      .modal-input:focus {
        outline: none;
        border-color: #44aaff;
        box-shadow: 0 0 8px rgba(68, 170, 255, 0.3);
      }

      .selected-egg-info {
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(100, 100, 120, 0.5);
        border-radius: 8px;
        padding: 10px 14px;
        min-height: 44px;
        display: flex;
        align-items: center;
      }

      .egg-type-badge {
        background: rgba(68, 170, 255, 0.2);
        border: 1px solid #44aaff;
        border-radius: 6px;
        padding: 5px 10px;
        font-size: 0.85em;
        color: #44aaff;
        font-weight: 600;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 4px;
      }

      .modal-btn {
        flex: 1;
        padding: 12px 20px;
        font-size: 1em;
        font-family: 'PixelOperator', sans-serif;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .modal-btn-success {
        background: linear-gradient(135deg, #00c853, #00e676);
        color: #fff;
      }

      .modal-btn-success:hover:not(:disabled) {
        background: linear-gradient(135deg, #00e676, #00c853);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
      }

      .modal-btn-secondary {
        background: rgba(100, 100, 120, 0.3);
        color: #ccc;
        border: 1px solid rgba(100, 100, 120, 0.5);
      }

      .modal-btn-secondary:hover {
        background: rgba(100, 100, 120, 0.5);
        color: #fff;
      }

      .modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .creation-info {
        background: rgba(68, 170, 255, 0.1);
        border: 1px solid rgba(68, 170, 255, 0.3);
        border-radius: 8px;
        padding: 12px;
      }

      .info-text {
        font-size: 0.85em;
        color: #ccc;
        margin: 0;
        line-height: 1.5;
      }

      /* Footer do Modal */
      .modal-footer {
        padding: 12px 24px;
        border-top: 2px solid rgba(68, 170, 255, 0.3);
        background: rgba(0, 0, 0, 0.3);
        text-align: center;
      }

      .footer-text {
        font-size: 0.85em;
        color: #aaa;
      }

      .footer-text span {
        color: #44aaff;
        font-weight: 600;
      }
    </style>

    <script>
      // Estado local da página
      let selectedEggType = null;
      
      // Mapeamento de ovos disponíveis
      const eggTypes = [
        { id: 'eggAve', name: 'Ovo Ave', image: 'Assets/Mons/eggAve.png' },
        { id: 'eggReptil', name: 'Ovo Réptil', image: 'Assets/Mons/eggReptil.png' },
        { id: 'eggMamifero', name: 'Ovo Mamífero', image: 'Assets/Mons/eggMamifero.png' },
        { id: 'eggAquatico', name: 'Ovo Aquático', image: 'Assets/Mons/eggAquatico.png' },
      ];

      // Renderizar ovos
      function renderEggs() {
        const grid = document.getElementById('eggs-grid');
        if (!grid) return;

        grid.innerHTML = eggTypes.map(egg => \`
          <div class="egg-option" onclick="selectEgg('\${egg.id}', '\${egg.name}', '\${egg.image}')">
            <img src="\${egg.image}" alt="\${egg.name}" onerror="this.src='Assets/Mons/eggsy.png'">
            <span class="egg-option-name">\${egg.name}</span>
          </div>
        \`).join('');
      }

      // Selecionar ovo
      window.selectEgg = function(eggId, eggName, eggImage) {
        selectedEggType = eggId;
        
        // Update preview
        const preview = document.getElementById('selected-egg-image');
        const nameEl = document.getElementById('selected-egg-name');
        const badge = document.getElementById('egg-type-badge');
        
        if (preview) preview.src = eggImage;
        if (nameEl) nameEl.textContent = eggName;
        if (badge) {
          badge.textContent = eggName;
          badge.style.background = 'rgba(68, 170, 255, 0.3)';
          badge.style.borderColor = '#44aaff';
        }
        
        // Update selected state
        document.querySelectorAll('.egg-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        // Enable create button
        updateCreateButton();
      };

      // Criar pet
      window.handleCreatePet = async function() {
        const nameInput = document.getElementById('pet-name');
        const petName = nameInput?.value?.trim();
        
        if (!petName) {
          alert('Por favor, digite um nome para o seu pet!');
          return;
        }
        
        if (!selectedEggType) {
          alert('Por favor, selecione um ovo!');
          return;
        }
        
        console.log('[Create Pet] Criando pet:', { name: petName, egg: selectedEggType });
        
        // Chamar IPC via spaBridge
        if (window.spaBridge) {
          try {
            const result = await window.spaBridge.createPet(petName, selectedEggType);
            if (result.success) {
              alert(\`✨ \${petName} foi criado com sucesso!\`);
              router.navigate('/pen');
            } else {
              alert(\`❌ Erro: \${result.error || 'Falha ao criar pet'}\`);
            }
          } catch (error) {
            console.error('[Create Pet] Erro:', error);
            alert('❌ Erro ao criar pet. Verifique o console.');
          }
        } else {
          alert('❌ Sistema IPC não disponível. Por favor, reinicie o jogo.');
        }
      };

      // Atualizar botão de criar
      function updateCreateButton() {
        const btn = document.getElementById('create-pet-btn');
        const nameInput = document.getElementById('pet-name');
        
        if (btn && nameInput) {
          const hasName = nameInput.value.trim().length > 0;
          const hasEgg = selectedEggType !== null;
          btn.disabled = !(hasName && hasEgg);
        }
      }

      // Atualizar limite de pets
      async function updatePetLimit() {
        const limitText = document.getElementById('pet-limit-text');
        if (!limitText) return;
        
        if (window.spaBridge) {
          const pets = await window.spaBridge.getPets();
          const maxPets = 10; // TODO: Buscar do gameState
          limitText.textContent = \`\${pets.length}/\${maxPets}\`;
        }
      }

      // Inicializar
      setTimeout(() => {
        renderEggs();
        updatePetLimit();
        
        const nameInput = document.getElementById('pet-name');
        if (nameInput) {
          nameInput.addEventListener('input', updateCreateButton);
        }
      }, 100);
    </script>
  `;
}

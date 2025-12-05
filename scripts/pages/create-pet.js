/**
 * Create Pet Page - Página SPA de criação de pet
 * Design restaurado do original com melhorias responsivas
 */

function createPetPage(state = {}) {
  const gameState = window.gameState;
  
  return `
    <div class="spa-page create-pet-page">
      <!-- Header com botão voltar -->
      <div class="spa-page-header">
        <button class="spa-btn spa-btn-secondary spa-btn-small" onclick="router.back()">
          ← Voltar
        </button>
        <h1 class="spa-title">🐣 Criar Novo Pet</h1>
      </div>

      <!-- Content -->
      <div class="spa-page-content">
        <!-- Card Principal de Criação -->
        <div class="create-pet-card">
          <!-- Preview do Ovo -->
          <div class="egg-preview-section">
            <h2 class="section-title">Escolha seu Ovo</h2>
            <div class="eggs-grid" id="eggs-grid">
              <!-- Ovos serão renderizados aqui -->
            </div>
            <div class="egg-preview-display" id="egg-preview">
              <img src="Assets/Mons/eggsy.png" alt="Ovo" class="egg-image" id="selected-egg-image">
              <p class="egg-name" id="selected-egg-name">Selecione um ovo</p>
            </div>
          </div>

          <!-- Formulário -->
          <div class="pet-form-section">
            <h2 class="section-title">Dados do Pet</h2>
            
            <div class="form-group">
              <label for="pet-name">Nome do Pet</label>
              <input 
                type="text" 
                id="pet-name" 
                class="spa-input" 
                placeholder="Digite o nome do seu pet" 
                maxlength="20"
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
                class="spa-btn spa-btn-success spa-btn-large" 
                id="create-pet-btn"
                onclick="handleCreatePet()"
                disabled
              >
                🎉 Criar Pet
              </button>
              <button 
                class="spa-btn spa-btn-secondary" 
                onclick="router.back()"
              >
                Cancelar
              </button>
            </div>

            <div class="creation-info">
              <p class="info-text">
                💡 <strong>Dica:</strong> Escolha o ovo com cuidado! Cada tipo de ovo gera pets diferentes com elementos únicos.
              </p>
            </div>
          </div>
        </div>

        <!-- Info Card -->
        <div class="spa-card" style="margin-top: 20px;">
          <h3 class="spa-subtitle">📋 Informações</h3>
          <ul class="info-list">
            <li>🥚 Cada ovo possui chances diferentes de gerar espécies raras</li>
            <li>🎲 Os atributos iniciais são gerados aleatoriamente</li>
            <li>⭐ A raridade influencia os stats base do seu pet</li>
            <li>🎯 Escolha um nome único para seu companheiro</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-secondary" onclick="router.navigate('/pen')">
          🏠 Ver Meus Pets
        </button>
        <div style="text-align: right; font-size: 0.85em; color: var(--color-text-muted);">
          Máximo de pets: <span id="pet-limit-text">—</span>
        </div>
      </div>
    </div>

    <style>
      .create-pet-page {
        --card-bg: rgba(30, 30, 40, 0.95);
        --border-color: rgba(68, 170, 255, 0.3);
        --egg-hover: rgba(68, 170, 255, 0.2);
      }

      .create-pet-card {
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        padding: 24px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        .create-pet-card {
          grid-template-columns: 1fr;
          gap: 24px;
        }
      }

      .section-title {
        font-size: 1.4em;
        font-weight: 600;
        color: #44aaff;
        margin: 0 0 16px 0;
        text-align: center;
      }

      /* Egg Selection */
      .egg-preview-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .eggs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 12px;
        max-height: 200px;
        overflow-y: auto;
        padding: 8px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }

      .egg-option {
        background: rgba(20, 20, 30, 0.8);
        border: 2px solid rgba(100, 100, 120, 0.5);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .egg-option:hover {
        background: var(--egg-hover);
        border-color: #44aaff;
        transform: translateY(-2px);
      }

      .egg-option.selected {
        background: rgba(68, 170, 255, 0.3);
        border-color: #44aaff;
        box-shadow: 0 0 12px rgba(68, 170, 255, 0.5);
      }

      .egg-option img {
        width: 60px;
        height: 60px;
        object-fit: contain;
        margin-bottom: 4px;
      }

      .egg-option-name {
        font-size: 0.75em;
        color: #ccc;
        display: block;
      }

      .egg-preview-display {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        border: 2px solid var(--border-color);
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .egg-image {
        width: 120px;
        height: 120px;
        object-fit: contain;
        animation: eggFloat 3s ease-in-out infinite;
      }

      @keyframes eggFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .egg-name {
        font-size: 1.2em;
        font-weight: 600;
        color: #44aaff;
        margin-top: 12px;
      }

      /* Form Section */
      .pet-form-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-size: 0.95em;
        font-weight: 600;
        color: #aaa;
      }

      .spa-input {
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(100, 100, 120, 0.5);
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 1em;
        color: #fff;
        transition: all 0.3s ease;
      }

      .spa-input:focus {
        outline: none;
        border-color: #44aaff;
        box-shadow: 0 0 8px rgba(68, 170, 255, 0.3);
      }

      .selected-egg-info {
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(100, 100, 120, 0.5);
        border-radius: 8px;
        padding: 12px 16px;
        min-height: 48px;
        display: flex;
        align-items: center;
      }

      .egg-type-badge {
        background: rgba(68, 170, 255, 0.2);
        border: 1px solid #44aaff;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 0.9em;
        color: #44aaff;
        font-weight: 600;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 8px;
      }

      .spa-btn-large {
        flex: 1;
        padding: 14px 24px;
        font-size: 1.1em;
      }

      .creation-info {
        background: rgba(68, 170, 255, 0.1);
        border: 1px solid rgba(68, 170, 255, 0.3);
        border-radius: 8px;
        padding: 16px;
        margin-top: 8px;
      }

      .info-text {
        font-size: 0.9em;
        color: #ccc;
        margin: 0;
        line-height: 1.5;
      }

      .info-list {
        list-style: none;
        padding: 0;
        margin: 8px 0 0 0;
      }

      .info-list li {
        padding: 6px 0;
        color: #ccc;
        font-size: 0.95em;
      }

      /* Disable state */
      .spa-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

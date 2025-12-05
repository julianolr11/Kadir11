/**
 * Start Page - Tela inicial do SPA
 * Menu de início com opções: Novo, Continuar, Opções, Sair
 */

function startPage(state = {}) {
  return `
    <div class="spa-start-layout">
      <!-- Fundo com logo -->
      <div class="spa-start-background">
        <img src="Assets/Logo/kadirnobg.png" alt="Kadir" class="spa-logo-main">
        <img src="Assets/Logo/kadir11nme.png" alt="Kadir11" class="spa-logo-title">
      </div>

      <!-- Botões no centro -->
      <div class="spa-start-menu">
        <h1 class="spa-start-title">KADIR11</h1>
        
        <div class="spa-start-buttons">
          <button class="spa-start-btn spa-start-btn-primary" onclick="router.navigate('/create-pet')">
            🆕 Novo
          </button>
          
          <button class="spa-start-btn spa-start-btn-success" onclick="router.navigate('/pen')">
            ▶️ Continuar
          </button>
          
          <button class="spa-start-btn spa-start-btn-secondary" onclick="router.navigate('/settings')">
            ⚙️ Opções
          </button>
          
          <button class="spa-start-btn spa-start-btn-danger" onclick="window.showExitConfirm()">
            ❌ Sair
          </button>
        </div>

        <div class="spa-start-footer">
          <button class="spa-mute-btn" id="spa-mute-btn" onclick="window.toggleSPAMusic()">
            🔊
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmação de saída -->
    <div class="spa-modal-overlay" id="spa-exit-overlay" style="display: none;">
      <div class="spa-modal-box">
        <p>Tem certeza que deseja sair?</p>
        <div class="spa-modal-buttons">
          <button class="spa-modal-btn spa-modal-btn-danger" onclick="window.closeSPA()">Sair</button>
          <button class="spa-modal-btn spa-modal-btn-secondary" onclick="window.hideExitConfirm()">Cancelar</button>
        </div>
      </div>
    </div>

    <audio id="spa-music" autoplay loop style="display: none;">
      <source src="Assets/Sounds/SagadoNorte.mp3" type="audio/mpeg">
    </audio>

    <style>
      /* Layout da tela de início */
      .spa-start-layout {
        width: 100%;
        height: 100%;
        position: fixed;
        top: 0;
        left: 0;
        background: linear-gradient(135deg, #0a0e1a 0%, #16213e 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      /* Fundo com logos */
      .spa-start-background {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        pointer-events: none;
        z-index: 0;
      }

      .spa-logo-main {
        width: 500px;
        height: auto;
        margin-top: 20px;
        image-rendering: pixelated;
        opacity: 0.8;
      }

      .spa-logo-title {
        width: 400px;
        height: auto;
        margin-top: 10px;
        image-rendering: pixelated;
        animation: fadeIn 3s ease-in-out 2s forwards;
        opacity: 0;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 0.9; }
      }

      /* Menu centralizado */
      .spa-start-menu {
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        background: rgba(0, 0, 0, 0.5);
        padding: 40px 60px;
        border-radius: 16px;
        border: 2px solid rgba(68, 170, 255, 0.3);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
      }

      .spa-start-title {
        font-family: 'PixelOperator', sans-serif;
        font-size: 3em;
        font-weight: bold;
        color: #44aaff;
        text-shadow: 3px 3px 8px rgba(0, 0, 0, 0.8);
        margin: 0 0 20px 0;
        letter-spacing: 4px;
      }

      /* Botões */
      .spa-start-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        min-width: 280px;
      }

      .spa-start-btn {
        padding: 14px 28px;
        font-size: 18px;
        font-family: 'PixelOperator', sans-serif;
        font-weight: 600;
        border: 2px solid;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        width: 100%;
      }

      .spa-start-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border-color: #667eea;
      }

      .spa-start-btn-primary:hover {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
      }

      .spa-start-btn-success {
        background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
        color: #fff;
        border-color: #00c853;
      }

      .spa-start-btn-success:hover {
        background: linear-gradient(135deg, #00e676 0%, #00c853 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 200, 83, 0.4);
      }

      .spa-start-btn-secondary {
        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
        color: #fff;
        border-color: #4a5568;
      }

      .spa-start-btn-secondary:hover {
        background: linear-gradient(135deg, #667eea 0%, #4a5568 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
      }

      .spa-start-btn-danger {
        background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
        color: #fff;
        border-color: #ff4444;
      }

      .spa-start-btn-danger:hover {
        background: linear-gradient(135deg, #cc0000 0%, #ff4444 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(255, 68, 68, 0.4);
      }

      .spa-start-btn:active {
        transform: translateY(0);
      }

      /* Footer */
      .spa-start-footer {
        margin-top: 20px;
        position: relative;
      }

      .spa-mute-btn {
        width: 40px;
        height: 40px;
        background: rgba(42, 50, 62, 0.9);
        border: 2px solid #fff;
        border-radius: 50%;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .spa-mute-btn:hover {
        background: rgba(68, 170, 255, 0.8);
        border-color: #44aaff;
      }

      /* Modal */
      .spa-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .spa-modal-box {
        background: rgba(42, 50, 62, 0.95);
        border: 2px solid #fff;
        border-radius: 12px;
        padding: 30px;
        text-align: center;
        font-family: 'PixelOperator', sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
      }

      .spa-modal-box p {
        font-size: 18px;
        color: #fff;
        margin-bottom: 20px;
      }

      .spa-modal-buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .spa-modal-btn {
        padding: 10px 20px;
        font-family: 'PixelOperator', sans-serif;
        font-size: 16px;
        border: 2px solid;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .spa-modal-btn-danger {
        background: #ff4444;
        color: #fff;
        border-color: #ff4444;
      }

      .spa-modal-btn-danger:hover {
        background: #cc0000;
        box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4);
      }

      .spa-modal-btn-secondary {
        background: #2a323e;
        color: #fff;
        border-color: #4a5568;
      }

      .spa-modal-btn-secondary:hover {
        background: #3a4450;
        box-shadow: 0 4px 12px rgba(74, 85, 104, 0.4);
      }
    </style>

    <script>
      // Mostrar modal de confirmação de saída
      window.showExitConfirm = function() {
        const overlay = document.getElementById('spa-exit-overlay');
        if (overlay) overlay.style.display = 'flex';
      };

      // Esconder modal de confirmação
      window.hideExitConfirm = function() {
        const overlay = document.getElementById('spa-exit-overlay');
        if (overlay) overlay.style.display = 'none';
      };

      // Toggle de som
      window.toggleSPAMusic = function() {
        const music = document.getElementById('spa-music');
        const btn = document.getElementById('spa-mute-btn');
        
        if (music) {
          if (music.paused) {
            music.play();
            if (btn) btn.textContent = '🔊';
          } else {
            music.pause();
            if (btn) btn.textContent = '🔇';
          }
        }
      };

      // Inicializar música ao carregar página
      setTimeout(() => {
        const music = document.getElementById('spa-music');
        if (music) {
          music.play().catch(() => {
            console.log('[Start] Auto-play de música bloqueado pelo navegador');
          });
        }
      }, 500);
    </script>
  `;
}

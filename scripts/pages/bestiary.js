function bestiaryPage() {
  // Cores baseadas em elementos (fogo, água, terra, ar, puro)
  const elementColors = {
    'fogo': '#ff6b6b',
    'agua': '#4dabf7',
    'terra': '#82c91e',
    'ar': '#8b5cf6',
    'puro': '#ffd60a',
  };

  // Gradientes baseados em elementos
  const gradientsByElement = {
    'fogo': 'linear-gradient(135deg, rgba(255, 107, 107, 0.6), rgba(230, 25, 25, 0.75))',      // Vermelho/Laranja
    'agua': 'linear-gradient(135deg, rgba(77, 171, 247, 0.6), rgba(30, 120, 200, 0.75))',      // Azul
    'terra': 'linear-gradient(135deg, rgba(130, 201, 30, 0.6), rgba(100, 160, 20, 0.75))',     // Verde
    'ar': 'linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(88, 44, 155, 0.75))',         // Roxo
    'puro': 'linear-gradient(135deg, rgba(255, 214, 10, 0.6), rgba(200, 160, 0, 0.75))',       // Dourado
  };

  // Estado global do carrossel
  window.bestiaryCarouselState = {
    allSpecies: [],
    currentIndex: 0,
  };

  const makeCard = (species, status) => {
    const discovered = !!status?.status;
    const owned = status?.status === 'owned';
    const seen = status?.status === 'seen';
    const displayId = '#' + String(species.dexNumber || 0).padStart(3, '0');
    const displayName = discovered ? species.name : '???';
    const displayElement = discovered ? species.element : '???';
    const displayAttack = discovered ? (species.attackType || '---') : '???';
    const statusClass = owned ? '' : seen ? 'seen' : 'unknown';
    const statusLabel = owned ? 'Obtido' : seen ? 'Visto' : 'Não descoberto';
    const elementColor = elementColors[species.element] || '#8aa0d0';
    const speciesJson = JSON.stringify(species).replace(/"/g, '&quot;');

    // Usar gradiente baseado no elemento
    const cardGradient = gradientsByElement[species.element] || gradientsByElement['puro'];
    const bgStyle = "background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.7) 100%), " + cardGradient + ", url('Assets/Rarity/texture-background.jpg'); background-size: cover, cover, cover; background-blend-mode: normal, overlay, overlay;";

    let imgHtml = '<div style="color:#7f8fb8; font-size:32px; font-weight:800;">?</div>';
    if (discovered) {
      const base = 'Assets/Mons/' + species.dir + '/' + species.element + '/' + species.race + '/';
      // Otimizar imagem com loading lazy e compressão
      imgHtml = '<img src="' + base + 'front.png" alt="' + species.name + '" loading="lazy" decoding="async" onerror="this.onerror=null; this.src=' + "'" + base + "front.gif'" + '; this.onerror=function(){this.src=' + "'" + base + species.race + ".png'" + '; this.onerror=function(){this.src=' + "'" + base + species.race + ".jpg'" + '; this.onerror=function(){this.src=' + "'" + 'Assets/Mons/eggsy.png' + "'" + ';};};};" />';
    }

    return '<div class="spa-bestiary-card" style="opacity:' + (discovered ? '1' : '0.6') + '; cursor: pointer; ' + bgStyle + '" onclick="window.showBestiaryDetail(' + "'" + speciesJson + "'" + ')">' +
      '<div class="spa-bestiary-id">' + displayId + '</div>' +
      '<div class="spa-bestiary-img">' + imgHtml + '</div>' +
      '<p class="spa-bestiary-name">' + displayName + '</p>' +
      '<p class="spa-bestiary-meta" style="color:' + elementColor + ';">' + displayElement + '</p>' +
      '<p class="spa-bestiary-meta">' + displayAttack + '</p>' +
      '<div class="spa-bestiary-status ' + statusClass + '">' + statusLabel + '</div>' +
    '</div>';
  };

  // Executa a montagem após o DOM do template estar no container
  setTimeout(async () => {
    const root = document.getElementById('bestiary-root');
    if (!root) return;

    try {
      const [bestiaryData, speciesInfo] = await Promise.all([
        window.electronAPI.invoke('get-bestiary'),
        window.electronAPI.invoke('get-species-info'),
      ]);

      const specieData = speciesInfo?.specieData || {};
      
      // Mapa de tipos por diretório
      const dirTypeMap = {
        'Ave': 'Ave',
        'Draconideo': 'Draconídeo',
        'Fera': 'Fera',
        'Monstro': 'Monstro',
        'CriaturaMistica': 'Criatura Mística',
        'CriaturaSombria': 'Criatura Sombria',
        'Reptiloide': 'Reptiloide',
        'Besta': 'Besta'
      };
      
      const availableSpecies = Object.entries(specieData).map(([name, info]) => ({
        name,
        race: info.race,
        dir: info.dir,
        element: info.element,
        rarity: (info.rarity || info.rarityLabel || 'desconhecido').toString(),
        dexNumber: info.dexNumber || 0,
        description: info.description,
        attackType: info.attackType,
        type: dirTypeMap[info.dir] || info.dir,
        sizeMeters: info.sizeMeters || null,
        bioImage: info.bioImage || null,
      })).sort((a, b) => (a.dexNumber || 0) - (b.dexNumber || 0));

      const seenCount = Object.values(bestiaryData || {}).filter(v => v?.status === 'seen').length;
      const ownedCount = Object.values(bestiaryData || {}).filter(v => v?.status === 'owned').length;
      const totalCount = availableSpecies.length;
      
      // Salvar para carrossel
      window.bestiaryCarouselState.allSpecies = availableSpecies;
      window.bestiaryCarouselState.bestiaryData = bestiaryData;
      
      const cards = availableSpecies.map(s => makeCard(s, bestiaryData?.[s.name])).join('');

      root.innerHTML =
        '<div class="spa-bestiary-header">' +
          '<div style="display:flex; justify-content:center; gap:10px; align-items:center; color:#f4d35e; font-weight:800; font-size:1.2rem;">🐾 <span>Bestiário Kadir</span> 🐾</div>' +
          '<p class="spa-bestiary-sub">Descubra todas as criaturas do mundo Kadir</p>' +
          '<div class="spa-bestiary-progress">Progresso: ' + (seenCount + ownedCount) + '/' + totalCount + ' vistos | ' + ownedCount + '/' + totalCount + ' capturados (' + (totalCount ? Math.round((ownedCount / totalCount) * 100) : 0) + '%)</div>' +
        '</div>' +
        '<div class="spa-bestiary-grid">' + cards + '</div>' +
        '<div class="spa-bestiary-footer">' +
          '<button class="spa-bestiary-btn" onclick="window.router.navigate(' + "'/start'" + ')">Voltar ao Menu</button>' +
          '<button class="spa-bestiary-btn" onclick="window.closeSPA()">Fechar SPA</button>' +
        '</div>';
      
      // Adicionar efeito 3D aos cards da grid
      
      // Remover eventos 3D dos cards da grid (efeito só no modal)
    } catch (err) {
      console.error('[Bestiary SPA] Erro ao carregar:', err);
      root.innerHTML = '<div style="color: #ff6b6b;">Erro ao carregar bestiário.<br>' + (err?.message || err) + '</div>';
    }
  }, 0);

  // Função para aplicar efeito de iluminação + parallax + 3D suave no modal
  window.applyModal3DEffects = function() {
    const modalContent = document.querySelector('.spa-bestiary-modal-content');
    
    if (!modalContent) return;
    
    // Limpar animação/estado antes de reaplicar
    modalContent.style.animation = '';
    modalContent.style.opacity = '1';
    modalContent.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
    const resetImg = document.querySelector('#modalImageContainer img');
    if (resetImg) {
      resetImg.style.transform = 'translate3d(0, 0, 0) scale(1)';
    }

    // Remover listeners antigos se existirem e resetar estado
    if (modalContent._mouseMoveListener) {
      modalContent.removeEventListener('mousemove', modalContent._mouseMoveListener);
    }
    if (modalContent._mouseLeaveListener) {
      modalContent.removeEventListener('mouseleave', modalContent._mouseLeaveListener);
    }
    
    // Criar novo listener para iluminação, parallax e rotação 3D suave
    const mouseMoveListener = (e) => {
      const rect = modalContent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Atualizar posição da iluminação
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      modalContent.style.setProperty('--mouse-x', `${percentX}%`);
      modalContent.style.setProperty('--mouse-y', `${percentY}%`);

      // Parallax leve + rotação no card
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxShiftCard = 2; // px (menor para não mostrar bordas)
      const shiftXCard = ((x - centerX) / centerX) * maxShiftCard;
      const shiftYCard = ((y - centerY) / centerY) * maxShiftCard;
      const maxRotate = 10; // graus
      const rotateX = ((y - centerY) / centerY) * -maxRotate;
      const rotateY = ((x - centerX) / centerX) * maxRotate;
      modalContent.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${shiftXCard}px, ${shiftYCard}px, 0)`;

      // Parallax leve na imagem (sem rotação)
      const modalImg = document.querySelector('#modalImageContainer img');
      if (modalImg) {
        const maxShift = 3; // px (reduzido para evitar bordas)
        const shiftX = ((x - centerX) / centerX) * maxShift;
        const shiftY = ((y - centerY) / centerY) * maxShift;
        modalImg.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) scale(1.03)`;
      }
    };
    
    const mouseLeaveListener = () => {
      modalContent.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
      const modalImg = document.querySelector('#modalImageContainer img');
      if (modalImg) {
        modalImg.style.transform = 'translate3d(0, 0, 0) scale(1)';
      }
    };

    // Salvar referência
    modalContent._mouseMoveListener = mouseMoveListener;
    modalContent._mouseLeaveListener = mouseLeaveListener;
    
    // Adicionar listener
    modalContent.addEventListener('mousemove', mouseMoveListener);
    modalContent.addEventListener('mouseleave', mouseLeaveListener);
  };

  // Função para exibir detalhes do Pokémon
  window.showBestiaryDetail = function(speciesJson, indexInList = null) {
    try {
      const species = JSON.parse(speciesJson);
      const modal = document.getElementById('bestiaryModal');
      if (!modal) return;

      // Atualizar índice no carrossel se fornecido
      if (indexInList !== null) {
        window.bestiaryCarouselState.currentIndex = indexInList;
      } else {
        // Encontrar o índice da espécie atual
        const idx = window.bestiaryCarouselState.allSpecies.findIndex(s => s.name === species.name);
        if (idx !== -1) window.bestiaryCarouselState.currentIndex = idx;
      }

      const displayId = '#' + String(species.dexNumber || 0).padStart(3, '0');
      const size = species.sizeMeters ? species.sizeMeters + ' m' : 'Desconhecido';

      document.getElementById('modalTitle').innerHTML = '<img src="Assets/Elements/' + (species.element || 'default') + '.png" style="width: 24px; height: 24px; margin-right: 6px;" />' + (species.name || '???');
      document.getElementById('modalId').textContent = displayId;
      document.getElementById('modalType').textContent = species.type || '---';
      document.getElementById('modalAttack').textContent = species.attackType || '---';
      document.getElementById('modalSize').textContent = size;
      document.getElementById('modalDescription').textContent = species.description || 'Sem descrição disponível.';

      // Atualizar visibilidade das setas
      window.updateCarouselArrows();
      
      // Atualizar preview das próximas cartas

      // Usar gradientes baseados em elemento
      const elementGradients = {
        'fogo': 'linear-gradient(135deg, rgba(255, 107, 107, 0.6), rgba(230, 25, 25, 0.75))',
        'agua': 'linear-gradient(135deg, rgba(77, 171, 247, 0.6), rgba(30, 120, 200, 0.75))',
        'terra': 'linear-gradient(135deg, rgba(130, 201, 30, 0.6), rgba(100, 160, 20, 0.75))',
        'ar': 'linear-gradient(135deg, rgba(139, 92, 246, 0.6), rgba(88, 44, 155, 0.75))',
        'puro': 'linear-gradient(135deg, rgba(255, 214, 10, 0.6), rgba(200, 160, 0, 0.75))',
        'default': 'linear-gradient(135deg, rgba(44, 62, 80, 0.6), rgba(52, 73, 94, 0.75))'
      };
      const modalContent = document.getElementById('bestiaryModalContent');
      const specieElement = species.element || 'default';
      const gradient = elementGradients[specieElement] || elementGradients.default;
      if (modalContent) {
        modalContent.style.background = gradient + ', url("Assets/Rarity/texture-background.jpg")';
        modalContent.style.backgroundSize = 'cover';
        modalContent.style.backgroundBlendMode = 'overlay';
      }

      const imgContainer = document.getElementById('modalImageContainer');
      const base = 'Assets/Mons/' + species.dir + '/' + species.element + '/' + species.race + '/';
      
      // Otimizar imagem com loading lazy e decoding async
      imgContainer.innerHTML = '<img src="' + base + species.race + '.png" alt="' + species.name + '" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:contain;" onerror="this.onerror=null; this.src=' + "'" + base + species.race + ".jpg'" + '; this.onerror=function(){this.src=' + "'" + 'Assets/Mons/eggsy.png' + "'" + ';};" />';

      modal.classList.add('active');
      
      // Fazer preload das imagens adjacentes após abrir o modal
      window.preloadAdjacentCarouselImages(indexInList);
      
      // Aplicar efeitos 3D no modal
      window.applyModal3DEffects();
    } catch (err) {
      console.error('[Bestiary] Erro ao exibir detalhes:', err);
    }
  };

  window.closeBestiaryDetail = function() {
    const modal = document.getElementById('bestiaryModal');
    if (modal) {
      modal.classList.remove('active');
      // Limpar classes de animação
      const modalContent = document.getElementById('bestiaryModalContent');
      if (modalContent) {
        modalContent.classList.remove('carousel-prev', 'carousel-next');
      }
    }
  };

  // Fechar modal ao clicar fora dele
  // Função para atualizar setas do carrossel
  window.updateCarouselArrows = function() {
    const state = window.bestiaryCarouselState;
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    
    if (prevBtn) prevBtn.style.opacity = state.currentIndex > 0 ? '1' : '0.3';
    if (nextBtn) nextBtn.style.opacity = state.currentIndex < state.allSpecies.length - 1 ? '1' : '0.3';
  };

  // Função para fazer preloading de imagens adjacentes do carrossel
  window.preloadAdjacentCarouselImages = function(currentIndex) {
    const state = window.bestiaryCarouselState;
    if (!state || !state.allSpecies) return;
    
    // Preload próxima imagem (tenta front.png primeiro, depois front.gif)
    if (currentIndex + 1 < state.allSpecies.length) {
      const nextSpecies = state.allSpecies[currentIndex + 1];
      const nextBase = 'Assets/Mons/' + nextSpecies.dir + '/' + nextSpecies.element + '/' + nextSpecies.race + '/';
      const preloadImg = new Image();
      preloadImg.src = nextBase + 'front.png';
      preloadImg.onerror = function() {
        const img2 = new Image();
        img2.src = nextBase + 'front.gif';
        img2.onerror = function() {
          const img3 = new Image();
          img3.src = nextBase + nextSpecies.race + '.png';
        };
      };
    }
    
    // Preload imagem anterior
    if (currentIndex - 1 >= 0) {
      const prevSpecies = state.allSpecies[currentIndex - 1];
      const prevBase = 'Assets/Mons/' + prevSpecies.dir + '/' + prevSpecies.element + '/' + prevSpecies.race + '/';
      const preloadImg = new Image();
      preloadImg.src = prevBase + 'front.png';
      preloadImg.onerror = function() {
        const img2 = new Image();
        img2.src = prevBase + 'front.gif';
        img2.onerror = function() {
          const img3 = new Image();
          img3.src = prevBase + prevSpecies.race + '.png';
        };
      };
    }
  };

  // Função para navegar no carrossel com otimizações
  window.navigateCarousel = function(direction) {
    const state = window.bestiaryCarouselState;
    const newIndex = Math.max(0, Math.min(state.allSpecies.length - 1, state.currentIndex + direction));
    
    if (newIndex !== state.currentIndex) {
      const nextSpecies = state.allSpecies[newIndex];
      
      // Adicionar animação ao modal antes de atualizar
      const modalContent = document.getElementById('bestiaryModalContent');
      const modal = document.getElementById('bestiaryModal');
      
      if (modalContent && modal && modal.classList.contains('active')) {
        // Encerrar efeito atual antes da transição
        if (modalContent._mouseMoveListener) {
          modalContent.removeEventListener('mousemove', modalContent._mouseMoveListener);
        }
        if (modalContent._mouseLeaveListener) {
          modalContent.removeEventListener('mouseleave', modalContent._mouseLeaveListener);
        }
        modalContent.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
        const cleanupImg = document.querySelector('#modalImageContainer img');
        if (cleanupImg) {
          cleanupImg.style.transform = 'translate3d(0, 0, 0) scale(1)';
        }

        // Determinar animação baseada na direção
        const outAnimation = direction > 0 ? 'cardSlideOutRight 0.3s ease-in-out' : 'cardSlideOutLeft 0.3s ease-in-out';
        const inAnimation = direction > 0 ? 'cardSlideInFromLeft 0.4s ease-in-out forwards' : 'cardSlideInFromRight 0.4s ease-in-out forwards';
        
        // Aplicar animação de saída
        modalContent.style.animation = outAnimation;
        modalContent.style.opacity = '0';
        
        // Aguardar a animação de saída completar antes de atualizar conteúdo
        setTimeout(() => {
          window.showBestiaryDetail(JSON.stringify(nextSpecies), newIndex);
          // Fazer preload das imagens adjacentes após mostrar a atual
          window.preloadAdjacentCarouselImages(newIndex);
          
          // Aguardar o DOM atualizar completamente antes de reaplicar efeitos 3D
          setTimeout(() => {
            const freshModalContent = document.getElementById('bestiaryModalContent');
            if (freshModalContent) {
              freshModalContent.style.animation = inAnimation;
              freshModalContent.style.opacity = '1';
              // Limpar animação depois de aplicada para não bloquear transform
              setTimeout(() => {
                freshModalContent.style.animation = '';
              }, 450);
            }
            
            // Reaplicar efeitos 3D após renderizar nova carta
            setTimeout(() => {
              window.applyModal3DEffects();
            }, 250);
          }, 50);
        }, 300);
      } else {
        // Se modal não estiver ativo, atualizar diretamente
        window.showBestiaryDetail(JSON.stringify(nextSpecies), newIndex);
        window.preloadAdjacentCarouselImages(newIndex);
      }
    }
  };

  setTimeout(() => {
    const modal = document.getElementById('bestiaryModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeBestiaryDetail();
      });

      // Suporte a navegação por teclado
      modal.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          window.navigateCarousel(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          window.navigateCarousel(1);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          window.closeBestiaryDetail();
        }
      });
    }
    
    // Aplicar efeitos 3D iniciais (primeira abertura)
    window.applyModal3DEffects();
  }, 0);

  return `
    <div class="spa-bestiary-shell">
      <div id="bestiary-root" class="spa-bestiary-root">Carregando bestiário...</div>
    </div>

    <style>
      .spa-bestiary-shell {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0f1629 0%, #11182f 100%);
        padding: 24px;
        box-sizing: border-box;
        overflow-y: auto;
        color: #e8ecf5;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      }
      .spa-bestiary-shell::-webkit-scrollbar {
        width: 12px;
      }
      .spa-bestiary-shell::-webkit-scrollbar-track {
        background: rgba(15, 22, 41, 0.6);
        border-radius: 10px;
        margin: 4px;
      }
      .spa-bestiary-shell::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(244,211,94,0.5), rgba(244,211,94,0.7));
        border-radius: 10px;
        border: 2px solid rgba(15, 22, 41, 0.6);
      }
      .spa-bestiary-shell::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(244,211,94,0.7), rgba(244,211,94,0.9));
      }
      .spa-bestiary-header {
        text-align: center;
        margin-bottom: 24px;
      }
      .spa-bestiary-title {
        font-size: 2.2rem;
        font-weight: 800;
        margin: 4px 0;
        color: #f8f9fd;
      }
      .spa-bestiary-sub {
        color: #a5b2d6;
        margin: 0;
      }
      .spa-bestiary-progress {
        margin-top: 12px;
        font-weight: 700;
        color: #f4d35e;
      }
      .spa-bestiary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }
      .spa-bestiary-card {
        background: url('Assets/Rarity/texture-background.jpg');
        background-size: cover;
        background-position: center;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        transition: all 0.4s ease-out;
        display: flex;
        flex-direction: column;
        gap: 10px;
        height: 280px;
        perspective: 1200px;
        cursor: pointer;
      }
      .spa-bestiary-card:hover {
        transform: translateY(-6px) scale(1.03);
        border-color: rgba(244,211,94,0.6);
        box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 16px rgba(244,211,94,0.3);
      }
      .spa-bestiary-id { color: #8aa0d0; font-size: 0.9rem; font-weight: 600; }
      .spa-bestiary-img {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        transition: transform 0.4s ease-out;
      }
      .spa-bestiary-img::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 10px;
        background: radial-gradient(circle, transparent 35%, rgba(0,0,0,0.75) 100%);
        pointer-events: none;
        z-index: 1;
      }
      .spa-bestiary-img img {
        image-rendering: pixelated;
        transform: scale(2.0);
        transition: transform 0.4s ease-out;
        transform-style: preserve-3d;
      }
      .spa-bestiary-name { color: #fff; font-weight: 800; margin: 0; font-size: 1.05rem; height: 1.4em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .spa-bestiary-meta { color: #c6d2f0; font-size: 0.9rem; margin: 0; height: 1.35em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .spa-bestiary-status {
        margin-top: auto;
        font-weight: 700;
        color: #66d9a3;
        font-size: 0.95rem;
        height: 1.3em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .spa-bestiary-status.seen { color: #f7c266; }
      .spa-bestiary-status.unknown { color: #8aa0d0; }
      .spa-bestiary-footer {
        margin-top: 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      .spa-bestiary-btn {
        padding: 10px 18px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.06);
        color: #e8ecf5;
        cursor: pointer;
        font-weight: 700;
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .spa-bestiary-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.32); }
      
      /* Modal de detalhes */
      .spa-bestiary-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        gap: 16px;
      }
      .spa-bestiary-modal-overlay.active {
        display: flex;
      }

      .spa-bestiary-carousel-btn {
        background: rgba(244, 211, 94, 0.15);
        border: 2px solid rgba(244, 211, 94, 0.5);
        color: #f4d35e;
        font-size: 28px;
        width: 48px;
        height: 48px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .spa-bestiary-carousel-btn:hover {
        background: rgba(244, 211, 94, 0.25);
        border-color: rgba(244, 211, 94, 0.8);
        box-shadow: 0 0 12px rgba(244, 211, 94, 0.4);
      }

      .spa-bestiary-carousel-btn:disabled,
      .spa-bestiary-carousel-btn[disabled] {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .spa-bestiary-modal-content {
        background: 
          radial-gradient(circle, transparent 40%, rgba(0,0,0,0.65) 100%),
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04), transparent 35%),
          radial-gradient(circle at 80% 0%, rgba(244,211,94,0.08), transparent 40%),
          linear-gradient(145deg, rgba(12,20,38,0.75) 0%, rgba(15,29,52,0.78) 45%, rgba(11,18,36,0.82) 100%),
          url('Assets/Rarity/texture-background.jpg');
        background-size: cover;
        background-blend-mode: normal, overlay, overlay, overlay, normal;
        border: 2px solid rgba(244,211,94,0.7);
        border-radius: 14px;
        padding: 18px;
        max-width: 420px;
        width: 90%;
        color: #e8ecf5;
        box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 24px rgba(244,211,94,0.28);
        overflow: visible;
        position: relative;
        transition: transform 0.15s ease-out, box-shadow 0.2s ease-out;
        will-change: transform;
        transform-style: preserve-3d;
        transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0);
      }

      /* Foil deslizando na carta */
      .spa-bestiary-modal-content::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 14px;
        background: linear-gradient(120deg,
          transparent 0%,
          rgba(255,255,255,0.08) 25%,
          rgba(244,211,94,0.25) 50%,
          rgba(255,255,255,0.08) 75%,
          transparent 100%);
        background-size: 300% 300%;
        opacity: 0;
        pointer-events: none;
        mix-blend-mode: screen;
        animation: foilSweep 5s linear infinite;
        transition: opacity 0.2s ease-out;
        z-index: 5;
      }
      .spa-bestiary-modal-content:hover::before {
        opacity: 1;
      }
      
      .spa-bestiary-modal-content.carousel-transition {
        /* Sem animação de glow para não conflitar com 3D */
      }
      
      .spa-bestiary-modal-content.carousel-prev {
        animation: slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      .spa-bestiary-modal-content.carousel-next {
        animation: slideInFromLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      @keyframes slideInFromRight {
        from {
          transform: translateX(60px) rotateY(-5deg);
          opacity: 0;
        }
        to {
          transform: translateX(0) rotateY(0deg);
          opacity: 1;
        }
      }
      
      @keyframes slideInFromLeft {
        from {
          transform: translateX(-60px) rotateY(5deg);
          opacity: 0;
        }
        to {
          transform: translateX(0) rotateY(0deg);
          opacity: 1;
        }
      }
      /* Keyframes holographicGlow removidos para não conflitar com efeito 3D */
      .spa-bestiary-modal-content::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 14px;
        padding: 2px;
        background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff);
        background-size: 300% 300%;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        animation: holographicShimmer 4s linear infinite;
        opacity: 0.4;
        pointer-events: none;
      }
      @keyframes holographicShimmer {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .spa-bestiary-modal-content::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 14px;
        background: radial-gradient(circle 300px at var(--mouse-x, 50%) var(--mouse-y, 50%), 
          rgba(255,255,255,0.4) 0%, 
          rgba(244,211,94,0.25) 20%,
          rgba(255,255,255,0.15) 40%, 
          transparent 70%);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        mix-blend-mode: overlay;
        z-index: 10;
      }
      .spa-bestiary-modal-content:hover::after {
        opacity: 1;
      }

      @keyframes foilSweep {
        0% { background-position: 120% 0; }
        100% { background-position: -120% 0; }
      }
      .spa-bestiary-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .spa-bestiary-modal-close {
        background: none;
        border: none;
        color: #f4d35e;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .spa-bestiary-modal-close:hover {
        color: #ffd700;
      }
      .spa-bestiary-modal-title {
        font-size: 1rem;
        font-weight: 800;
        color: #f8f9fd;
        margin: 0;
      }
      .spa-bestiary-modal-id {
        color: #8aa0d0;
        font-size: 0.9rem;
        margin-top: 8px;
      }
      .spa-bestiary-modal-image {
        width: 100%;
        max-width: 100%;
        height: auto;
        max-height: 280px;
        background: rgba(255,255,255,0.04);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 12px auto 16px;
        overflow: hidden;
        box-shadow: inset 0 0 12px rgba(244,211,94,0.25);
        position: relative;
      }
      .spa-bestiary-modal-image::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.7) 100%);
        pointer-events: none;
        z-index: 1;
      }
      .spa-bestiary-modal-image::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        opacity: 0;
        pointer-events: none;
        z-index: 3;
      }
      .spa-bestiary-modal-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        image-rendering: pixelated;
        position: relative;
        z-index: 2;
        max-width: 100%;
        max-height: 100%;
        transition: transform 0.15s ease-out;
      }
      .spa-bestiary-modal-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin: 10px 0;
      }
      .spa-bestiary-modal-item {
        background: rgba(255,255,255,0.05);
        padding: 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: inset 0 0 10px rgba(0,0,0,0.18);
      }
      .spa-bestiary-modal-label {
        color: #8aa0d0;
        font-size: 0.65rem;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .spa-bestiary-modal-value {
        color: #f8f9fd;
        font-size: 0.9rem;
        font-weight: 600;
      }
      .spa-bestiary-modal-description {
        background: rgba(255,255,255,0.05);
        padding: 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        margin: 10px 0 8px;
        line-height: 1.3;
        color: #c6d2f0;
        font-size: 0.85rem;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.18);
      }
    </style>

    <!-- Modal -->
    <div class="spa-bestiary-modal-overlay" id="bestiaryModal">
      <button class="spa-bestiary-carousel-btn spa-bestiary-carousel-prev" id="carouselPrevBtn" onclick="window.navigateCarousel(-1)">◀</button>
      
      <div class="spa-bestiary-modal-content" id="bestiaryModalContent">
        <div class="spa-bestiary-modal-header">
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            <h2 class="spa-bestiary-modal-title" id="modalTitle" style="display: flex; align-items: center; gap: 8px;">???</h2>
            <div class="spa-bestiary-modal-id" id="modalId">#000</div>
          </div>
          <button class="spa-bestiary-modal-close" onclick="window.closeBestiaryDetail()">✕</button>
        </div>
        
        <div class="spa-bestiary-modal-image" id="modalImageContainer">
          <div style="color:#7f8fb8; font-size:32px; font-weight:800;">?</div>
        </div>
        
        <div class="spa-bestiary-modal-grid">
          <div class="spa-bestiary-modal-item">
            <div class="spa-bestiary-modal-label">Tipo</div>
            <div class="spa-bestiary-modal-value" id="modalType">---</div>
          </div>
          <div class="spa-bestiary-modal-item">
            <div class="spa-bestiary-modal-label">Ataque</div>
            <div class="spa-bestiary-modal-value" id="modalAttack">---</div>
          </div>
          <div class="spa-bestiary-modal-item">
            <div class="spa-bestiary-modal-label">Tamanho</div>
            <div class="spa-bestiary-modal-value" id="modalSize">---</div>
          </div>
        </div>
        
        <div class="spa-bestiary-modal-description" id="modalDescription">
          ---
        </div>
      </div>

      <button class="spa-bestiary-carousel-btn spa-bestiary-carousel-next" id="carouselNextBtn" onclick="window.navigateCarousel(1)">▶</button>
    </div>
  `;
}

console.log('Script do create-pet.js carregado');

let specieData = {};
let specieImages = {};

async function loadSpeciesData() {
  try {
    const info = await window.electronAPI.getSpeciesInfo();
    specieData = info.specieData;
    specieImages = info.specieImages;
  } catch (err) {
    console.error('Erro ao obter species data:', err);
  }
}

// Perguntas carregadas de data/questions.json

let questions = [];

function loadQuestions() {
  console.log('Carregando perguntas do arquivo JSON...');
  return fetch('../../data/questions.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      questions = data;
      console.log('Perguntas carregadas:', questions.length);
      initQuiz();
    })
    .catch((error) => console.error('Erro ao carregar as perguntas:', error));
}
// Função para gerar a raridade
function generateRarity() {
  const roll = Math.floor(Math.random() * 100);
  if (roll < 40) return 'Comum';
  if (roll < 70) return 'Incomum';
  if (roll < 85) return 'Raro';
  if (roll < 95) return 'MuitoRaro';
  if (roll < 99) return 'Epico';
  return 'Lendario';
}

// Função equilibrada para definir a espécie com base no elemento escolhido
async function generateSpecie(attributes, element) {
  const { attack, defense, speed, magic, life } = attributes;

  // Carregar afinidades do JSON
  let affinities = {};
  try {
    const response = await fetch('../../data/species-affinities.json');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    affinities = await response.json();
    console.log('Afinidades carregadas do JSON:', Object.keys(affinities).length, 'espécies');
  } catch (error) {
    console.error('Erro ao carregar species-affinities.json:', error);
    // Fallback: afinidades padrão
    affinities = {
      'Ignis': { attack: 2, defense: 0, speed: 3, magic: 2, life: 0 },
      'Digitama': { attack: 0, defense: 1, speed: 0, magic: 3, life: 2 },
      'Pidgly': { attack: 2, defense: 1, speed: 2, magic: 0, life: 1 },
      'Leoracal': { attack: 3, defense: 2, speed: 1, magic: 0, life: 2 },
      'Owlberoth': { attack: 0, defense: 1, speed: 1, magic: 3, life: 2 },
      'Virideer': { attack: 1, defense: 2, speed: 1, magic: 1, life: 3 },
      'Kael': { attack: 1, defense: 1, speed: 2, magic: 3, life: 1 },
      'Mawthorn': { attack: 2, defense: 3, speed: 0, magic: 0, life: 3 },
      'Draak': { attack: 3, defense: 1, speed: 1, magic: 2, life: 2 },
      'Drazraq': { attack: 3, defense: 2, speed: 2, magic: 0, life: 1 },
      'Reptiloide': { attack: 2, defense: 2, speed: 1, magic: 0, life: 2 }
    };
    console.warn('Usando afinidades fallback:', Object.keys(affinities).length, 'espécies');
  }

  // Mapeamento de espécies por elemento (todos os 11 pets disponíveis)
  const speciesByElement = {
    fogo: ['Ignis', 'Digitama'],
    terra: ['Pidgly', 'Leoracal', 'Owlberoth', 'Virideer'],
    agua: ['Kael', 'Mawthorn'],
    puro: ['Draak', 'Drazraq', 'Reptiloide'],
    ar: []
  };

  // 1. Obter espécies do elemento escolhido
  let availableSpecies = speciesByElement[element] || [];

  // 2. Se não houver espécies para o elemento (ar), distribuir entre todos
  if (availableSpecies.length === 0) {
    console.warn(`Elemento '${element}' sem espécies. Usando todos.`);
    availableSpecies = ['Pidgly', 'Ignis', 'Kael', 'Leoracal', 'Draak', 'Drazraq', 'Owlberoth', 'Digitama', 'Virideer', 'Mawthorn', 'Reptiloide'];
  }

  // 3. Calcular pontuação para cada espécie disponível
  const defaultAffinity = { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 };
  const scores = availableSpecies.map((specie) => {
    const affinity = affinities[specie] || defaultAffinity;
    let score = 0;
    score += attack * (affinity.attack || 0);
    score += defense * (affinity.defense || 0);
    score += speed * (affinity.speed || 0);
    score += magic * (affinity.magic || 0);
    score += (life / 10) * (affinity.life || 0);
    const randomBonus = Math.random() * score * 0.3;
    return { specie, score: score + randomBonus, base: score };
  });

  // 4. Ordenar e escolher
  scores.sort((a, b) => b.score - a.score);
  console.log(`${element} - A${attack} D${defense} S${speed} M${magic} V${life/10} → ${scores[0].specie}`);
  return scores[0].specie;
}

// Função para resetar o quiz
function resetQuiz() {
  currentQuestionIndex = 0;
  stats = { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 };
  selectedElement = null;
  document.getElementById('create-pet-container').style.display = 'block';
  document.getElementById('element-selection').style.display = 'none';
  document.getElementById('name-selection').style.display = 'none';
  document.getElementById('no-pet-available').style.display = 'none';
  document.getElementById('create-pet-button').disabled = false;
  showQuestion();
}

// Estado do quiz
let currentQuestionIndex = 0;
const selectedQuestions = [];
let stats = { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 }; // Inicializa com 1
const totalQuestions = 5;
let selectedElement = null; // Armazenar o elemento escolhido

// Selecionar 5 perguntas aleatoriamente
function selectRandomQuestions() {
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, totalQuestions);
}

// Exibir a pergunta atual
function showQuestion() {
  // Fallback seguro caso perguntas ainda não tenham sido carregadas em ambiente de teste
  const question =
    selectedQuestions[currentQuestionIndex] ||
    { text: '', options: [] };

  // Garantir que os elementos do quiz estejam visíveis
  document.getElementById('question-title').style.display = 'block';
  document.getElementById('question-text').style.display = 'block';
  document.getElementById('options-container').style.display = 'grid';

  document.getElementById('question-title').textContent =
    `Pergunta ${currentQuestionIndex + 1}/${totalQuestions}`;
  document.getElementById('question-text').textContent = question.text;

  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';

  (question.options || []).forEach((option) => {
    const button = document.createElement('button');
    button.className = 'button option-button';
    button.textContent = option.text;
    button.addEventListener('click', () => selectOption(option.points));
    optionsContainer.appendChild(button);
  });
}

// Selecionar uma opção e atualizar os atributos
function selectOption(points) {
  stats.attack += points.attack;
  stats.defense += points.defense;
  stats.speed += points.speed;
  stats.magic += points.magic;
  stats.life += points.life;

  currentQuestionIndex++;

  if (currentQuestionIndex < totalQuestions) {
    showQuestion();
  } else {
    showElementSelection();
  }
}

// Exibir a seleção de elemento
function showElementSelection() {
  document.getElementById('question-title').style.display = 'none';
  document.getElementById('question-text').style.display = 'none';
  document.getElementById('options-container').style.display = 'none';
  document.getElementById('element-selection').style.display = 'block';

  const elementButtons = document.querySelectorAll('.element-button');
  elementButtons.forEach((button) => {
    const label = button.querySelector('.element-label');
    const element = button.getAttribute('data-element');
    label.textContent = element.charAt(0).toUpperCase() + element.slice(1); // Capitalizar o nome

    button.addEventListener('click', () => {
      const element = button.getAttribute('data-element');
      showNameSelection(element);
    });
  });
}

// Exibir a animação final e revelar o pet
function showFinalAnimation(newPet) {
  const finalAnimation = document.getElementById('final-animation');
  const finalAnimationVideo = document.getElementById('final-animation-video');
  const finalAnimationGif = document.getElementById('final-animation-gif');

  finalAnimation.style.display = 'flex';
  console.log('Exibindo animação final');

  // Iniciar a animação
  finalAnimationVideo.style.display = 'block';
  finalAnimationGif.style.display = 'none';
  finalAnimationVideo.currentTime = 0;
  const playPromise = finalAnimationVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      finalAnimationVideo.style.display = 'none';
      finalAnimationGif.style.display = 'block';
    });
  }
  finalAnimationVideo.onerror = () => {
    finalAnimationVideo.style.display = 'none';
    finalAnimationGif.style.display = 'block';
  };

  // Fade-in da animação
  setTimeout(() => {
    finalAnimationVideo.style.opacity = '1';
  }, 100); // Pequeno delay pra garantir que o display: flex tenha efeito

  setTimeout(() => {
    finalAnimation.style.display = 'none';
    finalAnimationVideo.style.opacity = '0'; // Resetar a opacidade pra próxima vez
    finalAnimationVideo.pause();
    finalAnimationVideo.currentTime = 0;
    finalAnimationGif.style.display = 'none';
    console.log('Animação final concluída');

    // Após o GIF, revelar o pet com fade-in
    const petReveal = document.getElementById('pet-reveal');
    const petImage = document.getElementById('pet-image');
    const petMessage = document.getElementById('pet-message');

    petImage.src = `../../Assets/Mons/${newPet.image}`; // Caminho da imagem do pet
    petMessage.textContent = `Parabéns! Você adquiriu ${newPet.name}`;
    petReveal.style.display = 'flex';

    // Fade-in da imagem e mensagem
    setTimeout(() => {
      petImage.style.opacity = '1';
      petMessage.style.opacity = '1';

      // Após o fade-in, aplicar o efeito "pop out!"
      setTimeout(() => {
        petImage.style.transition = 'transform 0.3s ease-in-out';
        petImage.style.transform = 'scale(1.2)';
        setTimeout(() => {
          petImage.style.transform = 'scale(1)';
        }, 300); // Volta ao tamanho normal após 0.3s

        // Após o pop out, esperar um pouco e redirecionar
        setTimeout(() => {
          petReveal.style.display = 'none';
          window.electronAPI.animationFinished();
        }, 3000); // 3 segundos pra apreciar o pet antes de redirecionar
      }, 1000); // 1 segundo após o fade-in pro pop out
    }, 100); // Pequeno delay pra garantir que o display: flex tenha efeito
  }, 7000); // Duração do GIF
}

// Exibir a seleção de nome
function showNameSelection(element) {
  document.getElementById('element-selection').style.display = 'none';

  // Armazenar o elemento escolhido
  selectedElement = element;

  document.getElementById('name-selection').style.display = 'block';

  // Configurar listener do botão criar apenas uma vez
  const createBtn = document.getElementById('create-pet-button');
  createBtn.onclick = handleCreatePet;
}

// Função para lidar com a criação do pet
async function handleCreatePet() {
  const name = document.getElementById('pet-name').value.trim();
  if (!name) {
    alert('Por favor, insira um nome para o pet!');
    return;
  }
  if (name.length > 15) {
    alert('O nome do pet deve ter no máximo 15 caracteres!');
    return;
  }

  // Desabilitar o botão "Criar" pra evitar cliques múltiplos
  document.getElementById('create-pet-button').disabled = true;

  // Esconder a seção de nomeação
  document.getElementById('name-selection').style.display = 'none';

  // Multiplicar a vida por 10
  stats.life *= 10;

  // Gerar espécie e raridade usando o elemento armazenado
  const specie = await generateSpecie(stats, selectedElement);
  const rarity = generateRarity();

  console.log(`Pet gerado: Espécie=${specie}, Elemento=${selectedElement}, Raridade=${rarity}`);

  // Definir a imagem e demais caminhos de acordo com a espécie
  let race = null;
  let statusImage = null;
  let bioImage = `${name}.png`;
  const info = specieData[specie];
  if (info) {
    race = info.race || null;
    if (info.race) {
      const base = info.element
        ? `${info.dir}/${info.element}/${info.race}`
        : `${info.dir}/${info.race}`;
      statusImage = `${base}/front.gif`;
    }
  }
  if (!statusImage) {
    statusImage = specieImages[specie] || 'eggsy.png';
  }
  const image = statusImage;

  const petData = {
    name,
    element: selectedElement,
    attributes: stats,
    specie,
    rarity,
    level: 1,
    experience: 0,
    createdAt: new Date().toISOString(),
    image,
    race,
    bio: '',
    bioImage,
    statusImage,
    hunger: 100,
    happiness: 100,
    currentHealth: stats.life,
    maxHealth: stats.life,
    energy: 100,
    kadirPoints: 10,
    bravura: 10,
  };

  console.log('Pet a ser criado:', petData);

  // Enviar o pedido de criação do pet
  window.electronAPI.createPet(petData);
}

function initQuiz() {
  console.log('Iniciando quiz com', questions.length, 'perguntas disponíveis');
  selectedQuestions.length = 0; // Limpar perguntas antigas
  selectedQuestions.push(...selectRandomQuestions());
  console.log('Selecionadas', selectedQuestions.length, 'perguntas para o quiz');
  showQuestion();
}

function _initDomListeners() {
  const init = async () => {
    const startButton = document.getElementById('start-quiz-button');
    const introContainer = document.getElementById('intro-container');
    const quizContainer = document.getElementById('create-pet-container');

    if (startButton) {
      startButton.addEventListener('click', () => {
        if (introContainer) introContainer.style.display = 'none';
        if (quizContainer) quizContainer.style.display = 'flex';
        loadQuestions();
      });
    }

    // Carrega dados após garantir que listeners principais já estejam ativos
    await loadSpeciesData();

    if (window.electronAPI && window.electronAPI.onPetCreated) {
      window.electronAPI.onPetCreated((newPet) => {
        console.log('Pet criado com sucesso no renderer:', newPet);
        showFinalAnimation(newPet);
      });
    }

    if (window.electronAPI && window.electronAPI.on) {
      window.electronAPI.on('create-pet-error', (event, error) => {
        console.error('Erro ao criar o pet:', error);
        const match = /Limite de (\d+) pets/.exec(error);
        if (match) {
          alert(`Você já possui ${match[1]} pets. Exclua um pet para criar outro.`);
        } else {
          alert('Erro ao criar o pet. Tente novamente.');
        }
        document.getElementById('create-pet-button').disabled = false;
        document.getElementById('name-selection').style.display = 'block';
      });
    }
  };

  // Executa imediatamente para evitar perder DOMContentLoaded quando script é carregado após o DOM
  // Elementos ausentes são ignorados com verificações condicionais
  init();
}

// Iniciar listeners automaticamente apenas se ambiente tiver document real
if (typeof document !== 'undefined' && !(typeof global !== 'undefined' && global.__KADIR_TEST__)) {
  _initDomListeners();
}

// Permite utilizar a função em testes Node.js
if (typeof module !== 'undefined') {
  module.exports = {
    generateSpecie,
    loadSpeciesData,
    loadQuestions,
    generateRarity,
    showQuestion,
    selectOption,
    showElementSelection,
    handleCreatePet,
    showFinalAnimation,
    _initDomListeners,
    resetQuiz,
    initQuiz,
    _setSpecieData: (data) => {
      specieData = data;
    },
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-gift-window');
  const backBtn = document.getElementById('back-gift-window');
  const redeemBtn = document.getElementById('redeem-button');
  const input = document.getElementById('gift-input');
  const alertBox = document.getElementById('gift-alert');
  const modal = document.getElementById('reward-modal');
  const modalDesc = document.getElementById('reward-description');
  const closeModalBtn = document.getElementById('close-reward-modal');
  const historyList = document.getElementById('history-list');

  closeBtn.addEventListener('click', () => {
    window.close();
  });

  backBtn.addEventListener('click', () => {
    window.electronAPI.send('open-tray-window');
    window.close();
  });

  redeemBtn.addEventListener('click', () => {
    const code = input.value.trim();
    if (!code) {
      showAlert('Digite um código válido.');
      return;
    }
    window.electronAPI.send('redeem-gift-code', code);
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    input.value = '';
    loadHistory();
    window.close();
  });

  window.electronAPI.on('gift-redeemed', (event, rewardName) => {
    modalDesc.textContent = `Você adquiriu ${rewardName}`;
    modal.style.display = 'flex';
    alertBox.style.display = 'none';
  });

  window.electronAPI.on('gift-error', (event, message) => {
    showAlert(message);
  });

  function showAlert(msg) {
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 3000);
  }

  function loadHistory() {
    window.electronAPI.invoke('get-gift-history').then((history) => {
      if (!history || history.length === 0) {
        historyList.innerHTML =
          '<p style="text-align:center;color:#aaa;padding:20px;">Nenhum presente resgatado ainda</p>';
        return;
      }

      historyList.innerHTML = '';
      history.forEach((item) => {
        const container = document.createElement('div');
        container.className = 'history-container';

        const header = document.createElement('div');
        header.className = 'history-header';

        const icon = document.createElement('img');
        icon.className = 'history-icon';
        icon.src = item.icon || '../../Assets/Shop/health-potion.png';
        icon.onerror = () => {
          icon.src = '../../Assets/Shop/health-potion.png';
        };

        const info = document.createElement('div');
        info.className = 'history-info';

        const name = document.createElement('div');
        name.className = 'history-name';
        name.textContent = item.name;

        const date = document.createElement('div');
        date.className = 'history-date';
        const dateObj = new Date(item.date);
        date.textContent =
          dateObj.toLocaleDateString('pt-BR') +
          ' ' +
          dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        info.appendChild(name);
        info.appendChild(date);

        const arrow = document.createElement('span');
        arrow.className = 'accordion-arrow';
        arrow.textContent = '▼';

        header.appendChild(icon);
        header.appendChild(info);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.className = 'history-content';
        const desc = document.createElement('p');
        desc.textContent = item.description;
        content.appendChild(desc);

        header.addEventListener('click', () => {
          const isOpen = container.classList.contains('open');
          document
            .querySelectorAll('.history-container')
            .forEach((c) => c.classList.remove('open'));
          if (!isOpen) container.classList.add('open');
        });

        container.appendChild(header);
        container.appendChild(content);
        historyList.appendChild(container);
      });
    });
  }

  loadHistory();
});

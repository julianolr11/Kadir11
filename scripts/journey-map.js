console.log('journey-map.js carregado');

function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-journey-mode')?.addEventListener('click', closeWindow);
    document.getElementById('back-journey-mode')?.addEventListener('click', () => {
        window.electronAPI?.send('open-battle-mode-window');
        window.close();
    });

    const tooltip = document.getElementById('map-tooltip');
    const tooltipImg = tooltip.querySelector('img');
    const tooltipName = tooltip.querySelector('.tooltip-name');

    const eventModal = document.getElementById('event-modal');
    const eventModalIcon = document.getElementById('event-modal-icon');
    const eventModalText = document.getElementById('event-modal-text');
    const eventModalClose = document.getElementById('event-modal-close');
    eventModalClose?.addEventListener('click', () => {
        if (eventModal) eventModal.style.display = 'none';
    });

    const petMarker = document.getElementById('pet-thumbnail');
    let currentPet = null;

    function setImageWithFallback(imgElement, relativePath) {
        if (!imgElement) return;
        if (!relativePath) {
            imgElement.src = 'Assets/Mons/eggsy.png';
            return;
        }
        const gifSrc = relativePath.endsWith('.gif') ? `Assets/Mons/${relativePath}` : null;
        const pngSrc = gifSrc ? gifSrc.replace(/\.gif$/i, '.png') : `Assets/Mons/${relativePath}`;
        imgElement.onerror = () => {
            if (gifSrc && imgElement.src.endsWith('.gif')) {
                imgElement.src = pngSrc;
            } else if (!imgElement.src.endsWith('eggsy.png')) {
                imgElement.onerror = null;
                imgElement.src = 'Assets/Mons/eggsy.png';
            }
        };
        imgElement.src = gifSrc || pngSrc;
    }

    let itemsData = [];
    fetch('data/items.json').then(r => r.json()).then(d => { itemsData = d; }).catch(() => {});

    function showEventModal(text, icon) {
        if (!eventModal) return;
        if (eventModalIcon) {
            if (icon) {
                eventModalIcon.src = icon;
                eventModalIcon.style.display = 'block';
            } else {
                eventModalIcon.style.display = 'none';
            }
        }
        if (eventModalText) eventModalText.textContent = text;
        eventModal.style.display = 'flex';
    }

    function handleRandomEvent(img) {
        const roll = Math.random() * 100;
        if (roll < 70) {
            localStorage.setItem('journeyPendingAdvance', '1');
            window.electronAPI?.send('open-journey-scene-window', { background: img });
            return true;
        } else if (roll < 85) {
            if (itemsData.length) {
                const item = itemsData[Math.floor(Math.random() * itemsData.length)];
                window.electronAPI?.send('reward-pet', { item: item.id, qty: 1 });
                showEventModal(`Você encontrou 1 ${item.name}!`, item.icon);
            }
        } else if (roll < 95) {
            const coins = Math.floor(Math.random() * 5) + 1;
            window.electronAPI?.send('reward-pet', { coins });
            showEventModal(`Você encontrou ${coins} moedas!`, 'assets/icons/kadircoin.png');
        } else {
            window.electronAPI?.send('reward-pet', { kadirPoints: 1 });
            showEventModal('Você encontrou 1 DNA Kadir!', 'assets/icons/dna-kadir.png');
        }
        return false;
    }

    function positionTooltip(event) {
        let left = event.pageX + 10;
        let top = event.pageY - tooltip.offsetHeight - 10;

        if (left + tooltip.offsetWidth > window.innerWidth) {
            left = window.innerWidth - tooltip.offsetWidth - 10;
        }
        if (left < 0) {
            left = 0;
        }

        if (top < 0) {
            top = event.pageY + 10;
        }
        if (top + tooltip.offsetHeight > window.innerHeight) {
            top = window.innerHeight - tooltip.offsetHeight - 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    const pathPoints = Array.from(document.querySelectorAll('.path-point'));
    const subPoints = Array.from(document.querySelectorAll('.path-subpoint'));

    const route = [
        pathPoints[0], subPoints[0], subPoints[1],
        pathPoints[1], subPoints[2], subPoints[3], subPoints[4], subPoints[5],
        pathPoints[2], subPoints[6], subPoints[7],
        pathPoints[3], subPoints[8], subPoints[9],
        pathPoints[4], subPoints[10], subPoints[11],
        pathPoints[5], subPoints[12], subPoints[13], subPoints[14], subPoints[15], subPoints[16],
        pathPoints[6], subPoints[17], subPoints[18], subPoints[19], subPoints[20],
        pathPoints[7], subPoints[21], subPoints[22], subPoints[23],
        pathPoints[8], subPoints[24], subPoints[25],
        pathPoints[9], pathPoints[10], pathPoints[11]
    ];

    let currentIndex = parseInt(localStorage.getItem('journeyStep') || '0', 10);
    if (currentIndex >= route.length) currentIndex = route.length - 1;

    const pending = localStorage.getItem('journeyPendingAdvance');
    const won = localStorage.getItem('journeyBattleWin');
    if (pending && won === '1') {
        currentIndex = Math.min(currentIndex + 1, route.length - 1);
        localStorage.setItem('journeyStep', String(currentIndex));
        if (currentIndex === route.length - 1) {
            window.electronAPI?.send('journey-complete');
        }
    }
    if (pending) localStorage.removeItem('journeyPendingAdvance');
    if (won) localStorage.removeItem('journeyBattleWin');

    let currentPoint = route[currentIndex];
    if (currentPoint) currentPoint.classList.add('current');

    function positionPetMarker() {
        if (!petMarker || !currentPoint) return;
        const x = parseInt(currentPoint.style.left, 10) || 0;
        const y = parseInt(currentPoint.style.top, 10) || 0;
        petMarker.style.left = `${x + 18}px`;
        petMarker.style.top = `${y - 18}px`;
    }
    positionPetMarker();

    function setCurrent(point) {
        if (currentPoint) currentPoint.classList.remove('current');
        currentPoint = point;
        if (currentPoint) currentPoint.classList.add('current');
        positionPetMarker();
    }

    function advancePoint() {
        if (currentIndex < route.length - 1) {
            currentIndex++;
            localStorage.setItem('journeyStep', String(currentIndex));
            setCurrent(route[currentIndex]);
        }
    }

    function handleBossFight(img) {
        window.electronAPI?.send('open-journey-scene-window', { background: img });
    }

    route.forEach((point, idx) => {
        let nextBackground = '';
        for (let j = idx + 1; j < route.length; j++) {
            if (route[j].classList.contains('path-point')) {
                nextBackground = route[j].dataset.image || '';
                break;
            }
        }
        if (point.classList.contains('path-point')) {
            point.addEventListener('mouseenter', event => {
                const img = point.dataset.image;
                if (!img) return;
                tooltipImg.src = img;
                tooltipName.textContent = point.dataset.name || '';
                tooltip.style.display = 'block';
                positionTooltip(event);
            });
            point.addEventListener('mousemove', event => {
                if (tooltip.style.display !== 'block') return;
                positionTooltip(event);
            });
            point.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
                tooltipName.textContent = '';
            });
        }

        point.addEventListener('click', () => {
            if (idx !== currentIndex) return;
            if (point.classList.contains('path-point')) {
                const img = point.dataset.image;
                if (img) {
                    localStorage.setItem('journeyPendingAdvance', '1');
                    handleBossFight(img);
                }
            } else {
                const startedBattle = handleRandomEvent(nextBackground);
                if (!startedBattle) {
                    advancePoint();
                }
            }
        });
    });

    window.electronAPI?.on('pet-data', (event, data) => {
        if (!data) return;
        currentPet = data;
        if (petMarker) {
            setImageWithFallback(petMarker, currentPet.statusImage || currentPet.image);
            petMarker.style.display = 'block';
            positionPetMarker();
        }
    });
});

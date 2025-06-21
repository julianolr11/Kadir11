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

    document.querySelectorAll('.path-point').forEach(point => {
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
        point.addEventListener('click', () => {
            const img = point.dataset.image;
            if (img) {
                window.electronAPI?.send('open-journey-scene-window', { background: img });
            }
        });
    });

    const stageImages = [
        'Assets/Modes/Journeys/village.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/village.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/mountain.png',
        'Assets/Modes/Journeys/mountain.png',
        'Assets/Modes/Journeys/desert_ruins.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/field_ruins.png',
        'Assets/Modes/Journeys/field_ruins.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/volcano_ruins.png',
        'Assets/Modes/Journeys/volcano_ruins.png',
        'Assets/Modes/Journeys/volcano_ruins.png',
        'Assets/Modes/Journeys/cave_ruin.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/forest.png',
        'Assets/Modes/Journeys/abandoned_city.png',
        'Assets/Modes/Journeys/abandoned_city.png'
    ];

    const subpoints = Array.from(document.querySelectorAll('.path-subpoint'));
    let progress = parseInt(localStorage.getItem('journeyProgress') || '0', 10);
    if (progress < 0) progress = 0;
    if (progress >= subpoints.length) progress = subpoints.length - 1;

    function highlightCurrent() {
        subpoints.forEach(p => p.classList.remove('current-stage'));
        if (subpoints[progress]) {
            subpoints[progress].classList.add('current-stage');
        }
    }

    highlightCurrent();

    const overlay = document.getElementById('journey-action-overlay');
    const overlayText = document.getElementById('journey-action-text');
    const okBtn = document.getElementById('journey-action-ok');
    const cancelBtn = document.getElementById('journey-action-cancel');

    function hideOverlay() { overlay.style.display = 'none'; }

    subpoints.forEach((point, index) => {
        point.addEventListener('click', () => {
            if (index !== progress) return;
            overlayText.textContent = progress === 0 ? 'Iniciar jornada?' : 'Continuar jornada?';
            overlay.style.display = 'flex';
            okBtn.onclick = () => {
                hideOverlay();
                const img = stageImages[progress];
                if (img) {
                    window.electronAPI?.send('open-journey-scene-window', { background: img });
                }
                progress += 1;
                localStorage.setItem('journeyProgress', progress);
                highlightCurrent();
            };
            cancelBtn.onclick = hideOverlay;
        });
    });
});

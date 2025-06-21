window.addEventListener('DOMContentLoaded', () => {
    const { getViewMode, setViewMode } = window.electronAPI;
    const saveBtn = document.getElementById('save-mode');
    const radios = document.querySelectorAll('input[name="view-mode"]');

    getViewMode().then(mode => {
        radios.forEach(r => { r.checked = (mode === 'single' && r.value === 'single') || (mode === 'multi' && r.value === 'multi'); });
    });

    saveBtn.addEventListener('click', async () => {
        const selected = document.querySelector('input[name="view-mode"]:checked').value;
        await setViewMode(selected);
    });
});

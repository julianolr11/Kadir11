const video = document.getElementById('hatch-video');
const container = document.getElementById('pet-container');
const petImage = document.getElementById('pet-image');
const nameInput = document.getElementById('pet-name-input');
const okButton = document.getElementById('pet-name-ok');
let hatchedPet = null;

function showPet() {
    video.style.display = 'none';
    container.style.display = 'flex';
    requestAnimationFrame(() => {
        petImage.style.opacity = '1';
        petImage.style.transform = 'scale(1)';
    });
    nameInput.focus();
}

video?.addEventListener('ended', showPet);
setTimeout(showPet, 7000);

okButton?.addEventListener('click', () => {
    if (!hatchedPet) return;
    const name = nameInput.value.trim();
    if (!name) return;
    if (name.length > 15) {
        alert('O nome do pet deve ter no máximo 15 caracteres!');
        return;
    }
    window.electronAPI.send('rename-pet', { petId: hatchedPet.petId, newName: name });
    window.electronAPI.send('close-hatch-window');
});

nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') okButton.click();
});

window.electronAPI?.on('hatch-data', (e, pet) => {
    hatchedPet = pet;
    const img = pet.statusImage ? `Assets/Mons/${pet.statusImage}` : (pet.image ? `Assets/Mons/${pet.image}` : 'Assets/Mons/eggsy.png');
    petImage.src = img;
    video.currentTime = 0;
    video.play();
});

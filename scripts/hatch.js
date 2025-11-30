const hatchOverlay = document.getElementById('hatch-overlay');
const hatchVideo = document.getElementById('hatch-video');
const hatchVideoGif = document.getElementById('hatch-video-gif');
const hatchName = document.getElementById('hatch-name');
const hatchGif = document.getElementById('hatch-gif');
const hatchInput = document.getElementById('hatch-name-input');
const hatchOk = document.getElementById('hatch-ok');
let hatchedPet = null;

function showHatchAnimation(newPet) {
  if (!hatchOverlay || !hatchVideo || !hatchVideoGif || !hatchName || !hatchGif || !hatchInput)
    return;
  hatchedPet = newPet;
  hatchGif.src = newPet.statusImage
    ? `../../Assets/Mons/${newPet.statusImage}`
    : newPet.image
      ? `../../Assets/Mons/${newPet.image}`
      : '../../Assets/Mons/eggsy.png';
  hatchInput.value = '';
  hatchName.style.display = 'none';
  hatchOverlay.style.display = 'flex';
  hatchVideo.style.display = 'block';
  hatchVideo.style.opacity = '1';
  hatchVideoGif.style.display = 'none';
  hatchVideoGif.style.opacity = '1';
  hatchGif.style.opacity = '0';
  hatchGif.style.transform = 'scale(0.5)';
  hatchVideo.currentTime = 0;
  const playPromise = hatchVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      hatchVideo.style.display = 'none';
      hatchVideoGif.style.display = 'block';
    });
  }
  hatchVideo.onerror = () => {
    hatchVideo.style.display = 'none';
    hatchVideoGif.style.display = 'block';
  };
  const showPet = () => {
    hatchVideo.removeEventListener('ended', showPet);
    hatchVideo.style.opacity = '0';
    hatchVideoGif.style.opacity = '0';
    setTimeout(() => {
      hatchVideo.style.display = 'none';
      hatchVideoGif.style.display = 'none';
      hatchName.style.display = 'flex';
      hatchGif.style.opacity = '1';
      hatchGif.style.transform = 'scale(1)';
      setTimeout(() => {
        hatchGif.style.transition = 'transform 0.2s ease';
        hatchGif.style.transform = 'scale(1) translateY(-20px)';
        setTimeout(() => {
          hatchGif.style.transform = 'scale(1) translateY(0)';
        }, 200);
      }, 500);
      hatchInput.focus();
    }, 500);
  };
  hatchVideo.addEventListener('ended', showPet);
  setTimeout(showPet, 7000);
}

window.addEventListener('DOMContentLoaded', () => {
  hatchOk?.addEventListener('click', () => {
    if (!hatchedPet) return;
    const name = hatchInput.value.trim();
    if (!name) return;
    if (name.length > 15) {
      alert('O nome do pet deve ter no máximo 15 caracteres!');
      return;
    }
    window.electronAPI.send('rename-pet', { petId: hatchedPet.petId, newName: name });
    window.electronAPI.selectPet(hatchedPet.petId);
    hatchedPet = null;
    window.electronAPI.send('close-hatch-window');
  });

  hatchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      hatchOk.click();
    }
  });
});

window.electronAPI?.onPetCreated((newPet) => {
  showHatchAnimation(newPet);
});

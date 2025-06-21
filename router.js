async function navigateTo(page){
  const res = await fetch(page);
  const text = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  // Limpar elementos adicionados anteriormente pelo roteador
  document.head.querySelectorAll('[data-router]').forEach(el => el.remove());

  // Copiar <link> e <style> para o <head> principal
  doc.head.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
    const clone = el.cloneNode(true);
    clone.setAttribute('data-router', '');
    if (clone.tagName.toLowerCase() === 'style') {
      clone.textContent = clone.textContent.replace(/\.\.\//g, '');
    } else if (clone.href && clone.getAttribute('href').startsWith('../')) {
      clone.href = clone.getAttribute('href').replace(/^\.\.\//, '');
    }
    document.head.appendChild(clone);
  });

  const container = document.getElementById('app');
  container.innerHTML = doc.body.innerHTML;

  // Ajustar atributos src e href relativos
  container.querySelectorAll('[src],[href]').forEach(el => {
    const attr = el.hasAttribute('src') ? 'src' : 'href';
    let val = el.getAttribute(attr);
    if (val && val.startsWith('../')) {
      el.setAttribute(attr, val.replace(/^\.\.\//, ''));
    }
  });

  // Ajustar urls em atributos style inline
  container.querySelectorAll('[style]').forEach(el => {
    el.setAttribute('style', el.getAttribute('style').replace(/\.\.\//g, ''));
  });

  container.querySelectorAll('script').forEach(oldScript => {
    const script = document.createElement('script');
    if (oldScript.src) {
      script.src = oldScript.src;
      script.type = oldScript.type || 'text/javascript';
    } else {
      script.textContent = oldScript.textContent;
    }
    oldScript.replaceWith(script);
  });
}
window.navigateTo = navigateTo;
window.addEventListener('DOMContentLoaded',()=>{
  if (window.electronAPI && window.electronAPI.on) {
    window.electronAPI.on('navigate-to', (e, page) => navigateTo(page));
  }
  navigateTo('screens/start.html');
});

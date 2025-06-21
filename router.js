async function navigateTo(page){
  const res = await fetch(page);
  const text = await res.text();
  const container = document.getElementById('app');
  container.innerHTML = text;
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
  navigateTo('screens/start.html');
});

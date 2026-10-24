(() => {
  'use strict';
  const form = document.getElementById('cardUpload');
  const status = document.getElementById('uploadStatus');
  const button = form.querySelector('button');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const file = document.getElementById('card').files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      status.textContent = 'La imagen supera el limite de 10 MB.';
      return;
    }
    button.disabled = true;
    status.textContent = 'Subiendo tarjeta...';
    try {
      const response = await fetch('/api/cards', { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo subir la imagen.');
      form.reset();
      status.textContent = 'Tarjeta subida. Los invitados la recibieron sin recargar la pagina.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
})();

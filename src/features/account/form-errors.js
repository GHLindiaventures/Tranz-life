// Shows a server or validation error next to the field it is about (err.field), or under the form when it is about
// no field in particular. showFieldError(form, null) clears them.
import { $, $$ } from '../../utils/dom.js';

function showFieldError(form, err){
  $$('.ac-ferr', form).forEach(el => { el.textContent = ''; });
  $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));
  let general = $('.ac-form-err', form);
  if (!err){ if (general) general.hidden = true; return; }
  const slot = err.field && $(`.ac-ferr[data-for="${err.field}"]`, form);
  if (slot){
    slot.textContent = err.message;
    const input = form.elements[err.field];
    input?.setAttribute?.('aria-invalid', 'true');
    input?.focus?.();
    return;
  }
  if (!general){
    general = document.createElement('p');
    general.className = 'ac-form-err'; general.setAttribute('role', 'alert');
    form.appendChild(general);
  }
  general.hidden = false; general.textContent = err.message;
}

export { showFieldError };

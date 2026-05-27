const $ = (id) => document.getElementById(id);
const output = $('output');
const statusEl = $('status');

const STORAGE_KEY = 'green-api-credentials';

function restoreCredentials() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.idInstance) $('idInstance').value = saved.idInstance;
    if (saved.apiTokenInstance) $('apiTokenInstance').value = saved.apiTokenInstance;
  } catch {
    /* */
  }
}

function saveCredentials() {
  const data = {
    idInstance: $('idInstance').value.trim(),
    apiTokenInstance: $('apiTokenInstance').value.trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setStatus(code, ok) {
  statusEl.textContent = code === undefined ? '' : `HTTP ${code}`;
  statusEl.className = `status ${ok ? 'ok' : 'err'}`;
}

function render(value) {
  output.value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function payloadFor(method) {
  const base = {
    idInstance: $('idInstance').value.trim(),
    apiTokenInstance: $('apiTokenInstance').value.trim(),
  };
  if (method === 'sendMessage') {
    return { ...base, phoneNumber: $('msgPhone').value.trim(), message: $('message').value };
  }
  if (method === 'sendFileByUrl') {
    return { ...base, phoneNumber: $('filePhone').value.trim(), urlFile: $('urlFile').value.trim() };
  }
  return base;
}

async function callMethod(method, button) {
  saveCredentials();
  setStatus(undefined);
  render('Загрузка…');
  button.disabled = true;

  const raw = payloadFor(method);
  const body = { ...raw };
  if ('phoneNumber' in body) {
    body.chatId = body.phoneNumber;
    delete body.phoneNumber;
  }

  try {
    const res = await fetch(`/api/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    setStatus(res.status, res.ok);
    render(data ?? '(пустой ответ)');
  } catch (err) {
    setStatus('ERR', false);
    render(`Сетевая ошибка: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('.btn[data-method]').forEach((btn) => {
  btn.addEventListener('click', () => callMethod(btn.dataset.method, btn));
});

const toggleToken = $('toggleToken');
if (toggleToken) {
  toggleToken.addEventListener('click', () => {
    const input = $('apiTokenInstance');
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    toggleToken.setAttribute('aria-label', hidden ? 'Скрыть токен' : 'Показать токен');
  });
}

restoreCredentials();

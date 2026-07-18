/* ================= СИСТЕМА НАСТРОЕК ================= */

const EDITABLE_UI_IDS = ['ui', 'abilityBar', 'minimap', 'controls', 'implants', 'weapon'];

const defaultSettings = {
  keybinds: {
    dash: 'shift',
    ability1: '1',
    ability2: '2',
    ability3: '3',
    upgrade: 'p'
  },
  audio: {
    musicVolume: 40,
    uiVolume: 70,
    shootVolume: 80,
    hitVolume: 90
  },
  interface: {
    crtEnabled: true,
    uiElements: {}
  }
};

function getDefaultUIElements() {
  const els = {};
  EDITABLE_UI_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const r = el.getBoundingClientRect();
      els[id] = { x: r.left, y: r.top, scale: 1, rotation: 0, visible: el.style.display !== 'none' };
    } else {
      els[id] = { x: 0, y: 0, scale: 1, rotation: 0, visible: true };
    }
  });
  return els;
}

let gameSettings = JSON.parse(JSON.stringify(defaultSettings));
let isUIMode = false;
let selectedUIElement = null;
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;

// Флаги меню должны быть доступны из input/main/lobby независимо от порядка загрузки
window.settingsOpen = window.settingsOpen ?? false;
window.skillMenuOpen = window.skillMenuOpen ?? false;
window.pauseOpen = window.pauseOpen ?? false;
window.gamePaused = window.gamePaused ?? false;


function loadSettings() {
  const saved = localStorage.getItem('cyberMassacreSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameSettings.keybinds = { ...defaultSettings.keybinds, ...parsed.keybinds };
      gameSettings.audio = { ...defaultSettings.audio, ...parsed.audio };
      gameSettings.interface = { ...defaultSettings.interface, ...parsed.interface };
      if (!gameSettings.interface.uiElements || Object.keys(gameSettings.interface.uiElements).length === 0) {
        gameSettings.interface.uiElements = getDefaultUIElements();
      }
    } catch(e) {
      gameSettings.interface.uiElements = getDefaultUIElements();
    }
  } else {
    gameSettings.interface.uiElements = getDefaultUIElements();
  }
  applySettings();
}

function applySettings() {
  document.querySelectorAll('.key-btn').forEach(btn => {
    const action = btn.dataset.action;
    if (gameSettings.keybinds[action]) {
      btn.textContent = formatKeyName(gameSettings.keybinds[action]);
    }
  });
  document.querySelectorAll('.slider-row input[type="range"]').forEach(input => {
    const setting = input.dataset.setting;
    if (gameSettings.audio[setting] !== undefined) {
      input.value = gameSettings.audio[setting];
      input.nextElementSibling.textContent = gameSettings.audio[setting] + '%';
    }
  });
  if (typeof ytPlayer !== 'undefined' && ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(gameSettings.audio.musicVolume);
  }
  const crt = document.getElementById('crtToggle');
  if (crt) crt.checked = gameSettings.interface.crtEnabled;
  const crtOverlay = document.getElementById('crt-overlay');
  if (crtOverlay) crtOverlay.style.display = gameSettings.interface.crtEnabled ? 'block' : 'none';
  applyUIPositions();
}

function formatKeyName(key) {
  if (key === 'mouse0') return 'ЛКМ';
  if (key === 'mouse1') return 'ПКМ';
  if (key === ' ') return 'SPACE';
  if (key === 'shift') return 'SHIFT';
  if (key === 'escape') return 'ESC';
  return key.toUpperCase();
}

function saveSettings() {
  localStorage.setItem('cyberMassacreSettings', JSON.stringify(gameSettings));
}

function saveSettingsAndClose() {
  saveSettings();
  toggleSettings();
}

function toggleSettings() {
  window.settingsOpen = !window.settingsOpen;

  const menu = document.getElementById('settingsMenu');
  if (!menu) return;

  if (window.settingsOpen) {
    if (window.skillMenuOpen && typeof toggleSkillMenu === 'function') toggleSkillMenu();
    if (window.pauseOpen) {
      window.pauseOpen = false;
      const pMenu = document.getElementById('pauseMenu');
      if (pMenu) pMenu.classList.remove('show');
    }

    menu.classList.add('show');
    window.gamePaused = true;
    if (typeof playSound === 'function') playSound('ui_menu_open');
  } else {
    menu.classList.remove('show');
    window.gamePaused = false;
    if (typeof playSound === 'function') playSound('ui_menu_close');
  }

  // подстраховка: синхронизируем локальные переменные (если они где-то объявлены)
  if (typeof gamePaused !== 'undefined') gamePaused = window.gamePaused;
}

function openSettingsFromPause() {
  window.pauseOpen = false;
  window.gamePaused = false;
  const pMenu = document.getElementById('pauseMenu');
  if (pMenu) pMenu.classList.remove('show');

  if (typeof gamePaused !== 'undefined') gamePaused = window.gamePaused;
  toggleSettings();
}

function switchTab(tabName, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  btn.classList.add('active');
}

function startRebind(btn) {
  if (isRebinding) return;
  isRebinding = true;
  btn.classList.add('listening');
  btn.textContent = '...';

  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let key;
    if (e.type === 'mousedown') {
      key = e.button === 0 ? 'mouse0' : (e.button === 2 ? 'mouse1' : 'mouse' + e.button);
    } else {
      key = e.key.toLowerCase();
      if (key === ' ') key = ' ';
      if (key === 'shift') key = 'shift';
    }
    const action = btn.dataset.action;
    gameSettings.keybinds[action] = key;
    btn.textContent = formatKeyName(key);
    btn.classList.remove('listening');
    isRebinding = false;
    document.removeEventListener('keydown', handler, true);
    document.removeEventListener('mousedown', handler, true);
  };

  setTimeout(() => {
    document.addEventListener('keydown', handler, true);
    document.addEventListener('mousedown', handler, true);
  }, 50);
}

function updateAudioSetting(input) {
  const setting = input.dataset.setting;
  const value = parseInt(input.value);
  gameSettings.audio[setting] = value;
  input.nextElementSibling.textContent = value + '%';
  if (setting === 'musicVolume' && typeof ytPlayer !== 'undefined' && ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(value);
  }
}

function toggleCRT(enabled) {
  gameSettings.interface.crtEnabled = enabled;
  document.getElementById('crt-overlay').style.display = enabled ? 'block' : 'none';
}

function exportConfig() {
  const json = JSON.stringify(gameSettings, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    showMsg('КОНФИГ СКОПИРОВАН!', '#0f0');
  }).catch(() => {
    prompt('Скопируйте конфиг:', json);
  });
}

function importConfig() {
  const input = prompt('Вставьте JSON конфигурации:');
  if (input) {
    try {
      const parsed = JSON.parse(input);
      gameSettings.keybinds = { ...defaultSettings.keybinds, ...parsed.keybinds };
      gameSettings.audio = { ...defaultSettings.audio, ...parsed.audio };
      gameSettings.interface = { ...defaultSettings.interface, ...parsed.interface };
      if (!gameSettings.interface.uiElements) gameSettings.interface.uiElements = getDefaultUIElements();
      applySettings();
      saveSettings();
      showMsg('КОНФИГ ЗАГРУЖЕН!', '#0f0');
    } catch (e) {
      showMsg('ОШИБКА: НЕВЕРНЫЙ JSON!', '#f00');
    }
  }
}

function applyKeybinds() {
  const kb = gameSettings.keybinds;
  window.KEYBINDS = {
    dash: kb.dash,
    ability1: kb.ability1,
    ability2: kb.ability2,
    ability3: kb.ability3,
    upgrade: kb.upgrade
  };
}

/* ================= РЕДАКТОР ИНТЕРФЕЙСА ================= */

function toggleUIMode() {
  isUIMode = !isUIMode;
  const overlay = document.getElementById('uiEditorOverlay');

  if (isUIMode) {
    toggleSettings();

    setTimeout(() => {
      overlay.classList.add('active');

      EDITABLE_UI_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const data = gameSettings.interface.uiElements[id];
        if (!data) return;

        el.classList.add('ui-element-editable');
        el.style.position = 'fixed';
        el.style.left = data.x + 'px';
        el.style.top = data.y + 'px';
        el.style.zIndex = '360';

        if (!data.visible) el.classList.add('hidden-ui');

        el.addEventListener('mousedown', onUIEditorMouseDown);
        el.addEventListener('click', onUIEditorClick);
      });
    }, 100);
  } else {
    exitUIMode();
  }
}

function exitUIMode() {
  isUIMode = false;
  document.getElementById('uiEditorOverlay').classList.remove('active');

  EDITABLE_UI_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('ui-element-editable', 'selected', 'hidden-ui');
    el.removeEventListener('mousedown', onUIEditorMouseDown);
    el.removeEventListener('click', onUIEditorClick);
  });

  selectedUIElement = null;
  applyUIPositions();
  saveSettings();
}

function onUIEditorClick(e) {
  if (!isUIMode) return;
  e.stopPropagation();

  document.querySelectorAll('.ui-element-editable').forEach(el => el.classList.remove('selected'));
  selectedUIElement = e.currentTarget;
  selectedUIElement.classList.add('selected');

  const id = selectedUIElement.id;
  const data = gameSettings.interface.uiElements[id];
  document.getElementById('uiScale').value = data.scale;
  document.getElementById('uiRotation').value = data.rotation;
}

function onUIEditorMouseDown(e) {
  if (!isUIMode) return;
  if (e.target.tagName === 'INPUT') return;
  e.preventDefault();
  e.stopPropagation();

  selectedUIElement = e.currentTarget;
  isDragging = true;

  const rect = selectedUIElement.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  document.addEventListener('mousemove', onUIDrag);
  document.addEventListener('mouseup', onUIStopDrag);
}

function onUIDrag(e) {
  if (!isDragging || !selectedUIElement) return;

  const x = e.clientX - dragOffsetX;
  const y = e.clientY - dragOffsetY;

  selectedUIElement.style.left = x + 'px';
  selectedUIElement.style.top = y + 'px';

  const id = selectedUIElement.id;
  gameSettings.interface.uiElements[id].x = x;
  gameSettings.interface.uiElements[id].y = y;
}

function onUIStopDrag() {
  isDragging = false;
  document.removeEventListener('mousemove', onUIDrag);
  document.removeEventListener('mouseup', onUIStopDrag);
}

function updateSelectedUI() {
  if (!selectedUIElement) return;
  const id = selectedUIElement.id;
  const scale = parseFloat(document.getElementById('uiScale').value);
  const rotation = parseInt(document.getElementById('uiRotation').value);

  selectedUIElement.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  gameSettings.interface.uiElements[id].scale = scale;
  gameSettings.interface.uiElements[id].rotation = rotation;
}

function toggleUIElementVisibility() {
  if (!selectedUIElement) return;
  const id = selectedUIElement.id;
  const isVisible = !gameSettings.interface.uiElements[id].visible;

  gameSettings.interface.uiElements[id].visible = isVisible;
  selectedUIElement.classList.toggle('hidden-ui', !isVisible);
}

function applyUIPositions() {
  const els = gameSettings.interface.uiElements;
  if (!els) return;

  for (const [id, data] of Object.entries(els)) {
    const el = document.getElementById(id);
    if (!el || isUIMode) continue;
    el.style.position = 'fixed';
    el.style.left = data.x + 'px';
    el.style.top = data.y + 'px';
    el.style.transform = `scale(${data.scale}) rotate(${data.rotation}deg)`;
    el.style.display = data.visible ? '' : 'none';
  }
}

window.toggleSettings = toggleSettings;
window.openSettingsFromPause = openSettingsFromPause;
window.switchTab = switchTab;
window.startRebind = startRebind;
window.updateAudioSetting = updateAudioSetting;
window.toggleCRT = toggleCRT;
window.exportConfig = exportConfig;
window.importConfig = importConfig;
window.saveSettingsAndClose = saveSettingsAndClose;
window.loadSettings = loadSettings;
window.applyKeybinds = applyKeybinds;
window.toggleUIMode = toggleUIMode;
window.exitUIMode = exitUIMode;
window.updateSelectedUI = updateSelectedUI;
window.toggleUIElementVisibility = toggleUIElementVisibility;

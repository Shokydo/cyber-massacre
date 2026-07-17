/* ================= СИСТЕМА НАСТРОЕК ================= */

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
    crtEnabled: true
  }
};

let gameSettings = JSON.parse(JSON.stringify(defaultSettings));

function loadSettings() {
  const saved = localStorage.getItem('neonRogueSettings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      gameSettings.keybinds = { ...defaultSettings.keybinds, ...parsed.keybinds };
      gameSettings.audio = { ...defaultSettings.audio, ...parsed.audio };
      gameSettings.interface = { ...defaultSettings.interface, ...parsed.interface };
    } catch(e) {}
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
  localStorage.setItem('neonRogueSettings', JSON.stringify(gameSettings));
}

function saveSettingsAndClose() {
  saveSettings();
  toggleSettings();
}

function toggleSettings() {
  settingsOpen = !settingsOpen;
  const menu = document.getElementById('settingsMenu');
  if (settingsOpen) {
    if (skillMenuOpen) toggleSkillMenu();
    if (pauseOpen) { pauseOpen = false; document.getElementById('pauseMenu').classList.remove('show'); }
    menu.classList.add('show');
    gamePaused = true;
    playSound('ui_menu_open');
  } else {
    menu.classList.remove('show');
    gamePaused = false;
    playSound('ui_menu_close');
  }
}

function openSettingsFromPause() {
  pauseOpen = false;
  gamePaused = false;
  document.getElementById('pauseMenu').classList.remove('show');
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

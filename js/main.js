// --- YouTube Music ---
let ytPlayer;
const MUSIC_LOBBY = 'AF8LSurfct4';
const MUSIC_GAME = 'y1qem-LI3Hs';

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-player', {
    height: '0', width: '0',
    videoId: MUSIC_LOBBY,
    playerVars: { autoplay: 1, loop: 1, playlist: MUSIC_LOBBY, controls: 0, disablekb: 1 },
    events: {
      onReady: (e) => { e.target.setVolume(40); e.target.playVideo(); }
    }
  });
}

function changeMusic(videoId) {
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(videoId);
    ytPlayer.setVolume(40);
  }
}

function loop() {
  if (!gamePaused) { update(); draw(); }
  if (gameRunning) requestAnimationFrame(loop); else draw();
}

// --- Pause Menu ---
let pauseOpen = false;

function togglePause() {
  if (!gameRunning || skillMenuOpen) return;
  pauseOpen = !pauseOpen;
  gamePaused = pauseOpen;
  document.getElementById('pauseMenu').classList.toggle('show', pauseOpen);
}

function resumeGame() {
  pauseOpen = false;
  gamePaused = false;
  document.getElementById('pauseMenu').classList.remove('show');
}

function openSkillsFromPause() {
  pauseOpen = false;
  gamePaused = false;
  document.getElementById('pauseMenu').classList.remove('show');
  toggleSkillMenu();
}

function showMsg(text, color) {
  const container = document.getElementById('notifications');
  const el = document.createElement('div');
  el.className = 'notif';
  el.textContent = text;
  el.style.color = color || '#ff0';
  el.style.borderColor = color || '#ff0';
  container.prepend(el);

  while (container.children.length > 6) {
    container.lastChild.remove();
  }

  setTimeout(() => el.classList.add('fading'), 1400);
  setTimeout(() => el.remove(), 2200);
}

function dist(x1,y1,x2,y2) { return Math.hypot(x1-x2,y1-y2); }
function pointLineDist(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A*C + B*D;
  const lenSq = C*C + D*D;
  let t = lenSq !== 0 ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t*C), py - (y1 + t*D));
}

window.loop = loop;
window.startGame = startGame;
window.enterLobby = enterLobby;
window.throwKnife = throwKnife;
window.tryAbility1 = tryAbility1;
window.tryAbility2 = tryAbility2;
window.tryUlt = tryUlt;
window.toggleSkillMenu = toggleSkillMenu;
window.changeAbility = changeAbility;
window.resumeGame = resumeGame;
window.openSkillsFromPause = openSkillsFromPause;
window.takePickup = takePickup;
window.skipPickup = skipPickup;
window.playSound = playSound;

// Bootstrapping functions to resolve async definition issues
window.onerror = function(msg, url, line) {
  if (msg.includes('window\\.fullScreen') || msg.includes('Window\\.fullScreen') ||
      msg.includes('InstallTrigger') || msg.includes('onmozfullscreenchange')) {
    console.log('Ignoring deprecated browser API error:', msg);
    return true;
  }
  return false;
};

window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, ensuring global functions are available...');
  
  // Ensure all required functions are available globally
  if (typeof window.startGame !== 'function' || typeof window.playSound !== 'function') {
    console.log('Functions not yet available, initializing...');
    // This will trigger when the main script loads
  }
});
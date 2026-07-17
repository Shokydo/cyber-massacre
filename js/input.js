document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (lobbyActive) {
    if (k === 'e' || k === 'у') { e.preventDefault(); lobbySelectClass(); }
    return;
  }
  if (k === 'shift') tryDash();
  if (k === '1') tryAbility1();
  if (k === '2') tryAbility2();
  if (k === '3') tryUlt();
  if (k === 'p' || k === 'з') { e.preventDefault(); toggleSkillMenu(); }
  if (k === 'f' || k === 'а') { if (pendingPickup) takePickup(); }
  if (k === 'escape') {
    e.preventDefault();
    if (skillMenuOpen) { toggleSkillMenu(); }
    else if (pendingPickup) { skipPickup(); }
    else if (gameRunning) { togglePause(); }
  }
  if (e.code === 'Space') { e.preventDefault(); if (!player.charging) tryAttack(); }
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  keys[k] = false;
  if (e.button === 0 && playerClass === 'tech' && player.charging) fireCharged();
});
cv.addEventListener('mousemove', e => {
  const r = cv.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width) + camera.x;
  mouse.y = (e.clientY - r.top) * (H / r.height) + camera.y;
});
cv.addEventListener('mousedown', e => {
  if (e.button === 0) {
    mouse.down = true;
  }
  if (e.button === 2) {
    e.preventDefault();
    if (playerClass === 'melee') {
      throwKnife();
    } else if (playerClass === 'tech') {
      techieShield.active = true;
      techieShield.broken = false;
    }
  }
});
cv.addEventListener('mouseup', e => {
  if (e.button === 0) {
    mouse.down = false;
  }
  if (e.button === 2) {
    if (playerClass === 'tech') {
      techieShield.active = false;
      if (techieShield.hp <= 0) {
        techieShield.broken = true;
        techieShield.cooldown = 180;
      }
    }
  }
});
cv.addEventListener('contextmenu', e => e.preventDefault());
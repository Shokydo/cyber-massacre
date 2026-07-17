function drawFloorTexture() {
  const gridSize = 80;
  const offsetX = camera.x % gridSize;
  const offsetY = camera.y % gridSize;

  ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -offsetX; x < W; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = -offsetY; y < H; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();

  if (floorImgLoaded) {
    const tileSize = 256;
    const startX = Math.floor(camera.x / tileSize) * tileSize;
    const startY = Math.floor(camera.y / tileSize) * tileSize;
    ctx.globalAlpha = 0.08;
    for (let x = startX; x < camera.x + W; x += tileSize) {
      for (let y = startY; y < camera.y + H; y += tileSize) {
        ctx.drawImage(floorImg, x - camera.x, y - camera.y, tileSize, tileSize);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function draw() {
  ctx.fillStyle = '#05000d';
  ctx.fillRect(0,0,W,H);
  drawFloorTexture();
  
  const sx = (Math.random()-0.5) * shake;
  const sy = (Math.random()-0.5) * shake;
  ctx.save();
  ctx.translate(sx, sy);
  
  worldObjects.forEach(o => {
    const sx = o.x - camera.x, sy = o.y - camera.y;
    if (sx < -20 || sx > W+20 || sy < -20 || sy > H+20) return;
    ctx.save();
    ctx.translate(sx, sy);
    if (o.rot) ctx.rotate(o.rot);
    if (o.glow) { ctx.shadowColor = o.color; ctx.shadowBlur = 10 + (o.pulse ? Math.sin(Date.now()*0.005 + o.x*0.01) * 5 : 0); }
    ctx.fillStyle = o.color;
    if (o.type === 'rock' || o.type === 'ruins') { ctx.fillRect(-o.size/2, -o.size/2, o.size, o.size); ctx.fillStyle = '#000'; ctx.fillRect(-o.size/4, -o.size/4, o.size/2, o.size/2); }
    else if (o.type === 'crystal' || o.type === 'energy') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = (Math.PI * 2 / 6) * i; const r = o.size * (0.5 + (o.pulse ? Math.sin(Date.now()*0.01 + o.x*0.01) * 0.3 : 0)); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    } else if (o.type === 'neon_plant') { ctx.fillRect(-2, -o.size, 4, o.size*2); ctx.fillRect(-o.size, -2, o.size*2, 4); }
    else { ctx.fillRect(-o.size/2, -o.size/2, o.size, o.size); }
    ctx.restore();
  });
  
  pickups.forEach(p => {
    const sx = p.x - camera.x, sy = p.y - camera.y;
    if (sx < -20 || sx > W+20 || sy < -20 || sy > H+20) return;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(Date.now() * 0.003);
    if (p.type === 'hp') {
      ctx.fillStyle = '#0f0'; ctx.shadowColor = '#0f0'; ctx.shadowBlur = 15; ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#000'; ctx.shadowBlur = 0; ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-6, -2, 12, 4);
    } else if (p.type === 'implant') {
      const impl = IMPLANT_TYPES.find(i => i.id === p.implantId);
      ctx.fillStyle = impl.color; ctx.shadowColor = impl.color; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, 0); ctx.lineTo(0, 4); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  });
  
  lightningChains.forEach(c => {
    const sx1 = c.x1 - camera.x, sy1 = c.y1 - camera.y, sx2 = c.x2 - camera.x, sy2 = c.y2 - camera.y;
    const alpha = c.life / 40;
    ctx.globalAlpha = alpha; ctx.strokeStyle = c.color; ctx.lineWidth = 3; ctx.shadowColor = c.color; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.moveTo(sx1, sy1);
    let lx = sx1, ly = sy1;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const mx = sx1 + (sx2 - sx1) * t + (Math.random() - 0.5) * 30;
      const my = sy1 + (sy2 - sy1) * t + (Math.random() - 0.5) * 30;
      ctx.lineTo(mx, my); lx = mx; ly = my;
    }
    ctx.lineTo(sx2, sy2); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  });
  
  enemies.forEach(e => {
    const sx = e.x - camera.x, sy = e.y - camera.y;
    if (sx < -50 || sx > W+50 || sy < -50 || sy > H+50) return;
    ctx.save(); ctx.translate(sx, sy);
    if (e.type.alpha) ctx.globalAlpha = e.type.alpha;
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : e.type.color;
    ctx.shadowColor = e.type.color; ctx.shadowBlur = 12;
    const s = e.size;
    if (e.type.tower) {
      ctx.fillRect(-s, -s, s*2, s*2); ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
      ctx.fillRect(-s*0.3, -s*0.3, s*0.6, s*0.6); ctx.fillStyle = e.type.color; ctx.fillRect(-s*0.15, -s*0.15, s*0.3, s*0.3);
      ctx.strokeStyle = e.type.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s + 5, 0, Math.PI*2); ctx.stroke();
    } else {
      ctx.fillRect(-s, -s, s*2, s*2); ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
      ctx.fillRect(-s*0.5, -s*0.3, s*0.3, s*0.3); ctx.fillRect(s*0.2, -s*0.3, s*0.3, s*0.3);
    }
    if (e.type.boss) {
      ctx.fillStyle = '#400'; ctx.fillRect(-40, -s-15, 80, 6);
      ctx.fillStyle = '#f00'; ctx.fillRect(-40, -s-15, 80 * (e.hp/e.maxHp), 6);
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(e.type.name, 0, -s-20);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  });
  
  grenades.forEach(g => {
    const sx = g.x - camera.x, sy = g.y - camera.y;
    ctx.fillStyle = g.color; ctx.shadowColor = g.color; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
  });
  
  turrets.forEach(t => {
    const sx = t.x - camera.x, sy = t.y - camera.y;
    if (sx < -50 || sx > W+50 || sy < -50 || sy > H+50) return;
    const s = t.size;
    ctx.fillStyle = '#ff0'; ctx.shadowColor = '#ff0'; ctx.shadowBlur = 10; ctx.fillRect(sx - s, sy - s, s*2, s*2);
    ctx.fillStyle = '#a80'; ctx.shadowBlur = 0; ctx.fillRect(sx - s*0.5, sy - s*0.5, s, s);
    ctx.fillStyle = '#ff0'; ctx.fillRect(sx - s*0.2, sy - s*0.2, s*0.4, s*0.4);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(sx - s, sy - s, s*2, s*2);
    ctx.fillStyle = '#400'; ctx.fillRect(sx - 15, sy - s - 10, 30, 4);
    ctx.fillStyle = '#f00'; ctx.fillRect(sx - 15, sy - s - 10, 30 * Math.max(0, t.hp / t.maxHp), 4);
  });
  
  turretProjectiles.forEach(p => {
    const sx = p.x - camera.x, sy = p.y - camera.y;
    ctx.fillStyle = '#ff0'; ctx.shadowColor = '#ff0'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
  });
  
  projectiles.forEach(p => {
    const sx = p.x - camera.x, sy = p.y - camera.y;
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 15;
    if (p.type === 'magic') {
      ctx.beginPath(); ctx.arc(sx, sy, p.size, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(sx, sy, p.size*2, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    } else { ctx.fillRect(sx-p.size, sy-p.size, p.size*2, p.size*2); }
    ctx.shadowBlur = 0;
  });
  
  lasers.forEach(l => {
    ctx.strokeStyle = l.color; ctx.shadowColor = l.color; ctx.shadowBlur = 20;
    ctx.lineWidth = l.width * (l.life / 15); ctx.globalAlpha = l.life / 15;
    ctx.beginPath(); ctx.moveTo(l.x1 - camera.x, l.y1 - camera.y); ctx.lineTo(l.x2 - camera.x, l.y2 - camera.y); ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });
  
  particles.forEach(p => {
    const sx = p.x - camera.x, sy = p.y - camera.y;
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.fillRect(sx - p.size/2, sy - p.size/2, p.size, p.size);
    if (p.size > 3) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(sx - p.size/2, sy - p.size/2, p.size, p.size);
      ctx.shadowBlur = 0;
    }
  });
  ctx.globalAlpha = 1;
  
  if (player.tornadoActive > 0) {
    const stats = getPlayerStats();
    const tornadoRadius = stats.range * 0.8 * (1 + player.stats.rangePct / 100 * 0.25);
    const alpha = player.tornadoActive / 90;
    ctx.strokeStyle = `rgba(255,0,255,${alpha * 0.4})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x - camera.x, player.y - camera.y, tornadoRadius, 0, Math.PI*2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = player.tornadoAngle + (Math.PI * 2 / 8) * i;
      const tx = player.x + Math.cos(a) * tornadoRadius - camera.x;
      const ty = player.y + Math.sin(a) * tornadoRadius - camera.y;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = `rgba(255,0,255,${alpha})`; ctx.shadowColor = '#f0f'; ctx.shadowBlur = 10;
      ctx.fillRect(-12, -2, 24, 4); ctx.shadowBlur = 0; ctx.restore();
    }
  }

  if (player.ultActive > 0) {
    const stats = getPlayerStats();
    const swordRadius = stats.range * 1.2;
    const alpha = player.ultActive / 420;
    ctx.strokeStyle = `rgba(255,0,255,${alpha * 0.3})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(player.x - camera.x, player.y - camera.y, swordRadius, 0, Math.PI*2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = player.ultAngle + (Math.PI * 2 / 8) * i;
      const sx = player.x + Math.cos(a) * swordRadius - camera.x;
      const sy = player.y + Math.sin(a) * swordRadius - camera.y;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = '#f0f'; ctx.shadowColor = '#f0f'; ctx.shadowBlur = 15;
      ctx.fillRect(-3, -18, 6, 36); ctx.fillRect(-8, -4, 16, 8); ctx.shadowBlur = 0; ctx.restore();
    }
  }
  
  if (playerClass === 'tech' && player.charging) {
    const charge = Math.min(player.chargeTime / 90, 1);
    ctx.strokeStyle = '#ff0'; ctx.shadowColor = '#ff0'; ctx.shadowBlur = 10 + charge * 20; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x - camera.x, player.y - camera.y, 20 + charge * 15, 0, Math.PI*2 * charge); ctx.stroke(); ctx.shadowBlur = 0;
  }
  
  ctx.save(); ctx.translate(player.x - camera.x, player.y - camera.y); ctx.rotate(player.angle);
  const pColor = player.invuln > 0 && Math.floor(player.invuln/3)%2 ? 'transparent' : classes[playerClass].color;
  ctx.fillStyle = pColor; ctx.shadowColor = classes[playerClass].color; ctx.shadowBlur = 15;
  ctx.fillRect(-player.size, -player.size, player.size*2, player.size*2);
  ctx.fillStyle = classes[playerClass].color; ctx.shadowColor = classes[playerClass].color;
  ctx.fillRect(player.size, -2, 15, 4);
  ctx.fillStyle = '#000'; ctx.shadowBlur = 0; ctx.fillRect(2, -4, 6, 3);
  ctx.restore();
  
  swordSwings.forEach(s => {
    const progress = 1 - s.life / s.maxLife;
    const len = s.angles.length;
    s.angles.forEach((a, idx) => {
      const mappedIdx = s.dir > 0 ? idx : (len - 1 - idx);
      const normalizedIdx = mappedIdx / (len - 1);
      const appear = Math.max(0, Math.min(1, (progress - normalizedIdx * 0.5) * 4));
      if (appear <= 0) return;
      const fadeProgress = Math.max(0, Math.min(1, (progress - 0.4) * 2.5));
      const tailFade = Math.max(0, 1 - normalizedIdx * fadeProgress);
      if (tailFade <= 0) return;
      const px = player.x + Math.cos(a) * s.range, py = player.y + Math.sin(a) * s.range;
      const sx = px - camera.x, sy = py - camera.y;
      for (let k = 0; k < 3; k++) {
        const spread = (Math.random() - 0.5) * 10 * appear;
        const perpX = Math.cos(a + Math.PI / 2) * spread, perpY = Math.sin(a + Math.PI / 2) * spread;
        const pxSize = 5 + Math.random() * 4;
        ctx.fillStyle = `rgba(255,0,255,${tailFade * appear})`;
        ctx.shadowColor = '#f0f'; ctx.shadowBlur = 8 * tailFade;
        ctx.fillRect(sx + perpX - pxSize / 2, sy + perpY - pxSize / 2, pxSize, pxSize);
      }
    });
    ctx.shadowBlur = 0;
  });

  // ЭДЖРАННЕР: Анимация разрез
  if (edgerunnerSlashAnim > 0) {
    const progress = 1 - edgerunnerSlashAnim / 12;
    const slashRadius = player.range * (1 + player.stats.rangePct / 100);
    const arcAngle = Math.PI * 0.6;
    const startAngle = player.angle - arcAngle/2 + (edgerunnerSlashDir > 0 ? 0 : arcAngle);
    
    // Рисуем анимированную дугу разреза
    for (let i = 0; i <= 10; i++) {
      const segProgress = i / 10;
      const animProgress = Math.min(1, progress * 2 - segProgress * 0.5);
      if (animProgress <= 0) continue;
      
      const a = startAngle + arcAngle * segProgress * edgerunnerSlashDir;
      const tailFade = Math.max(0, 1 - segProgress * progress * 1.5);
      if (tailFade <= 0) continue;
      
      const px = player.x + Math.cos(a) * slashRadius * animProgress;
      const py = player.y + Math.sin(a) * slashRadius * animProgress;
      const sx = px - camera.x, sy = py - camera.y;
      
      ctx.fillStyle = `rgba(255,0,255,${tailFade * animProgress * 0.8})`;
      ctx.shadowColor = '#f0f'; ctx.shadowBlur = 15 * tailFade;
      ctx.beginPath();
      ctx.arc(sx, sy, 8 * tailFade, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Полоса разреза (хвост)
    const tailProgress = Math.max(0, progress - 0.3) * 1.5;
    if (tailProgress > 0) {
      ctx.strokeStyle = `rgba(255,0,255,${tailProgress * 0.6})`;
      ctx.lineWidth = 3 * tailProgress;
      ctx.shadowColor = '#f0f'; ctx.shadowBlur = 10 * tailProgress;
      ctx.beginPath();
      ctx.moveTo(
        player.x + Math.cos(startAngle) * slashRadius * 0.3 - camera.x,
        player.y + Math.sin(startAngle) * slashRadius * 0.3 - camera.y
      );
      ctx.lineTo(
        player.x + Math.cos(startAngle + arcAngle * edgerunnerSlashDir) * slashRadius * 0.9 - camera.x,
        player.y + Math.sin(startAngle + arcAngle * edgerunnerSlashDir) * slashRadius * 0.9 - camera.y
      );
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // ЭДЖРАННЕР: Брошенные ножи
  edgerunnerKnives.forEach(knife => {
    const alpha = knife.life / knife.maxLife;
    const sx = knife.x - camera.x;
    const sy = knife.y - camera.y;
    
    // Трейл ножа
    ctx.strokeStyle = `rgba(0,255,255,${alpha * 0.6})`;
    ctx.lineWidth = 4 * alpha;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15 * alpha;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(knife.x - knife.vx * 4 - camera.x, knife.y - knife.vy * 4 - camera.y);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(knife.angle + knife.rotation);
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.shadowColor = '#0ff'; 
    ctx.shadowBlur = 15 * alpha;
    ctx.beginPath();
    ctx.moveTo(-knife.size, -knife.size/3);
    ctx.lineTo(knife.size, -knife.size/3);
    ctx.lineTo(knife.size + 4, 0);
    ctx.lineTo(knife.size, knife.size/3);
    ctx.lineTo(-knife.size, knife.size/3);
    ctx.closePath();
    ctx.fill();
    // Handle
    ctx.fillStyle = `rgba(100,50,20,${alpha})`;
    ctx.fillRect(-knife.size - 2, -1.5, 4, 3);
    ctx.restore();
    
    // Блик на конце
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10 * alpha;
    ctx.beginPath();
    ctx.arc(knife.x + Math.cos(knife.angle) * (knife.size + 2) - camera.x, knife.y + Math.sin(knife.angle) * (knife.size + 2) - camera.y, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  });

// НЕТРАННЕР: Моноструна (хлыст/змейка) - новый визуал
  if (netrunnerMonowire) {
    const alpha = netrunnerMonowire.life / 15;
    const segments = 24;
    const totalLife = 15;
    const progress = 1 - netrunnerMonowire.life / totalLife;
    const extendFrames = 8;
    const holdFrames = 4;
    
    // Определяем текущую длину для отрисовки с затуханием хвоста
    let drawLength = netrunnerMonowire.length;
    let tailFadeStart = 1.0;
    
    if (progress > (extendFrames + holdFrames) / totalLife) {
      // Фаза затухания - хвост исчезает первым
      const retractProgress = (progress - (extendFrames + holdFrames) / totalLife) / (1 - (extendFrames + holdFrames) / totalLife);
      tailFadeStart = 1.0 - retractProgress * 0.8;
    }
    
    // Длина в фазе вылета
    if (progress < extendFrames / totalLife) {
      const phaseProgress = progress / (extendFrames / totalLife);
      drawLength = netrunnerMonowire.maxLength * phaseProgress;
    }
    
    // Рисуем хлыст как линию с волнами
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Слои отрисовки (сверху вниз):
    
    // 1. Внешнее свечение (широкое)
    ctx.strokeStyle = `rgba(170,0,255,${alpha * 0.4})`;
    ctx.lineWidth = 10;
    ctx.shadowColor = '#a0f';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    
    for (let i = 0; i <= segments; i++) {
      const segProgress = i / segments;
      if (segProgress > tailFadeStart) continue;
      
      const waveAmp = 0.35 * (1 - segProgress * 0.5);
      const waveAngle = Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
      const segAngle = netrunnerMonowire.angle + waveAngle;
      const segLen = drawLength * segProgress;
      const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
      const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
      
      if (i === 0) ctx.moveTo(segX, segY);
      else ctx.lineTo(segX, segY);
    }
    ctx.stroke();
    
    // 2. Основная линия (с градиентом ширины и цвета)
    ctx.lineWidth = 8;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const segProgress = i / segments;
      if (segProgress > tailFadeStart) continue;
      
      const waveAmp = 0.35 * (1 - segProgress * 0.5);
      const waveAngle = Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
      const segAngle = netrunnerMonowire.angle + waveAngle;
      const segLen = drawLength * segProgress;
      const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
      const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
      
      if (i === 0) ctx.moveTo(segX, segY);
      else ctx.lineTo(segX, segY);
    }
    // Градиент для основной линии
    const grad = ctx.createLinearGradient(
      netrunnerMonowire.x - camera.x, netrunnerMonowire.y - camera.y,
      netrunnerMonowire.x + Math.cos(netrunnerMonowire.angle) * drawLength - camera.x,
      netrunnerMonowire.y + Math.sin(netrunnerMonowire.angle) * drawLength - camera.y
    );
    grad.addColorStop(0, `rgba(170,0,255,${alpha * 0.9})`);
    grad.addColorStop(0.5, `rgba(208,0,255,${alpha * 0.8})`);
    grad.addColorStop(1, `rgba(255,255,255,${alpha * 0.6})`);
    ctx.strokeStyle = grad;
    ctx.shadowColor = '#a0f';
    ctx.shadowBlur = 20;
    ctx.stroke();
    
    // 3. Яркое ядро (белое)
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const segProgress = i / segments;
      if (segProgress > tailFadeStart) continue;
      
      const waveAmp = 0.35 * (1 - segProgress * 0.5);
      const waveAngle = Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
      const segAngle = netrunnerMonowire.angle + waveAngle;
      const segLen = drawLength * segProgress;
      const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
      const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
      
      if (i === 0) ctx.moveTo(segX, segY);
      else ctx.lineTo(segX, segY);
    }
    ctx.stroke();
    
    // 4. Частицы энергии по длине
    for (let i = 0; i <= segments; i += 2) {
      const segProgress = i / segments;
      if (segProgress > tailFadeStart) continue;
      
      const waveAmp = 0.35 * (1 - segProgress * 0.5);
      const waveAngle = Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
      const segAngle = netrunnerMonowire.angle + waveAngle;
      const segLen = drawLength * segProgress;
      const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
      const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
      
      const pAlpha = alpha * (1 - segProgress * 0.4) * (segProgress < tailFadeStart ? 1 : 0);
      if (pAlpha <= 0) continue;
      
      ctx.fillStyle = `rgba(220,180,255,${pAlpha})`;
      ctx.shadowColor = '#d0f';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(segX, segY, 2.5 * pAlpha, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 5. Ядро у игрока (пульсирующее)
    const coreX = netrunnerMonowire.x - camera.x;
    const coreY = netrunnerMonowire.y - camera.y;
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(coreX, coreY, 8 * pulse, 0, Math.PI * 2); ctx.fill();
    
    // Пульсирующее кольцо
    ctx.strokeStyle = `rgba(170,0,255,${alpha * 0.6})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(coreX, coreY, 12 * pulse, 0, Math.PI * 2); ctx.stroke();
    
    ctx.shadowBlur = 0;
  }

  // НЕТРАННЕР: КИБЕР-ДЕМОН (способность 2) - ромбовидная сущность
  if (netrunnerCyberDemon) {
    const alpha = netrunnerCyberDemon.life / netrunnerCyberDemon.maxLife;
    const sx = netrunnerCyberDemon.x - camera.x;
    const sy = netrunnerCyberDemon.y - camera.y;
    
    ctx.save();
    ctx.translate(sx, sy);
    
    // Свечение
    ctx.shadowColor = '#a0f';
    ctx.shadowBlur = 20;
    
    // Ромб (основная форма)
    ctx.fillStyle = `rgba(170,0,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    
    // Внутреннее ядро
    ctx.fillStyle = `rgba(255,100,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    
    // Трейл позади
    for (let i = 0; i < 5; i++) {
      const trailAngle = netrunnerCyberDemon.angle - i * 0.3;
      const trailX = Math.cos(trailAngle) * 15 * i;
      const trailY = Math.sin(trailAngle) * 15 * i;
      ctx.globalAlpha = alpha * (1 - i * 0.15);
      ctx.fillStyle = '#a0f';
      ctx.fillRect(trailX - 3, trailY - 3, 6, 6);
    }
    
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // НЕТРАННЕР: ЧЁРНАЯ СТЕНА (ультра) - wireframe на врагах
  if (netrunnerBlackwallActive) {
    enemies.forEach(e => {
      if (e.blackwallHacked && !e.dead) {
        const sx = e.x - camera.x;
        const sy = e.y - camera.y;
        
        ctx.save();
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.7;
        
        // Wireframe прямоугольник вокруг врага
        const size = e.size + 5;
        ctx.strokeRect(sx - size, sy - size, size * 2, size * 2);
        
        // Диагональные линии
        ctx.beginPath();
        ctx.moveTo(sx - size, sy - size);
        ctx.lineTo(sx + size, sy + size);
        ctx.moveTo(sx + size, sy - size);
        ctx.lineTo(sx - size, sy + size);
        ctx.stroke();
        
        // Текст "ВЗЛОМ"
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ВЗЛОМ', sx, sy - size - 8);
        
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;
  }

  // Wireframe для взломанных/уязвимых врагов (от способности 1)
  enemies.forEach(e => {
    if ((e.hacked || e.vulnerable) && !e.dead && !e.blackwallHacked) {
      const sx = e.x - camera.x;
      const sy = e.y - camera.y;
      
      ctx.save();
      ctx.strokeStyle = e.hacked ? '#f00' : '#f0f';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = e.hacked ? '#f00' : '#f0f';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.5;
      
      const size = e.size + 3;
      ctx.strokeRect(sx - size, sy - size, size * 2, size * 2);
      
      ctx.restore();
    }
  });
  ctx.globalAlpha = 1;

  // ТЕХНИК: Щит (круг вокруг игрока)
  if (playerClass === 'tech' && techieShield.active && techieShield.hp > 0) {
    const shieldPct = techieShield.hp / techieShield.maxHp;
    const shieldRadius = 45;
    
    ctx.save();
    ctx.translate(player.x - camera.x, player.y - camera.y);
    
    // Пульсация
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.05;
    
    // Основной щит (круг)
    const shieldAlpha = 0.35 + shieldPct * 0.25;
    ctx.globalAlpha = shieldAlpha;
    ctx.fillStyle = `rgba(0,255,255,${shieldAlpha})`;
    ctx.shadowColor = '#0ff'; 
    ctx.shadowBlur = 25 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Внутреннее свечение
    ctx.fillStyle = `rgba(100,255,255,${shieldAlpha * 0.5})`;
    ctx.shadowBlur = 15 * pulse;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius * 0.6 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Граница щита
    ctx.strokeStyle = shieldPct > 0.5 ? '#0ff' : (shieldPct > 0.2 ? '#ff0' : '#f00');
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius * pulse, 0, Math.PI * 2);
    ctx.stroke();
    
    // Внутренняя граница
    ctx.strokeStyle = `rgba(100,255,255,${shieldAlpha})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius * 0.7 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    
    // Треснуты если сломан
    if (techieShield.broken) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#f00';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i + Date.now() * 0.001;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * shieldRadius * 0.3, Math.sin(a) * shieldRadius * 0.3);
        ctx.lineTo(Math.cos(a) * shieldRadius, Math.sin(a) * shieldRadius);
        ctx.stroke();
      }
    }
    
    ctx.restore();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  // ТЕХНИК: ТУРЕЛЬ (1)
  if (techieTurret) {
    const alpha = techieTurret.life / techieTurret.maxLife;
    const sx = techieTurret.x - camera.x;
    const sy = techieTurret.y - camera.y;
    const size = 18;

    ctx.save();
    ctx.translate(sx, sy);

    // Основание
    ctx.fillStyle = `rgba(255,200,0,${alpha})`;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    ctx.fillRect(-size, -size, size * 2, size * 2);

    // Ствол
    ctx.rotate(techieTurret.angle);
    ctx.fillStyle = `rgba(255,150,0,${alpha})`;
    ctx.fillRect(0, -3, size * 1.5, 6);

    ctx.restore();

    // Полоска HP
    const hpPct = techieTurret.hp / techieTurret.maxHp;
    ctx.fillStyle = '#400';
    ctx.fillRect(sx - 20, sy - size - 10, 40, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#0f0' : (hpPct > 0.2 ? '#ff0' : '#f00');
    ctx.fillRect(sx - 20, sy - size - 10, 40 * hpPct, 4);

    ctx.shadowBlur = 0;
  }

  // ТЕХНИК: БОЕВОЙ ДРОН (2)
  if (techieCombatDrone) {
    const alpha = techieCombatDrone.life / techieCombatDrone.maxLife;

    techieCombatDrone.drones.forEach(drone => {
      const sx = drone.x - camera.x;
      const sy = drone.y - camera.y;

      ctx.save();
      ctx.translate(sx, sy);

      // Свечение
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 20;

      // Ромб дрона
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();

      // Ядро
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
    ctx.shadowBlur = 0;
  }

  // ТЕХНИК: МЕХ-КОСТЮМ (УЛЬТА)
  if (techieExosuitActive) {
    const alpha = techieExosuitTimer / 480;

    // Трейлы
    techieExosuitTrail.forEach(t => {
      const trailAlpha = t.life / 20 * 0.3;
      ctx.fillStyle = `rgba(255,200,0,${trailAlpha})`;
      ctx.fillRect(t.x - camera.x - 10, t.y - camera.y - 10, 20, 20);
    });

    // Свечение вокруг игрока
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;

    ctx.strokeStyle = `rgba(255,200,0,${alpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 25 * pulse;
    ctx.beginPath();
    ctx.arc(sx, sy, 35 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Таймер
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    ctx.fillText((techieExosuitTimer / 60).toFixed(1), sx, sy - 50);

    ctx.shadowBlur = 0;
  }

  // ТЕХНИК: Пистолетные выстрелы (трейлы)
  techiePistolShots.forEach(shot => {
    const alpha = shot.life / 50;
    const sx = shot.x + Math.cos(shot.angle) * shot.traveled - camera.x;
    const sy = shot.y + Math.sin(shot.angle) * shot.traveled - camera.y;
    
    // Короткий трейл только позади пули
    const trailLen = Math.min(shot.traveled, 40);
    ctx.strokeStyle = shot.isCrit ? '#fff' : '#ff0';
    ctx.lineWidth = 2 * alpha;
    ctx.shadowColor = shot.isCrit ? '#fff' : '#ff0';
    ctx.shadowBlur = 8 * alpha;
    ctx.globalAlpha = alpha * 0.6;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(shot.angle) * trailLen, sy - Math.sin(shot.angle) * trailLen);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    
    // Сама пуля - маленькая
    ctx.fillStyle = shot.isCrit ? '#fff' : '#ff0';
    ctx.shadowBlur = 6;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  });

  ability1Trails.forEach(t => {
    const alpha = t.life / t.maxLife;
    for (let i = 1; i < t.points.length; i++) {
      const segAlpha = alpha * (i / t.points.length);
      ctx.strokeStyle = t.color; ctx.globalAlpha = segAlpha; ctx.shadowColor = t.color; ctx.shadowBlur = 10 * segAlpha; ctx.lineWidth = 6 * segAlpha;
      ctx.beginPath(); ctx.moveTo(t.points[i-1].x - camera.x, t.points[i-1].y - camera.y);
      ctx.lineTo(t.points[i].x - camera.x, t.points[i].y - camera.y); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });

  ability1Impact.forEach(t => {
    const alpha = t.life / t.maxLife;
    const progress = 1 - alpha;
    const radius = 30 + progress * 40;
    ctx.strokeStyle = t.color; ctx.globalAlpha = alpha; ctx.shadowColor = t.color; ctx.shadowBlur = 15 * alpha; ctx.lineWidth = 3 * alpha;
    ctx.beginPath(); ctx.arc(t.x - camera.x, t.y - camera.y, radius, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i + progress * 0.5;
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x - camera.x + Math.cos(a) * radius * 0.8 - 2, t.y - camera.y + Math.sin(a) * radius * 0.8 - 2, 4, 4);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });

  railgunBeams.forEach(b => {
    const alpha = b.life / b.maxLife;
    const fade = b.life < 30 ? b.life / 30 : 1;
    ctx.strokeStyle = b.color; ctx.globalAlpha = alpha * fade; ctx.shadowColor = b.color; ctx.shadowBlur = 20 * fade; ctx.lineWidth = b.width * fade;
    ctx.beginPath(); ctx.moveTo(b.x1 - camera.x, b.y1 - camera.y); ctx.lineTo(b.x2 - camera.x, b.y2 - camera.y); ctx.stroke();
    ctx.lineWidth = b.width * 0.3 * fade; ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(b.x1 - camera.x, b.y1 - camera.y); ctx.lineTo(b.x2 - camera.x, b.y2 - camera.y); ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });
  
  burnZones.forEach(z => {
    const sx = z.x - camera.x, sy = z.y - camera.y;
    if (sx < -z.radius || sx > W+z.radius || sy < -z.radius || sy > H+z.radius) return;
    const alpha = Math.min(1, z.life / 60) * 0.35;
    const pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    ctx.globalAlpha = alpha * pulse; ctx.fillStyle = '#f40'; ctx.shadowColor = '#f40'; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(sx, sy, z.radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  });

  damageZones.forEach(z => {
    if (z.life > 0 && z.life < 40 && !z.exploded) {
      const sx = z.x - camera.x, sy = z.y - camera.y;
      if (sx < -z.radius || sx > W+z.radius || sy < -z.radius || sy > H+z.radius) return;
      const progress = 1 - z.life / 40;
      ctx.globalAlpha = 1 - progress; ctx.strokeStyle = '#0ff'; ctx.lineWidth = 3; ctx.shadowColor = '#0ff'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(sx, sy, z.radius * (0.5 + progress * 0.5), 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    if (z.type === 'trail' && z.life > 0) {
      const sx = z.x - camera.x, sy = z.y - camera.y;
      if (sx < -z.radius || sx > W+z.radius || sy < -z.radius || sy > H+z.radius) return;
      const alpha = Math.min(1, z.life / 30) * 0.4;
      ctx.globalAlpha = alpha; ctx.fillStyle = '#0ff'; ctx.shadowColor = '#0ff'; ctx.shadowBlur = 8;
      ctx.fillRect(sx - z.radius / 2, sy - z.radius / 2, z.radius, z.radius);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  });
  
  ctx.strokeStyle = classes[playerClass].color; ctx.shadowColor = classes[playerClass].color; ctx.shadowBlur = 10; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(mouse.x - camera.x, mouse.y - camera.y, 8, 0, Math.PI*2);
  ctx.moveTo(mouse.x - camera.x - 12, mouse.y - camera.y); ctx.lineTo(mouse.x - camera.x - 4, mouse.y - camera.y);
  ctx.moveTo(mouse.x - camera.x + 4, mouse.y - camera.y); ctx.lineTo(mouse.x - camera.x + 12, mouse.y - camera.y);
  ctx.moveTo(mouse.x - camera.x, mouse.y - camera.y - 12); ctx.lineTo(mouse.x - camera.x, mouse.y - camera.y - 4);
  ctx.moveTo(mouse.x - camera.x, mouse.y - camera.y + 4); ctx.lineTo(mouse.x - camera.x, mouse.y - camera.y + 12);
  ctx.stroke(); ctx.shadowBlur = 0;
  
  techSmartMarks.forEach(m => {
    const sx = m.x - camera.x;
    const sy = m.y - camera.y;
    const alpha = Math.min(1, (m.life || 0) / 16);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 6 + alpha * 6, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  });

  techSmartShots.forEach(s => {
    if (!s || (s.life || 0) <= 0) return;
    const sx = s.x - camera.x;
    const sy = s.y - camera.y;
    const alpha = Math.min(1, (s.life || 0) / 16);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    const len = 10 + alpha * 10;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(s.angle || 0) * len * 0.5, sy - Math.sin(s.angle || 0) * len * 0.5);
    ctx.lineTo(sx + Math.cos(s.angle || 0) * len * 0.5, sy + Math.sin(s.angle || 0) * len * 0.5);
    ctx.stroke();
    ctx.restore();
  });

  nanoSwarm.forEach(b => {
    if (!b || (b.life || 0) <= 0) return;
    const sx = b.x - camera.x;
    const sy = b.y - camera.y;
    const alpha = Math.min(1, (b.life || 0) / 70);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 20;
    const size = 4;
    ctx.beginPath();
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx + size, sy);
    ctx.lineTo(sx, sy + size);
    ctx.lineTo(sx - size, sy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  breachMarks.forEach(mark => {
    if (!mark.enemy || mark.enemy.dead) return;
    const sx = mark.x - camera.x;
    const sy = mark.y - camera.y;
    const alpha = Math.min(1, mark.life / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10;
    ctx.strokeRect(sx - 20, sy - 20, 40, 40);
    const progress = 1 - mark.life / 120;
    ctx.fillStyle = '#f00';
    ctx.fillRect(sx - 18, sy + 12, 36 * progress, 4);
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ВЗЛОМ', sx, sy - 25);
    ctx.restore();
  });

  // ЭДЖРАННЕР: ВРАЩАЮЩИЙСЯ КЛИНОК (1)
  if (edgerunnerWhirlwind && edgerunnerWhirlwind.active) {
    const alpha = edgerunnerWhirlwind.life / edgerunnerWhirlwind.maxLife;
    const radius = edgerunnerWhirlwind.radius;

    // Круг вращения
    ctx.strokeStyle = `rgba(255,0,255,${alpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(player.x - camera.x, player.y - camera.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4 клинка
    for (let i = 0; i < 4; i++) {
      const bladeAngle = edgerunnerWhirlwind.angle + (Math.PI * 2 / 4) * i;
      const bx = player.x + Math.cos(bladeAngle) * radius - camera.x;
      const by = player.y + Math.sin(bladeAngle) * radius - camera.y;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(bladeAngle);

      ctx.fillStyle = `rgba(255,0,255,${alpha})`;
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(-10, -3);
      ctx.lineTo(10, -3);
      ctx.lineTo(12, 0);
      ctx.lineTo(10, 3);
      ctx.lineTo(-10, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  // ЭДЖРАННЕР: ЭМИ-ГРАНАТЫ (2)
  edgerunnerEmpGrenades.forEach(grenade => {
    const alpha = grenade.fuse / grenade.maxFuse;
    const sx = grenade.x - camera.x;
    const sy = grenade.y - camera.y;

    // Граната
    ctx.fillStyle = `rgba(255,255,0,${alpha})`;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 15 * alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Пульсация перед взрывом
    if (grenade.fuse < 15) {
      const pulse = 1 + Math.sin(Date.now() * 0.05) * 0.3;
      ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  });

  // САНДЕВИСТАН - эффекты
  if (sandevistanActive) {
    // Фильтр на экран
    ctx.fillStyle = 'rgba(170,0,255,0.15)';
    ctx.fillRect(0, 0, W, H);
    
    // Хронометр
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 20;
    ctx.fillText((sandevistanTimer/60).toFixed(1), W/2, H/2);
    
    // Свечение вокруг игрока
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;
    ctx.strokeStyle = 'rgba(255,255,0,0.5)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(sx, sy, 50, 0, Math.PI*2);
    ctx.stroke();
    
    // Трейлы движения
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ff0';
    for (let i = 1; i <= 5; i++) {
      ctx.fillRect(sx - i*10, sy - 7, 14, 14);
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  cyberDemons.forEach(demon => {
    const dx = player.x + Math.cos(demon.angle) * demon.radius - camera.x;
    const dy = player.y + Math.sin(demon.angle) * demon.radius - camera.y;
    ctx.save();
    ctx.fillStyle = '#a0f';
    ctx.shadowColor = '#a0f';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = demon.angle + (Math.PI * 2 / 3) * i + Math.PI / 2;
      const r = i === 0 ? 12 : 8;
      ctx.lineTo(dx + Math.cos(a) * r, dy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  damageTexts.forEach(t => {
    ctx.globalAlpha = t.life / 30; ctx.fillStyle = t.color; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = t.color; ctx.shadowBlur = 5;
    ctx.fillText(t.text, t.x - camera.x, t.y - camera.y);
  });
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  ctx.restore();
  drawMinimap();
}

function drawMinimap() {
  const scale = 180 / WORLD_W;
  mctx.fillStyle = '#000'; mctx.fillRect(0, 0, 180, 180);
  mctx.fillStyle = '#333'; worldObjects.forEach(o => { mctx.fillRect(o.x * scale, o.y * scale, 1, 1); });
  mctx.fillStyle = '#f00'; enemies.forEach(e => { if (!e.dead) mctx.fillRect(e.x * scale, e.y * scale, 2, 2); });
  mctx.fillStyle = '#0f0'; pickups.forEach(p => { mctx.fillRect(p.x * scale, p.y * scale, 2, 2); });
  mctx.strokeStyle = '#0ff'; mctx.lineWidth = 1; mctx.strokeRect(camera.x * scale, camera.y * scale, W * scale, H * scale);
  mctx.fillStyle = classes[playerClass].color; mctx.fillRect(player.x * scale - 2, player.y * scale - 2, 4, 4);
}
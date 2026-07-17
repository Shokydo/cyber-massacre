(function () {
  if (typeof window === 'undefined') return;

  // Keep the same implementation as in render.js to avoid visual regressions.
  window.drawChar2D = function drawChar2D(x, y, bodySize, headSize, color, angle, armLen, isPlayer) {
    const isHit = isPlayer ? (player.invuln > 0 && Math.floor(player.invuln / 3) % 2) : false;
    const drawColor = isHit ? '#fff' : color;

    // 1. Тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, bodySize * 0.4, bodySize * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. ТЕЛО - СТРОГО КВАДРАТ
    ctx.fillStyle = drawColor;
    ctx.fillRect(x - bodySize / 2, y - bodySize, bodySize, bodySize);

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - bodySize / 2, y - bodySize, bodySize, bodySize);

    // 3. ГОЛОВА - СТРОГИЙ КВАДРАТ С ПОВОРОТОМ
    const headX = x - headSize / 2;
    const headY = y - bodySize - headSize;

    // Поворот головы к мыши
    ctx.save();
    ctx.translate(x, headY + headSize / 2);
    ctx.rotate(angle);

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = drawColor;
    ctx.fillRect(-headSize / 2, -headSize / 2, headSize, headSize);

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-headSize / 2, -headSize / 2, headSize, headSize);

    ctx.restore();

    // 4. Оружие/Рука
    if (armLen > 0) {
      ctx.save();
      ctx.translate(x, y - bodySize * 0.5);
      ctx.rotate(angle);

      ctx.fillStyle = drawColor;
      ctx.fillRect(4, -2, armLen, 4);

      ctx.fillStyle = isPlayer ? '#fff' : '#ffcc00';
      ctx.fillRect(4 + armLen - 2, -3, 3, 6);

      ctx.restore();
    }

    // 5. Общее неоновое свечение персонажа (НЕ влияет на форму головы)
    if (isPlayer) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(x - bodySize / 2 - 2, headY - 2, bodySize + 4, bodySize + headSize + 4);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  };

  window.drawPlayer = function drawPlayer() {
    // ==========================================================
    // ОТРИСОВКА ИГРОКА (уникальная логика была вынесена из js/render.js)
    // ==========================================================
    const p3DTime = Date.now() * 0.006;
    const pMoving =
      (keys['w'] || keys['a'] || keys['s'] || keys['d'] ||
        keys['ц'] || keys['ф'] || keys['в'] || keys['ы']);
    const pBob = pMoving ? Math.sin(p3DTime * 2.5) * 3 : Math.sin(p3DTime * 1.2) * 1.5;

    const px = player.x - camera.x, py = player.y - camera.y + pBob;

    // СТРОГО КВАДРАТЫ: тело 24, голова 20
    const bodySize = 24;
    const headSize = 20;

    // в текущей логике рука/оружие зависит от класса
    const armLen = playerClass === 'melee' ? 18 : 14;

    ctx.save();
    drawChar2D(px, py, bodySize, headSize, classes[playerClass].color, player.angle, armLen, true);

    // Дополнительные эффекты классов
    if (playerClass === 'melee') {
      const mwX = px + Math.cos(player.angle) * (4 + armLen);
      const mwY = py - bodySize * 0.5 + Math.sin(player.angle) * 4;
      ctx.fillStyle = classes[playerClass].color;
      ctx.shadowColor = classes[playerClass].color;
      ctx.shadowBlur = 8;
      ctx.fillRect(mwX - 3, mwY - 3, 6, 6);
      ctx.shadowBlur = 0;
    } else if (playerClass === 'netrunner') {
      const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
      ctx.save();
      ctx.shadowColor = classes[playerClass].color;
      ctx.shadowBlur = 15 * pulse;
      ctx.fillStyle = classes[playerClass].color;
      ctx.globalAlpha = 0.3 * pulse;
      ctx.fillRect(px - headSize - 4, py - bodySize - headSize * 2 - 2, headSize * 2 + 8, headSize * 2 + 8);
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.shadowBlur = 0;
    } else if (playerClass === 'tech' && typeof techieCombatDrone !== 'undefined' && techieCombatDrone && techieCombatDrone.life > 0) {
      ctx.fillStyle = '#0ff';
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py - bodySize - headSize * 2 - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // Взмахи мечом
    if (typeof swordSwings !== 'undefined') {
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

          const spx = player.x + Math.cos(a) * s.range, spy = player.y + Math.sin(a) * s.range;
          const sx = spx - camera.x, sy = spy - camera.y;
          for (let k = 0; k < 3; k++) {
            const spread = (Math.random() - 0.5) * 10 * appear;
            const perpX = Math.cos(a + Math.PI / 2) * spread, perpY = Math.sin(a + Math.PI / 2) * spread;
            const pSize = 5 + Math.random() * 4;
            ctx.fillStyle = `rgba(255,0,255,${tailFade * appear})`;
            ctx.shadowColor = '#f0f';
            ctx.shadowBlur = 8 * tailFade;
            ctx.fillRect(sx + perpX - pSize / 2, sy + perpY - pSize / 2, pSize, pSize);
          }
        });
        ctx.shadowBlur = 0;
      });
    }

    // ЭДЖРАННЕР: Анимация разреза
    if (typeof edgerunnerSlashAnim !== 'undefined' && edgerunnerSlashAnim > 0) {
      const progress = 1 - edgerunnerSlashAnim / 12;
      const slashRadius = player.range * (1 + player.stats.rangePct / 100);
      const arcAngle = Math.PI * 0.6;
      const startAngle = player.angle - arcAngle / 2 + (edgerunnerSlashDir > 0 ? 0 : arcAngle);

      for (let i = 0; i <= 10; i++) {
        const segProgress = i / 10;
        const animProgress = Math.min(1, progress * 2 - segProgress * 0.5);
        if (animProgress <= 0) continue;

        const a = startAngle + arcAngle * segProgress * edgerunnerSlashDir;
        const tailFade = Math.max(0, 1 - segProgress * progress * 1.5);
        if (tailFade <= 0) continue;

        const spx = player.x + Math.cos(a) * slashRadius * animProgress;
        const spy = player.y + Math.sin(a) * slashRadius * animProgress;
        const sx = spx - camera.x, sy = spy - camera.y;

        ctx.fillStyle = `rgba(255,0,255,${tailFade * animProgress * 0.8})`;
        ctx.shadowColor = '#f0f';
        ctx.shadowBlur = 15 * tailFade;
        ctx.beginPath();
        ctx.arc(sx, sy, 8 * tailFade, 0, Math.PI * 2);
        ctx.fill();
      }

      const tailProgress = Math.max(0, progress - 0.3) * 1.5;
      if (tailProgress > 0) {
        ctx.strokeStyle = `rgba(255,0,255,${tailProgress * 0.6})`;
        ctx.lineWidth = 3 * tailProgress;
        ctx.shadowColor = '#f0f';
        ctx.shadowBlur = 10 * tailProgress;
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

    // ЭДЖРАННЕР: Ножи
    if (typeof edgerunnerKnives !== 'undefined') {
      edgerunnerKnives.forEach(knife => {
        const alpha = knife.life / knife.maxLife;
        const sx = knife.x - camera.x;
        const sy = knife.y - camera.y;

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
        ctx.moveTo(-knife.size, -knife.size / 3);
        ctx.lineTo(knife.size, -knife.size / 3);
        ctx.lineTo(knife.size + 4, 0);
        ctx.lineTo(knife.size, knife.size / 3);
        ctx.lineTo(-knife.size, knife.size / 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(100,50,20,${alpha})`;
        ctx.fillRect(-knife.size - 2, -1.5, 4, 3);
        ctx.restore();

        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10 * alpha;
        ctx.beginPath();
        ctx.arc(
          knife.x + Math.cos(knife.angle) * (knife.size + 2) - camera.x,
          knife.y + Math.sin(knife.angle) * (knife.size + 2) - camera.y,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
    }

    // НЕТРАННЕР: Моноструна
    if (typeof netrunnerMonowire !== 'undefined' && netrunnerMonowire) {
      const alpha = netrunnerMonowire.life / 15;
      const segments = 24;
      const totalLife = 15;
      const progress = 1 - netrunnerMonowire.life / totalLife;
      const extendFrames = 8;
      const holdFrames = 4;

      let drawLength = netrunnerMonowire.length;
      let tailFadeStart = 1.0;

      if (progress > (extendFrames + holdFrames) / totalLife) {
        const retractProgress =
          (progress - (extendFrames + holdFrames) / totalLife) /
          (1 - (extendFrames + holdFrames) / totalLife);
        tailFadeStart = 1.0 - retractProgress * 0.8;
      }

      if (progress < extendFrames / totalLife) {
        const phaseProgress = progress / (extendFrames / totalLife);
        drawLength = netrunnerMonowire.maxLength * phaseProgress;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Внешнее свечение
      ctx.strokeStyle = `rgba(170,0,255,${alpha * 0.4})`;
      ctx.lineWidth = 10;
      ctx.shadowColor = '#a0f';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const segProgress = i / segments;
        if (segProgress > tailFadeStart) continue;
        const waveAmp = 0.35 * (1 - segProgress * 0.5);
        const waveAngle =
          Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
        const segAngle = netrunnerMonowire.angle + waveAngle;
        const segLen = drawLength * segProgress;
        const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
        const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
        if (i === 0) ctx.moveTo(segX, segY);
        else ctx.lineTo(segX, segY);
      }
      ctx.stroke();

      // Основная линия
      ctx.lineWidth = 8;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const segProgress = i / segments;
        if (segProgress > tailFadeStart) continue;
        const waveAmp = 0.35 * (1 - segProgress * 0.5);
        const waveAngle =
          Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
        const segAngle = netrunnerMonowire.angle + waveAngle;
        const segLen = drawLength * segProgress;
        const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
        const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
        if (i === 0) ctx.moveTo(segX, segY);
        else ctx.lineTo(segX, segY);
      }

      const grad = ctx.createLinearGradient(
        netrunnerMonowire.x - camera.x,
        netrunnerMonowire.y - camera.y,
        netrunnerMonowire.x + Math.cos(netrunnerMonowire.angle) * drawLength - camera.x,
        netrunnerMonowire.y + Math.sin(netrunnerMonowire.angle) * drawLength - camera.y
      );
      grad.addColorStop(0, `rgba(170,0,255,${alpha * 0.9})`);
      grad.addColorStop(0.5, `rgba(208,0,255,${alpha * 0.8})`);
      grad.addColorStop(1, `rgba(255,255,255,${alpha * 0.6})`);
      ctx.strokeStyle = grad;
      ctx.shadowColor = '#a0f';
      ctx.stroke();

      // Ядро
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const segProgress = i / segments;
        if (segProgress > tailFadeStart) continue;
        const waveAmp = 0.35 * (1 - segProgress * 0.5);
        const waveAngle =
          Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
        const segAngle = netrunnerMonowire.angle + waveAngle;
        const segLen = drawLength * segProgress;
        const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen - camera.x;
        const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen - camera.y;
        if (i === 0) ctx.moveTo(segX, segY);
        else ctx.lineTo(segX, segY);
      }
      ctx.stroke();

      // Частицы
      for (let i = 0; i <= segments; i += 2) {
        const segProgress = i / segments;
        if (segProgress > tailFadeStart) continue;
        const waveAmp = 0.35 * (1 - segProgress * 0.5);
        const waveAngle =
          Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
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

      // Ядро у игрока
      const coreX = netrunnerMonowire.x - camera.x;
      const coreY = netrunnerMonowire.y - camera.y;
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 8 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(170,0,255,${alpha * 0.6})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(coreX, coreY, 12 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // НЕТРАННЕР: КИБЕР-ДЕМОН
    if (typeof netrunnerCyberDemon !== 'undefined' && netrunnerCyberDemon) {
      const alpha = netrunnerCyberDemon.life / netrunnerCyberDemon.maxLife;
      const sx = netrunnerCyberDemon.x - camera.x;
      const sy = netrunnerCyberDemon.y - camera.y;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = '#a0f';
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(170,0,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = `rgba(255,100,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0);
      ctx.closePath(); ctx.fill();

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
  };

  window.drawLobbyPlayer = function drawLobbyPlayer(x, y, size) {
    // Lobby character: white, head+body squares, no weapons (armLen=0)
    const bodySize = size ?? 18;
    const headSize = Math.round(bodySize * (20 / 24)); // keep proportion from in-game (24/20)
    ctx.save();
    // Lobby angle fixed to 0; lobby doesn't rotate to mouse.
    window.drawChar2D(x, y, bodySize, headSize, '#fff', 0, 0, false);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - bodySize / 2, y - bodySize / 2, bodySize, bodySize);
    ctx.restore();
  };
})();

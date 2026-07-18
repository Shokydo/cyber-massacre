// ���������� ���������� ��� ������ (����� lobby.js ����� �� ���������� �� ������� ��������)
window.isRebinding = window.isRebinding ?? false;
window.keys = window.keys ?? {};
// �� ������ top-level redeclare: isRebinding/keys ������ �������� �� window
// (����� ��� ��������� ������ ������� ������ � "already been declared")
// let isRebinding = window.isRebinding;
// let keys = window.keys;

document.addEventListener('keydown', e => {
    const isRebindingLocal = window.isRebinding;
    if (isRebindingLocal) return;
    const k = e.key.toLowerCase();
    window.keys[k] = true;

    if (typeof lobbyActive !== 'undefined' && lobbyActive) {
        if (k === 'escape') {
            e.preventDefault();
            if (typeof settingsOpen !== 'undefined' && settingsOpen) { toggleSettings(); }
            else if (typeof window.currentDialogNPC !== 'undefined' && window.currentDialogNPC) { closeDialogFromMenu(); }
            return;
        }
        if (k === 'e' || k === '�') {
            e.preventDefault();
            if (typeof window.currentDialogNPC !== 'undefined' && !window.currentDialogNPC && typeof lobbySelectClass === 'function') {
              lobbySelectClass();
            }
            return;
        }
        if (k === 'enter' || k === 'return') {
            e.preventDefault();
            if (typeof window.currentDialogNPC !== 'undefined' && window.currentDialogNPC) { selectClassFromDialog(); }
            return;
        }
    }

    if (k === 'escape') {
        e.preventDefault();
        if (typeof settingsOpen !== 'undefined' && settingsOpen) { toggleSettings(); }
        else if (typeof skillMenuOpen !== 'undefined' && skillMenuOpen) { toggleSkillMenu(); }
        else if (typeof pendingPickup !== 'undefined' && pendingPickup) { skipPickup(); }
        else if (gameRunning) { togglePause(); }
        return;
    }

    const kb = (typeof gameSettings !== 'undefined' && gameSettings.keybinds) ? gameSettings.keybinds : {};

    if (k === (kb.dash || 'shift')) { if (typeof tryDash === 'function') tryDash(); }
    if (k === (kb.ability1 || '1')) { if (typeof tryAbility1 === 'function') tryAbility1(); }
    if (k === (kb.ability2 || '2')) { if (typeof tryAbility2 === 'function') tryAbility2(); }
    if (k === (kb.ability3 || '3')) { if (typeof tryUlt === 'function') tryUlt(); }
    if (k === (kb.upgrade || 'p')) { e.preventDefault(); if (typeof toggleSkillMenu === 'function') toggleSkillMenu(); }
    if (k === 'f' || k === '�') { if (typeof pendingPickup !== 'undefined' && pendingPickup) { if (typeof takePickup === 'function') takePickup(); } }
    if (e.code === 'Space') { e.preventDefault(); if (typeof player !== 'undefined' && !player.charging) { if (typeof tryAttack === 'function') tryAttack(); } }
});

document.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    window.keys[k] = false;
});

// ������������� ���� ������ ����� ������ �������� HTML
document.addEventListener('DOMContentLoaded', () => {
    const cv = document.getElementById('game');
    if (!cv) {
        console.error('������: Canvas � id="game" �� ������ � index.html');
        return;
    }

    // mouse ����� ���� ������ � bootstrap, �� ���� ��� ��� � ������ ���������
    if (typeof mouse === 'undefined' || !mouse) {
        // eslint-disable-next-line no-undef
        window.mouse = window.mouse ?? { x: 0, y: 0, down: false };
    }

    cv.addEventListener('mousemove', e => {
        const r = cv.getBoundingClientRect();
        const m = window.mouse;
        if (!m) return;
        m.x = (e.clientX - r.left) * ((typeof W !== 'undefined' ? W : 800) / r.width) + (typeof camera !== 'undefined' ? camera.x : 0);
        m.y = (e.clientY - r.top) * ((typeof H !== 'undefined' ? H : 600) / r.height) + (typeof camera !== 'undefined' ? camera.y : 0);
    });

    cv.addEventListener('mousedown', e => {
        if (e.button === 0) {
            window.mouse.down = true;
        }
        if (e.button === 2) {
            e.preventDefault();
            if (typeof playerClass !== 'undefined' && playerClass === 'edgerunner') {
                if (typeof throwKnife === 'function') throwKnife();
            } else if (typeof playerClass !== 'undefined' && playerClass === 'tech') {
                if (typeof techieShield !== 'undefined') {
                    techieShield.active = true;
                    techieShield.broken = false;
                }
            }
        }
    });

    cv.addEventListener('mouseup', e => {
        if (e.button === 0) {
            window.mouse.down = false;
        }
        if (e.button === 2) {
            if (typeof playerClass !== 'undefined' && playerClass === 'tech') {
                if (typeof techieShield !== 'undefined') {
                    techieShield.active = false;
                    if (techieShield.hp <= 0) {
                        techieShield.broken = true;
                        techieShield.cooldown = 180;
                    }
                }
            }
        }
    });

    cv.addEventListener('contextmenu', e => e.preventDefault());
});

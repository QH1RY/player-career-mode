(() => {
  if (typeof update !== 'function') return;
  const bridge = () => window.Career3DBridge || {};
  const originalUpdate = update;
  let lastDir = { x: 1, y: 0 };

  function difficultyMultiplier() {
    const d = (typeof S !== 'undefined' && S?.difficulty) || 'Professional';
    if (d === 'Legendary') return 1.04;
    if (d === 'World Class') return 1.00;
    if (d === 'Simulation') return 0.97;
    return 0.93;
  }

  update = function () {
    if (!match?.foes?.length) return originalUpdate();

    const before = match.foes.map(f => ({ x: f.x, y: f.y }));
    const ownerBefore = match.ball?.owner;
    const carrierBefore = match.ball?.carrier || null;
    const move = bridge().lastMove || lastDir;
    const dot = move.x * lastDir.x + move.y * lastDir.y;
    const sharpTurn = Math.hypot(move.x, move.y) > 0.25 && dot < 0.78;

    // Defenders need a human reaction to changes of direction instead of tracking
    // the player's joystick instantly.
    if (sharpTurn) {
      match.foes.forEach((f, i) => {
        if (i < 4) f.reactionFrames = Math.max(f.reactionFrames || 0, 10 + Math.floor(Math.random() * 7));
      });
    }
    if (Math.hypot(move.x, move.y) > 0.25) lastDir = { x: move.x, y: move.y };

    const result = originalUpdate();
    if (!match || match.training) return result;

    const mult = difficultyMultiplier();
    match.foes.forEach((f, i) => {
      const prev = before[i];
      if (!prev) return;
      const dx = f.x - prev.x;
      const dy = f.y - prev.y;
      const dist = Math.hypot(dx, dy);
      const pressing = i < 4 && (ownerBefore === 'player' || ownerBefore === 'mate');

      // Player sprint is ~2.3+ units/frame. A pressing defender is now capped
      // well below that, so a fast attacker can genuinely create separation.
      let maxStep = (pressing ? 0.98 : 0.72) * mult;

      if ((f.reactionFrames || 0) > 0) {
        f.reactionFrames--;
        maxStep *= 0.34;
        f.tackleCd = Math.max(f.tackleCd || 0, 12);
      }

      // Failed/recent tackles have a recovery penalty rather than instant pursuit.
      if ((f.tackleCd || 0) > 45) maxStep *= 0.72;

      if (dist > maxStep && dist > 0) {
        f.x = prev.x + (dx / dist) * maxStep;
        f.y = prev.y + (dy / dist) * maxStep;
      }
    });

    // Cancel impossible snap tackles after the defender movement has been capped.
    if (ownerBefore === 'player' && match.ball?.owner === 'foe' && match.ball.carrier) {
      const f = match.ball.carrier;
      const gap = Math.hypot(f.x - match.player.x, f.y - match.player.y);
      if (gap > 22) {
        match.ball.owner = 'player';
        match.ball.carrier = null;
        match.ball.vx = 0;
        match.ball.vy = 0;
        f.tackleCd = Math.max(f.tackleCd || 0, 85);
      }
    }

    // Opposition carriers should not automatically outrun the created player.
    if (match.ball?.owner === 'foe' && match.ball.carrier && carrierBefore === match.ball.carrier) {
      const f = match.ball.carrier;
      const idx = match.foes.indexOf(f);
      if (idx >= 0 && before[idx] && f.x < before[idx].x - 0.92) f.x = before[idx].x - 0.92;
    }

    return result;
  };
})();
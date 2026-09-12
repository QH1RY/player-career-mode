(() => {
  if (typeof update !== 'function') return;
  const bridge = () => window.Career3DBridge || {};
  const originalUpdate = update;
  let lastDir = { x: 1, y: 0 };

  function difficultyMultiplier() {
    const d = (typeof S !== 'undefined' && S?.difficulty) || 'Professional';
    if (d === 'Legendary') return 1.10;
    if (d === 'World Class') return 1.05;
    if (d === 'Simulation') return 1.02;
    return 0.98;
  }

  update = function () {
    if (!match?.foes?.length) return originalUpdate();

    const before = match.foes.map(f => ({ x: f.x, y: f.y }));
    const ownerBefore = match.ball?.owner;
    const carrierBefore = match.ball?.carrier || null;
    const move = bridge().lastMove || lastDir;
    const dot = move.x * lastDir.x + move.y * lastDir.y;
    const sharpTurn = Math.hypot(move.x, move.y) > 0.25 && dot < 0.72;

    if (sharpTurn) {
      match.foes.forEach((f, i) => {
        if (i < 4) f.reactionFrames = Math.max(f.reactionFrames || 0, 6 + Math.floor(Math.random() * 5));
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
      let maxStep = (pressing ? 1.20 : 0.86) * mult;

      if ((f.reactionFrames || 0) > 0) {
        f.reactionFrames--;
        maxStep *= 0.42;
        f.tackleCd = Math.max(f.tackleCd || 0, 5);
      }

      if (dist > maxStep && dist > 0) {
        f.x = prev.x + (dx / dist) * maxStep;
        f.y = prev.y + (dy / dist) * maxStep;
      }
    });

    // If the old AI stole the ball using movement that has just been clamped away,
    // cancel that impossible tackle so defenders cannot 'snap' into possession.
    if (ownerBefore === 'player' && match.ball?.owner === 'foe' && match.ball.carrier) {
      const f = match.ball.carrier;
      const gap = Math.hypot(f.x - match.player.x, f.y - match.player.y);
      if (gap > 24) {
        match.ball.owner = 'player';
        match.ball.carrier = null;
        match.ball.vx = 0;
        match.ball.vy = 0;
        f.tackleCd = Math.max(f.tackleCd || 0, 70);
      }
    }

    // Opposition ball carriers should not outrun a sprinting created player by default.
    if (match.ball?.owner === 'foe' && match.ball.carrier && carrierBefore === match.ball.carrier) {
      const f = match.ball.carrier;
      if (f.x < before[match.foes.indexOf(f)]?.x - 1.05) {
        f.x = before[match.foes.indexOf(f)].x - 1.05;
      }
    }

    return result;
  };
})();
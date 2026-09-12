(() => {
  const joystick = document.getElementById('joystick');
  const stick = document.getElementById('stick');
  const sprint = document.getElementById('touchSprint');
  const pass = document.getElementById('touchPass');
  const shoot = document.getElementById('touchShoot');
  const tackle = document.getElementById('touchTackle');
  if (!joystick || !stick) return;

  let activePointer = null;
  const max = 38;

  function setDir(x, y) {
    const mag = Math.hypot(x, y);
    const nx = mag ? x / mag : 0;
    const ny = mag ? y / mag : 0;
    const dist = Math.min(max, mag);
    stick.style.transform = `translate(${nx * dist}px, ${ny * dist}px)`;
    keys.a = nx < -0.25;
    keys.d = nx > 0.25;
    keys.w = ny < -0.25;
    keys.s = ny > 0.25;
  }

  function clearDir() {
    stick.style.transform = 'translate(0,0)';
    keys.a = keys.d = keys.w = keys.s = false;
  }

  function moveFromEvent(e) {
    const r = joystick.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    setDir(e.clientX - cx, e.clientY - cy);
  }

  joystick.addEventListener('pointerdown', e => {
    activePointer = e.pointerId;
    joystick.setPointerCapture(e.pointerId);
    moveFromEvent(e);
    e.preventDefault();
  });

  joystick.addEventListener('pointermove', e => {
    if (e.pointerId !== activePointer) return;
    moveFromEvent(e);
    e.preventDefault();
  });

  const endStick = e => {
    if (activePointer !== null && e.pointerId !== activePointer) return;
    activePointer = null;
    clearDir();
    e.preventDefault();
  };
  joystick.addEventListener('pointerup', endStick);
  joystick.addEventListener('pointercancel', endStick);

  function holdButton(el, keyName) {
    el.addEventListener('pointerdown', e => {
      keys[keyName] = true;
      el.classList.add('active');
      el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    const release = e => {
      keys[keyName] = false;
      el.classList.remove('active');
      e.preventDefault();
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', e => {
      if (e.buttons === 0) release(e);
    });
  }

  function tapButton(el, keyName) {
    el.addEventListener('pointerdown', e => {
      keys[keyName] = true;
      el.classList.add('active');
      e.preventDefault();
      setTimeout(() => {
        keys[keyName] = false;
        el.classList.remove('active');
      }, 90);
    });
  }

  holdButton(sprint, 'shift');
  tapButton(pass, ' ');
  tapButton(shoot, 'j');
  tapButton(tackle, 'k');

  document.addEventListener('touchmove', e => {
    if (e.target.closest?.('.touch-controls')) e.preventDefault();
  }, { passive: false });
})();
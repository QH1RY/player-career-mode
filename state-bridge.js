// Bridge classic-script career state into the ES-module 3D renderer and gameplay extensions.
(() => {
  try {
    Object.defineProperty(window, 'match', {
      configurable: true,
      get: () => match
    });
  } catch (_) {}
  window.Career3DBridge = {
    getState: () => (typeof S !== 'undefined' ? S : null),
    getKeys: () => (typeof keys !== 'undefined' ? keys : {}),
    getMatch: () => (typeof match !== 'undefined' ? match : null),
    setMatch: value => { if (typeof match !== 'undefined') match = value; return match; },
    shotAim: {active:false,offset:0,power:.72,curve:0},
    skillAction: null,
    trainingMode: null,
    cameraBasis: {fx:1,fz:0,rx:0,rz:1}
  };

  const loadExtra = (src, attr, type='text/javascript') => {
    if (document.querySelector(`script[data-extra="${attr}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.type = type;
    script.dataset.extra = attr;
    document.body.appendChild(script);
  };

  const loadEnhancements = () => {
    loadExtra('defender-balance.js?v=40', 'defender-balance');
    loadExtra('smooth-renderer.js?v=40', 'smooth-renderer', 'module');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadEnhancements, {once:true});
  else loadEnhancements();
})();
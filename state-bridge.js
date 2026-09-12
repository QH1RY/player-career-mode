// Bridge classic-script career state into the ES-module 3D renderer.
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
    getMatch: () => (typeof match !== 'undefined' ? match : null)
  };
})();
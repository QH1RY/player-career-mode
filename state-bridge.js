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
})();
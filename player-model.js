(() => {
  const oldDrawPlayer = window.drawPlayer;
  let t0 = performance.now();

  function kitFor(colour, hero) {
    if (hero) return {shirt:'#dfff4d', shorts:'#102319', socks:'#dfff4d', boots:'#f7f7f7', skin:'#9f6a48'};
    const isAway = colour && colour.toLowerCase().includes('ff6f');
    return isAway
      ? {shirt:'#d83d4f', shorts:'#731927', socks:'#d83d4f', boots:'#f4f4f4', skin:'#9f6a48'}
      : {shirt:'#58bfe8', shorts:'#174c65', socks:'#58bfe8', boots:'#f4f4f4', skin:'#9f6a48'};
  }

  window.drawPlayer = function drawFootballer(p, colour, hero=false) {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') {
      return oldDrawPlayer?.(p, colour, hero);
    }

    const kit = kitFor(colour, hero);
    const moving = !!(hero && typeof keys !== 'undefined' && (keys.w||keys.a||keys.s||keys.d||keys.arrowup||keys.arrowdown||keys.arrowleft||keys.arrowright));
    const sprinting = !!(hero && typeof keys !== 'undefined' && keys.shift);
    const cycle = Math.sin((performance.now()-t0) * (sprinting ? .022 : .014));
    const stride = moving ? cycle * (sprinting ? 7 : 4.5) : 0;
    const scale = hero ? 1.18 : .98;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);

    // soft player shadow
    ctx.beginPath();
    ctx.ellipse(0, 11, hero ? 15 : 12, 6, 0, 0, Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,.28)';
    ctx.fill();

    // legs
    ctx.lineCap='round';
    ctx.lineWidth=5.5;
    ctx.strokeStyle=kit.skin;
    ctx.beginPath();
    ctx.moveTo(-5,4); ctx.lineTo(-6+stride*.5,15); ctx.lineTo(-8+stride,22);
    ctx.moveTo(5,4); ctx.lineTo(6-stride*.5,15); ctx.lineTo(8-stride,22);
    ctx.stroke();

    // socks
    ctx.lineWidth=5.5;
    ctx.strokeStyle=kit.socks;
    ctx.beginPath();
    ctx.moveTo(-6+stride*.5,15); ctx.lineTo(-8+stride,21);
    ctx.moveTo(6-stride*.5,15); ctx.lineTo(8-stride,21);
    ctx.stroke();

    // boots
    ctx.lineWidth=4;
    ctx.strokeStyle=kit.boots;
    ctx.beginPath();
    ctx.moveTo(-8+stride,22); ctx.lineTo(-12+stride,23);
    ctx.moveTo(8-stride,22); ctx.lineTo(12-stride,23);
    ctx.stroke();

    // shorts
    ctx.fillStyle=kit.shorts;
    ctx.beginPath();
    ctx.roundRect(-9,-1,18,11,3);
    ctx.fill();

    // torso / shirt
    ctx.fillStyle=kit.shirt;
    ctx.beginPath();
    ctx.roundRect(-11,-19,22,21,5);
    ctx.fill();

    // sleeves / arms
    ctx.lineWidth=5;
    ctx.strokeStyle=kit.shirt;
    ctx.beginPath();
    ctx.moveTo(-9,-14); ctx.lineTo(-16,-7 + stride*.15);
    ctx.moveTo(9,-14); ctx.lineTo(16,-7 - stride*.15);
    ctx.stroke();
    ctx.lineWidth=4.5;
    ctx.strokeStyle=kit.skin;
    ctx.beginPath();
    ctx.moveTo(-16,-7 + stride*.15); ctx.lineTo(-18,0 + stride*.25);
    ctx.moveTo(16,-7 - stride*.15); ctx.lineTo(18,0 - stride*.25);
    ctx.stroke();

    // neck
    ctx.fillStyle=kit.skin;
    ctx.fillRect(-3,-23,6,6);

    // head
    ctx.beginPath();
    ctx.arc(0,-29,7.5,0,Math.PI*2);
    ctx.fillStyle=kit.skin;
    ctx.fill();

    // hair
    ctx.beginPath();
    ctx.arc(0,-31.5,7.1,Math.PI,Math.PI*2);
    ctx.fillStyle='#1d1512';
    ctx.fill();

    // shirt number
    ctx.fillStyle=hero?'#08110d':'#ffffff';
    ctx.font='900 9px system-ui';
    ctx.textAlign='center';
    const number = hero ? (S.position==='ST'?'9':S.position.includes('W')?'11':'10') : '';
    if(number) ctx.fillText(number,0,-6);

    if(hero){
      ctx.strokeStyle='#ffffff';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.ellipse(0,11,18,8,0,0,Math.PI*2);
      ctx.stroke();

      ctx.fillStyle='rgba(3,12,7,.86)';
      ctx.beginPath();
      ctx.roundRect(-39,-52,78,15,7);
      ctx.fill();
      ctx.fillStyle='#fff';
      ctx.font='800 9px system-ui';
      ctx.textAlign='center';
      ctx.fillText((S.first||'PLAYER').toUpperCase(),0,-41);
    }

    ctx.restore();
  };
})();
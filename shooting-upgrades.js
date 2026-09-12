(() => {
  const bridge=()=>window.Career3DBridge||{};
  let shotType='normal';
  let lastShotActive=false;
  let frozenKeeperY=null;

  function addShotTypeUI(){
    const actions=document.querySelector('.action-buttons');
    if(!actions||document.getElementById('shotTypeControls'))return;
    const box=document.createElement('div');
    box.id='shotTypeControls';
    box.style.cssText='position:absolute;right:0;bottom:150px;display:flex;gap:6px;z-index:7';
    box.innerHTML=`
      <button data-shot-type="normal" style="padding:7px 9px;border-radius:10px;font-size:10px;font-weight:900">NORMAL</button>
      <button data-shot-type="finesse" style="padding:7px 9px;border-radius:10px;font-size:10px;font-weight:900">FINESSE</button>
      <button data-shot-type="power" style="padding:7px 9px;border-radius:10px;font-size:10px;font-weight:900">POWER</button>`;
    actions.appendChild(box);
    const buttons=[...box.querySelectorAll('[data-shot-type]')];
    function paint(){buttons.forEach(b=>{const on=b.dataset.shotType===shotType;b.style.opacity=on?'1':'.55';b.style.outline=on?'2px solid #dfff4d':'none';});}
    buttons.forEach(b=>b.addEventListener('pointerdown',e=>{shotType=b.dataset.shotType;bridge().shotType=shotType;paint();e.preventDefault();}));
    paint();
  }

  function markNewShot(){
    if(!match?.shotInFlight||!match.ball)return;
    const b=match.ball,p=match.player;
    const dist=Math.max(1,1082-p.x);
    match.shotType=shotType;
    match.shotDistance=dist;
    match.gkReactAt=performance.now()+(shotType==='power'?190:shotType==='finesse'?260:225)+Math.min(180,dist*.11);
    frozenKeeperY=match.keeper?.y??310;

    if(shotType==='power'){
      b.vx*=1.16;b.vy*=1.16;
      match.shotPower=Math.min(1,(match.shotPower||.72)+.18);
      flash('POWER SHOT!');
    }else if(shotType==='finesse'){
      b.vx*=.93;b.vy*=.94;
      match.shotCurve=(Math.sign((match.shotTargetY||310)-310)||1)*.022;
      flash('Finesse shot...');
    }else{
      match.shotCurve=0;
    }
  }

  function preUpdate(){
    if(!match)return;
    if(match.shotInFlight&&!lastShotActive)markNewShot();
    lastShotActive=!!match.shotInFlight;

    if(match.shotInFlight&&match.ball){
      if(match.shotCurve)match.ball.vy+=match.shotCurve;
      if(match.keeper&&performance.now()<(match.gkReactAt||0)&&frozenKeeperY!=null){
        // Keep the goalkeeper planted for a short human reaction window.
        match.keeper.y=frozenKeeperY;
      }
    }
  }

  function postUpdate(){
    if(!match)return;
    if(!match.shotInFlight){
      frozenKeeperY=null;match.shotCurve=0;
    }else if(match.keeper&&performance.now()>=(match.gkReactAt||0)){
      // Slower tracking after the reaction starts. Well-placed shots can beat the keeper.
      const target=match.shotTargetY||match.ball?.y||310;
      const placement=Math.min(1,Math.abs(target-310)/60);
      const typePenalty=match.shotType==='power'?.08:match.shotType==='finesse'?.11:0;
      const maxStep=Math.max(.9,2.2-placement*.8-typePenalty*4);
      const dy=target-match.keeper.y;
      match.keeper.y+=Math.sign(dy)*Math.min(Math.abs(dy),maxStep);
    }
  }

  function wrapUpdate(){
    if(typeof update!=='function'||update.__shootingUpgrades)return;
    const base=update;
    const wrapped=function(){preUpdate();base();postUpdate();};
    wrapped.__shootingUpgrades=true;
    update=wrapped;
  }

  function addLegend(){
    const controls=document.querySelector('.controls');
    if(!controls||document.getElementById('shotLegend'))return;
    const note=document.createElement('div');
    note.id='shotLegend';
    note.style.cssText='margin-top:6px;font-size:12px;opacity:.9';
    note.innerHTML='<b>Shooting:</b> Normal = balanced. Finesse = slower, placed curl. Power = harder and faster but less forgiving. Hold Shoot, drag to aim/power, release to strike.';
    controls.appendChild(note);
  }

  addShotTypeUI();addLegend();wrapUpdate();
  setTimeout(()=>{addShotTypeUI();addLegend();wrapUpdate();},400);
})();
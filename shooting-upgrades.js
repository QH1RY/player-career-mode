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
    box.innerHTML=`<button data-shot-type="normal" style="padding:7px 9px;border-radius:10px;font-size:10px;font-weight:900">NORMAL</button><button data-shot-type="finesse" style="padding:7px 9px;border-radius:10px;font-size:10px;font-weight:900">FINESSE</button><button data-shot-type="power" style="padding:7px 9px;border-radius:10px;font-size:10px;font-weight:900">POWER</button>`;
    actions.appendChild(box);
    const buttons=[...box.querySelectorAll('[data-shot-type]')];
    function paint(){buttons.forEach(b=>{const on=b.dataset.shotType===shotType;b.style.opacity=on?'1':'.55';b.style.outline=on?'2px solid #dfff4d':'none';});}
    buttons.forEach(b=>b.addEventListener('pointerdown',e=>{shotType=b.dataset.shotType;bridge().shotType=shotType;paint();e.preventDefault();}));
    bridge().shotType=shotType;paint();
  }

  function ensureCurveBadge(){
    const wrap=document.querySelector('.pitch-wrap');if(!wrap)return null;
    let el=document.getElementById('curveShotBadge');
    if(!el){el=document.createElement('div');el.id='curveShotBadge';el.textContent='↝ CURVING';Object.assign(el.style,{position:'absolute',left:'50%',top:'62px',transform:'translateX(-50%)',zIndex:'18',padding:'6px 11px',borderRadius:'999px',background:'rgba(20,70,150,.88)',color:'#fff',font:'900 10px system-ui',letterSpacing:'.08em',boxShadow:'0 4px 12px rgba(0,0,0,.25)',pointerEvents:'none',opacity:'0',transition:'opacity .12s'});wrap.appendChild(el);}return el;
  }

  function markNewShot(){
    if(!match?.shotInFlight||!match.ball)return;
    const b=match.ball,p=match.player;
    const dist=Math.max(1,1082-p.x);
    match.shotType=shotType;
    match.shotDistance=dist;
    match.gkReactAt=performance.now()+(shotType==='power'?190:shotType==='finesse'?285:225)+Math.min(180,dist*.11);
    frozenKeeperY=match.keeper?.y??310;

    if(shotType==='power'){
      b.vx*=1.16;b.vy*=1.16;
      match.shotPower=Math.min(1,(match.shotPower||.72)+.18);
      match.shotCurve=0;
      try{flash?.('POWER SHOT!');}catch(_){ }
    }else if(shotType==='finesse'){
      b.vx*=.94;b.vy*=.91;
      const targetOffset=(match.shotTargetY||310)-310;
      const aimSign=Math.sign(targetOffset);
      const footSign=(typeof S!=='undefined'&&S?.foot==='Left')?-1:1;
      match.shotCurveDir=aimSign||footSign;
      match.shotCurveStrength=.050+Math.min(.035,Math.abs(targetOffset)/2200);
      match.shotCurveStart=performance.now();
      match.shotCurve=match.shotCurveDir*match.shotCurveStrength;
      bridge().finesseFlight={active:true,start:match.shotCurveStart,direction:match.shotCurveDir,strength:match.shotCurveStrength};
      ensureCurveBadge().style.opacity='1';
      try{flash?.('FINESSE — watch the curl!');}catch(_){ }
    }else{
      match.shotCurve=0;bridge().finesseFlight={active:false};
    }
  }

  function preUpdate(){
    if(!match)return;
    if(match.shotInFlight&&!lastShotActive)markNewShot();
    lastShotActive=!!match.shotInFlight;

    if(match.shotInFlight&&match.ball&&match.shotType==='finesse'){
      const elapsed=Math.max(0,performance.now()-(match.shotCurveStart||performance.now()));
      const phase=Math.min(1,elapsed/950);
      // The bend grows after launch, peaks through the middle of flight, then eases near goal.
      const bend=.35+Math.sin(Math.PI*phase)*1.35;
      const curve=(match.shotCurveDir||1)*(match.shotCurveStrength||.05)*bend;
      match.ball.vy+=curve;
      match.shotCurve=curve;
      bridge().finesseFlight={active:true,start:match.shotCurveStart,direction:match.shotCurveDir,strength:curve,progress:phase};
      const badge=ensureCurveBadge();if(badge)badge.style.opacity='1';
    }
    if(match.shotInFlight&&match.keeper&&performance.now()<(match.gkReactAt||0)&&frozenKeeperY!=null)match.keeper.y=frozenKeeperY;
  }

  function postUpdate(){
    if(!match)return;
    if(!match.shotInFlight){
      frozenKeeperY=null;match.shotCurve=0;match.shotCurveStrength=0;bridge().finesseFlight={active:false};
      const badge=document.getElementById('curveShotBadge');if(badge)badge.style.opacity='0';
    }else if(match.keeper&&performance.now()>=(match.gkReactAt||0)){
      const target=match.shotTargetY||match.ball?.y||310;
      const placement=Math.min(1,Math.abs(target-310)/60);
      const typePenalty=match.shotType==='power'?.08:match.shotType==='finesse'?.14:0;
      const maxStep=Math.max(.8,2.2-placement*.8-typePenalty*4);
      const dy=target-match.keeper.y;
      match.keeper.y+=Math.sign(dy)*Math.min(Math.abs(dy),maxStep);
    }
  }

  function wrapUpdate(){
    if(typeof update!=='function'||update.__shootingUpgrades)return;
    const base=update;
    const wrapped=function(){preUpdate();const out=base();postUpdate();return out;};
    wrapped.__shootingUpgrades=true;update=wrapped;
  }

  function addLegend(){
    const controls=document.querySelector('.controls');
    if(!controls||document.getElementById('shotLegend'))return;
    const note=document.createElement('div');note.id='shotLegend';note.style.cssText='margin-top:6px;font-size:12px;opacity:.9';
    note.innerHTML='<b>Shooting:</b> Normal = balanced. <b>Finesse = visible curling flight.</b> Power = harder and faster. Hold Shoot, drag to aim/power, release to strike.';controls.appendChild(note);
  }

  ensureCurveBadge();addShotTypeUI();addLegend();wrapUpdate();
  setTimeout(()=>{ensureCurveBadge();addShotTypeUI();addLegend();wrapUpdate();},400);
})();
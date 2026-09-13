(() => {
  const bridge=()=>window.Career3DBridge||{};
  const getMatch=()=>bridge().getMatch?.()||null;
  let awayShot=null;
  const LEFT_LINE=18,GOAL_TOP=248,GOAL_BOTTOM=372;

  function difficultyMult(){
    const d=(typeof S!=='undefined'&&S?.difficulty)||'Professional';
    if(d==='Legendary')return 1.22;
    if(d==='World Class')return 1.13;
    if(d==='Simulation')return 1.18;
    return 1.08;
  }

  function scoreAway(){
    const m=getMatch();if(!m)return;
    m.away=(m.away||0)+1;
    m.rating=Math.max(3,(m.rating||6)-.18);
    try{flash?.('Opponent scores.');}catch(_){ }
    const b=m.ball;b.owner=null;b.carrier=null;b.x=550;b.y=310;b.vx=b.vy=0;
    m.player.x=280;m.player.y=310;
    m.foes?.forEach((f,i)=>{f.x=620+(i%4)*95;f.y=80+(i%5)*108;});
    awayShot=null;
  }

  function hardenDefending(){
    const m=getMatch();if(!m?.running||m.training)return;
    const b=m.ball,p=m.player,mult=difficultyMult();
    if(b.owner==='player'){
      const ordered=[...(m.foes||[])].sort((a,c)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(c.x-p.x,c.y-p.y));
      ordered.slice(0,3).forEach((f,i)=>{
        const side=i===1?34:i===2?-34:0;
        const tx=p.x+(i===0?10:-16),ty=p.y+side;
        const dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy)||1,step=(i===0?1.35:1.05)*mult;
        f.x+=dx/d*step;f.y+=dy/d*step;
      });
      const nearest=ordered[0];
      if(nearest&&Math.hypot(nearest.x-p.x,nearest.y-p.y)<20&&Math.random()<.018*mult){
        b.owner='foe';b.carrier=nearest;b.vx=b.vy=0;m.rating=Math.max(3,(m.rating||6)-.1);
        try{flash?.('Strong challenge — possession lost.');}catch(_){ }
      }
    }
  }

  function makeOpponentAttack(){
    const m=getMatch();if(!m?.running||m.training||awayShot)return;
    const b=m.ball;if(b?.owner!=='foe'||!b.carrier)return;
    const f=b.carrier,mult=difficultyMult();
    f.x-=1.45*mult;
    f.y+=(310-f.y)*.012*mult;
    b.x=f.x-13;b.y=f.y;
    if(f.x<360&&Math.abs(f.y-310)<170&&Math.random()<.0105*mult){
      const targetY=310+(Math.random()-.5)*90;
      const dx=LEFT_LINE-f.x,dy=targetY-f.y,d=Math.hypot(dx,dy)||1,power=7.4+Math.random()*1.5;
      b.owner=null;b.carrier=null;b.x=f.x-14;b.y=f.y;b.vx=dx/d*power;b.vy=dy/d*power;
      awayShot={targetY,start:performance.now()};
      try{flash?.('Opponent shoots!');}catch(_){ }
    }
  }

  function handleAwayShot(){
    const m=getMatch();if(!m||!awayShot)return;
    const b=m.ball;
    if(b.x<=35){
      const onTarget=b.y>GOAL_TOP&&b.y<GOAL_BOTTOM;
      const saveChance=.38-(difficultyMult()-1)*.5;
      if(onTarget&&Math.random()>saveChance)scoreAway();
      else{
        b.x=45;b.vx=2.5;b.vy+=(Math.random()-.5)*2;awayShot=null;
        try{flash?.(onTarget?'Your keeper saves!':'Opponent shoots wide.');}catch(_){ }
      }
    }
  }

  function wrapUpdate(){
    if(typeof update!=='function'||update.__harderAI)return;
    const base=update;
    const wrapped=function(){const out=base();hardenDefending();makeOpponentAttack();handleAwayShot();return out;};
    wrapped.__harderAI=true;update=wrapped;
  }
  wrapUpdate();setTimeout(wrapUpdate,500);
})();
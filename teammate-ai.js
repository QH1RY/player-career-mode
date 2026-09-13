(() => {
  const bridge=()=>window.Career3DBridge||{};
  const getMatch=()=>bridge().getMatch?.()||null;
  const GOAL_TOP=248,GOAL_BOTTOM=372,RIGHT_LINE=1082;
  let mateShot=null,lastOwner=null,lastCarrier=null,lastPlayerTouchAt=0,lastPlayerPassAt=0;

  function resetAfterGoal(){
    const m=getMatch();if(!m)return;
    const b=m.ball;
    m.player.x=280;m.player.y=310;
    m.mates?.forEach((a,i)=>{a.x=150+(i%3)*150;a.y=80+(i%5)*110;});
    m.foes?.forEach((f,i)=>{f.x=620+(i%4)*95;f.y=80+(i%5)*108;});
    b.owner=null;b.carrier=null;b.x=550;b.y=310;b.vx=0;b.vy=0;
    mateShot=null;
  }

  function teammateShoot(a){
    const m=getMatch(),b=m?.ball;if(!m||!b||b.owner!=='mate'||b.carrier!==a||m.training||m.setPieceTaking)return false;
    const dist=Math.max(1,RIGHT_LINE-a.x);
    const shootingLane=Math.abs(a.y-310);
    const accuracy=Math.max(.42,Math.min(.88,.78-dist/1300-shootingLane/900));
    const targetY=310+(Math.random()-.5)*86;
    const error=(Math.random()-.5)*(1-accuracy)*72;
    const finalY=Math.max(GOAL_TOP-24,Math.min(GOAL_BOTTOM+24,targetY+error));
    const dx=RIGHT_LINE-a.x,dy=finalY-a.y,d=Math.hypot(dx,dy)||1;
    const power=7.0+Math.random()*1.8;
    b.owner=null;b.carrier=null;b.x=a.x+16;b.y=a.y;b.vx=dx/d*power;b.vy=dy/d*power;
    mateShot={shooter:a,targetY:finalY,start:performance.now(),assistEligible:performance.now()-lastPlayerPassAt<6000};
    bridge().teammateShot={active:true,start:mateShot.start,targetY:finalY};
    try{flash?.('Teammate shoots!');}catch(_){ }
    return true;
  }

  function maybeShoot(){
    const m=getMatch();if(!m?.running||m.training||m.setPieceTaking||mateShot)return;
    const b=m.ball;if(b?.owner!=='mate'||!b.carrier)return;
    const a=b.carrier;
    const pressure=m.foes?.reduce((best,f)=>Math.min(best,Math.hypot(f.x-a.x,f.y-a.y)),999)??999;
    const inRange=a.x>745;
    const centralEnough=Math.abs(a.y-310)<190;
    const settled=performance.now()>(a.holdUntil||0)-120;
    if(!inRange||!centralEnough||!settled)return;

    let chance=.006;
    if(a.x>850)chance=.018;
    if(a.x>930)chance=.045;
    if(pressure<55)chance*=.72;
    if(pressure>110)chance*=1.35;
    if(Math.random()<chance)teammateShoot(a);
  }

  function handleMateShot(){
    const m=getMatch();if(!m||!mateShot)return;
    const b=m.ball;
    // Add slight natural placement while keeping the shot visibly physical.
    if(b.x<RIGHT_LINE-10)b.vy+=(mateShot.targetY-b.y)*.0007;

    if(b.x>=1062){
      const onTarget=b.y>GOAL_TOP&&b.y<GOAL_BOTTOM;
      const keeper=m.keeper||{x:1046,y:310};
      const keeperGap=Math.abs(b.y-keeper.y);
      const saveChance=Math.max(.12,.52-keeperGap/150);
      const saved=onTarget&&Math.random()<saveChance;

      if(onTarget&&!saved){
        m.home=(m.home||0)+1;
        m.rating=Math.min(10,(m.rating||6)+(mateShot.assistEligible?.35:.08));
        if(mateShot.assistEligible){m.playerAssists=(m.playerAssists||0)+1;try{flash?.('GOAL! Teammate scores from your pass — ASSIST!');}catch(_){ }}
        else{try{flash?.('GOAL! Your teammate scores!');}catch(_){ }}
        bridge().teammateShot={active:false,scored:true};
        setTimeout(()=>{const live=getMatch();if(live?.running)resetAfterGoal();},420);
      }else{
        b.vx=saved?-3.0:-2.0;b.vy+=(Math.random()-.5)*2.0;b.x=1040;
        try{flash?.(saved?'Teammate shot saved!':'Teammate shoots wide.');}catch(_){ }
        bridge().teammateShot={active:false,scored:false};
      }
      mateShot=null;
    }
  }

  function trackTouches(){
    const m=getMatch();if(!m?.ball)return;
    const owner=m.ball.owner,carrier=m.ball.carrier;
    if(owner==='player')lastPlayerTouchAt=performance.now();
    if(lastOwner==='player'&&owner===null)lastPlayerPassAt=performance.now();
    if(owner==='mate'&&lastOwner===null&&performance.now()-lastPlayerTouchAt<1800)lastPlayerPassAt=performance.now();
    lastOwner=owner;lastCarrier=carrier;
  }

  function improveRuns(){
    const m=getMatch();if(!m?.running||m.training||!m.mates?.length)return;
    const b=m.ball;
    if(b.owner!=='player'&&b.owner!=='mate')return;
    m.mates.forEach((a,i)=>{
      if(i<6||a===b.carrier)return;
      // Attackers keep moving into scoring positions instead of stopping beside the ball carrier.
      const lane=i===6?215:i===7?310:405;
      const targetX=Math.min(1010,(b.owner==='player'?m.player.x:b.x)+150+(i-6)*18);
      a.x+=Math.max(-1.4,Math.min(1.4,(targetX-a.x)*.018));
      a.y+=Math.max(-1.05,Math.min(1.05,(lane-a.y)*.018));
    });
  }

  function wrapUpdate(){
    if(typeof update!=='function'||update.__teammateScoring)return;
    const base=update;
    const wrapped=function(){
      trackTouches();
      const out=base();
      improveRuns();
      maybeShoot();
      handleMateShot();
      return out;
    };
    wrapped.__teammateScoring=true;update=wrapped;
  }

  wrapUpdate();setTimeout(wrapUpdate,450);
})();
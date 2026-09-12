(() => {
  const LEFT_GOAL_X = 18;
  const RIGHT_GOAL_X = 1082;
  const GOAL_TOP = 248;
  const GOAL_BOTTOM = 372;

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  function ensureKeepers(){
    if(!match) return;
    match.homeKeeper = match.homeKeeper || {x:54,y:310,side:'home',reaction:0};
    match.awayKeeper = match.awayKeeper || match.keeper || {x:1046,y:310,side:'away',reaction:0};
    match.keeper = match.awayKeeper;
  }

  function keeperAI(gk, targetX, facing){
    const b = match.ball;
    const targetY = clamp(b.y, GOAL_TOP+14, GOAL_BOTTOM-14);
    gk.y += (targetY-gk.y)*0.085;
    gk.x += (targetX-gk.x)*0.08;

    // Rush slightly when the ball gets close to the box.
    if(facing==='right' && b.x < 190) gk.x = Math.min(92, gk.x + 0.7);
    if(facing==='left' && b.x > 910) gk.x = Math.max(1008, gk.x - 0.7);
  }

  const oldUpdate = update;
  update = function(){
    oldUpdate();
    if(!match?.running) return;
    ensureKeepers();
    const b = match.ball;
    const hgk = match.homeKeeper;
    const agk = match.awayKeeper;

    keeperAI(hgk,54,'right');
    keeperAI(agk,1046,'left');

    // Away keeper handles the user's shots at the right goal.
    if(match.shotInFlight && b.vx>0 && Math.hypot(b.x-agk.x,b.y-agk.y)<25){
      const saveChance = .38 + Math.max(0,(72-S.attributes.shooting))/125;
      if(Math.random()<saveChance){
        match.shotInFlight=false;
        b.owner=null;b.carrier=null;b.vx=-4.1;b.vy+=(Math.random()-.5)*3.4;
        flash('Great save by the goalkeeper!');
      }
    }

    // Opponents can now shoot at your goal too.
    if(b.owner==='foe' && b.carrier && b.carrier.x<235 && Math.random()<0.006){
      const dx=LEFT_GOAL_X-b.carrier.x;
      const targetY=clamp(310+(Math.random()-.5)*90,GOAL_TOP+8,GOAL_BOTTOM-8);
      const dy=targetY-b.carrier.y;
      const d=Math.hypot(dx,dy)||1;
      b.owner=null;b.carrier=null;b.vx=dx/d*7.4;b.vy=dy/d*7.4;
      match.opponentShot=true;
      flash('Opponent shoots!');
    }

    // Home keeper saves opponent shots.
    if(match.opponentShot && b.vx<0 && Math.hypot(b.x-hgk.x,b.y-hgk.y)<25){
      if(Math.random()<0.62){
        match.opponentShot=false;
        b.vx=4.1;b.vy+=(Math.random()-.5)*3.4;
        flash('Your goalkeeper makes the save!');
      }
    }

    // Opponent goal at the left end.
    if(match.opponentShot && b.x<=LEFT_GOAL_X){
      match.opponentShot=false;
      if(b.y>GOAL_TOP && b.y<GOAL_BOTTOM){
        match.away++;
        flash('Goal conceded.');
        setTimeout(()=>{
          if(!match?.running) return;
          match.player.x=280;match.player.y=310;
          b.owner=null;b.carrier=null;b.x=550;b.y=310;b.vx=0;b.vy=0;
        },450);
      } else {
        b.x=90;b.y=clamp(b.y,45,575);b.vx=2.4;b.vy=0;
        flash('Opponent shot goes wide.');
      }
    }
  };

  function drawKeeper(gk, colour){
    if(!gk) return;
    // Use the footballer model, then add gloves so the GK is visually distinct.
    drawPlayer(gk, colour, false);
    ctx.save();
    ctx.translate(gk.x,gk.y);
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(-18,-2,3.8,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(18,-2,3.8,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  const oldDraw = draw;
  draw = function(){
    oldDraw();
    if(!match) return;
    ensureKeepers();
    let mode=$('#cameraSelect').value,p=match.player,scale=1,ox=0,oy=0;
    if(mode==='Pro Camera'){scale=1.42;ox=cvs.width/2-p.x*scale;oy=cvs.height*.68-p.y*scale}
    else if(mode==='Shoulder'){scale=1.72;ox=cvs.width*.42-p.x*scale;oy=cvs.height*.72-p.y*scale}
    else if(mode==='Player Follow'){scale=1.2;ox=cvs.width/2-p.x*scale;oy=cvs.height/2-p.y*scale}
    ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    drawKeeper(match.homeKeeper,'#35d0ff');
    drawKeeper(match.awayKeeper,'#ffb42d');
    ctx.restore();
  };
})();
(() => {
  const joystick = document.getElementById('joystick');
  const stick = document.getElementById('stick');
  const sprint = document.getElementById('touchSprint');
  const pass = document.getElementById('touchPass');
  const shoot = document.getElementById('touchShoot');
  const tackle = document.getElementById('touchTackle');
  const actions = document.querySelector('.action-buttons');
  if (!joystick || !stick) return;

  // Add an iPad skill button without requiring a keyboard.
  const skill = document.createElement('button');
  skill.id = 'touchSkill';
  skill.className = 'action skill';
  skill.textContent = 'SKILL';
  Object.assign(skill.style,{right:'142px',top:'88px',width:'64px',height:'64px',background:'rgba(180,106,255,.9)',color:'#fff'});
  actions?.appendChild(skill);

  let activePointer = null;
  const max = 38;
  let joyX = 0, joyY = 0;

  function setDir(x, y) {
    const mag = Math.hypot(x, y);
    const nx = mag ? x / mag : 0;
    const ny = mag ? y / mag : 0;
    joyX = nx; joyY = ny;
    const dist = Math.min(max, mag);
    stick.style.transform = `translate(${nx * dist}px, ${ny * dist}px)`;
    keys.a = nx < -0.25;
    keys.d = nx > 0.25;
    keys.w = ny < -0.25;
    keys.s = ny > 0.25;
  }

  function clearDir() {
    joyX = joyY = 0;
    stick.style.transform = 'translate(0,0)';
    keys.a = keys.d = keys.w = keys.s = false;
  }

  function moveFromEvent(e) {
    const r = joystick.getBoundingClientRect();
    setDir(e.clientX - (r.left+r.width/2), e.clientY - (r.top+r.height/2));
  }

  joystick.addEventListener('pointerdown', e => {activePointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveFromEvent(e);e.preventDefault();});
  joystick.addEventListener('pointermove', e => {if(e.pointerId!==activePointer)return;moveFromEvent(e);e.preventDefault();});
  const endStick=e=>{if(activePointer!==null&&e.pointerId!==activePointer)return;activePointer=null;clearDir();e.preventDefault();};
  joystick.addEventListener('pointerup',endStick);joystick.addEventListener('pointercancel',endStick);

  function holdButton(el,keyName){
    if(!el)return;
    el.addEventListener('pointerdown',e=>{keys[keyName]=true;el.classList.add('active');el.setPointerCapture?.(e.pointerId);e.preventDefault();});
    const release=e=>{keys[keyName]=false;el.classList.remove('active');e.preventDefault();};
    el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
  }
  function tapButton(el,keyName,ms=90){
    if(!el)return;
    el.addEventListener('pointerdown',e=>{keys[keyName]=true;el.classList.add('active');e.preventDefault();setTimeout(()=>{keys[keyName]=false;el.classList.remove('active');},ms);});
  }
  holdButton(sprint,'shift');
  tapButton(pass,' ');
  tapButton(shoot,'j',110);
  tapButton(tackle,'k',110);
  tapButton(skill,'x',130);

  document.addEventListener('touchmove',e=>{if(e.target.closest?.('.touch-controls'))e.preventDefault();},{passive:false});

  // ===== Improved football match engine =====
  const GOAL_TOP = 248;
  const GOAL_BOTTOM = 372;
  const RIGHT_LINE = 1082;
  const LEFT_LINE = 18;
  let lastShot = 0;
  let skillCooldown = 0;
  let evadeUntil = 0;
  let tackleCooldown = 0;
  let lastMoveX = 1, lastMoveY = 0;

  function ballFree(x=550,y=310,vx=0,vy=0){
    match.ball.owner=null;match.ball.x=x;match.ball.y=y;match.ball.vx=vx;match.ball.vy=vy;
  }
  function kickOffReset(){
    if(!match)return;
    match.player.x=280;match.player.y=310;
    match.foes.forEach((f,i)=>{f.x=620+(i%4)*95;f.y=80+(i%5)*108;f.tackleCd=0;});
    ballFree(550,310,0,0);
  }
  function scoreGoal(){
    match.home++;match.playerGoals=(match.playerGoals||0)+1;match.rating=Math.min(10,match.rating+1.35);
    flash('GOAL! You found the net.');
    setTimeout(()=>{if(match?.running)kickOffReset();},450);
  }
  function shootBall(){
    if(!match || match.ball.owner!=='player')return;
    const now=performance.now(); if(now-lastShot<250)return; lastShot=now;
    const p=match.player,b=match.ball;
    const targetY=Math.max(GOAL_TOP+10,Math.min(GOAL_BOTTOM-10,310 + (joyY||lastMoveY)*55 + (Math.random()-.5)*28));
    const dx=RIGHT_LINE-p.x,dy=targetY-p.y,dist=Math.hypot(dx,dy)||1;
    const power=7.8 + Math.min(3.2,S.attributes.shooting/35);
    b.owner=null;b.x=p.x+18;b.y=p.y;b.vx=dx/dist*power;b.vy=dy/dist*power;
    match.shotInFlight=true;
    flash('Shot away...');
  }
  function passBall(){
    if(!match || match.ball.owner!=='player')return;
    let nearest=match.mates.slice().sort((a,b)=>Math.hypot(a.x-match.player.x,a.y-match.player.y)-Math.hypot(b.x-match.player.x,b.y-match.player.y))[0];
    let tx=nearest?.x||match.player.x+140,ty=nearest?.y||match.player.y;
    const dx=tx-match.player.x,dy=ty-match.player.y,d=Math.hypot(dx,dy)||1;
    ballFree(match.player.x+14,match.player.y,dx/d*5.4,dy/d*5.4);match.chances++;match.rating=Math.min(10,match.rating+.08);flash('Pass played.');
  }
  function useSkill(){
    if(!match?.running || match.ball.owner!=='player' || skillCooldown>0)return;
    skillCooldown=34;
    const p=match.player;
    const near=match.foes.reduce((best,f)=>{const d=Math.hypot(f.x-p.x,f.y-p.y);return d<(best?.d??999)?{f,d}:best},null);
    const skillNames=['Step-over','Body feint','Roulette'];
    const name=skillNames[Math.floor(Math.random()*skillNames.length)];
    let dx=joyX||lastMoveX||1,dy=joyY||lastMoveY||0;
    if(name==='Roulette'){const ox=dx;dx=-dy;dy=ox;}
    if(name==='Body feint'){dy+=(Math.random()<.5?-.7:.7);const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;}
    p.x=Math.max(35,Math.min(1065,p.x+dx*32));p.y=Math.max(35,Math.min(585,p.y+dy*32));
    evadeUntil=performance.now()+650;
    if(near&&near.d<72){match.dribbles++;match.rating=Math.min(10,match.rating+.14);flash(`${name}! Defender beaten.`);}else flash(`${name}.`);
  }
  function playerTackle(){
    if(!match?.running || tackleCooldown>0)return;tackleCooldown=28;
    const p=match.player;let near=match.foes.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<34);
    if(near && match.ball.owner==='foe'){match.ball.owner='player';match.rating=Math.min(10,match.rating+.1);flash('Great tackle! Ball won.');}
  }

  // Override the original update loop with proper shots, goals and defender tackling.
  update = function(){
    if(!match)return;
    const p=match.player,b=match.ball;
    let spd=keys.shift?3.8:2.55;
    let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
    let m=Math.hypot(dx,dy)||1;
    if(dx||dy){lastMoveX=dx/m;lastMoveY=dy/m;}
    p.x=Math.max(28,Math.min(1072,p.x+dx/m*spd));p.y=Math.max(28,Math.min(592,p.y+dy/m*spd));
    match.time+=.038*60;
    if(skillCooldown>0)skillCooldown--;if(tackleCooldown>0)tackleCooldown--;

    if(keys.x){keys.x=false;useSkill();}
    if(keys.j){keys.j=false;shootBall();}
    if(keys[' ']){keys[' ']=false;passBall();}
    if(keys.k){keys.k=false;playerTackle();}

    // Pick up a loose ball.
    if(b.owner===null && Math.hypot(p.x-b.x,p.y-b.y)<22 && Math.hypot(b.vx||0,b.vy||0)<4.8){b.owner='player';b.vx=b.vy=0;match.rating=Math.min(10,match.rating+.01);}
    if(b.owner==='player'){b.x=p.x+16*(lastMoveX||1);b.y=p.y+8*(lastMoveY||0);}
    else if(b.owner==='foe' && b.carrier){b.x=b.carrier.x-13;b.y=b.carrier.y;}
    else{
      b.x+=(b.vx||0);b.y+=(b.vy||0);b.vx=(b.vx||0)*.985;b.vy=(b.vy||0)*.985;
      // Keep normal loose balls in play, but allow shots through the goal line.
      if(!match.shotInFlight){if(b.y<25||b.y>595)b.vy*=-.75;if(b.x<25||b.x>1075)b.vx*=-.75;}
    }

    // Goalkeeper guards the opponent goal and can save central/weak shots.
    match.keeper=match.keeper||{x:1046,y:310};
    match.keeper.y += (Math.max(GOAL_TOP+14,Math.min(GOAL_BOTTOM-14,b.y))-match.keeper.y)*.075;
    if(match.shotInFlight && b.vx>0 && Math.hypot(b.x-match.keeper.x,b.y-match.keeper.y)<24){
      const saveChance=.35 + Math.max(0,(70-S.attributes.shooting))/120;
      if(Math.random()<saveChance){match.shotInFlight=false;b.vx=-3.4;b.vy+=(Math.random()-.5)*3;flash('Saved by the goalkeeper!');}
    }

    // A goal only counts if the moving ball actually crosses the line inside the posts.
    if(match.shotInFlight && b.x>=RIGHT_LINE){
      match.shotInFlight=false;
      if(b.y>GOAL_TOP && b.y<GOAL_BOTTOM) scoreGoal();
      else {flash('Shot wide.');ballFree(1010,Math.max(45,Math.min(575,b.y)),-2.2,0);}
    }

    // Defenders track the player, close space and make timed tackles.
    match.foes.forEach((f,i)=>{
      f.tackleCd=Math.max(0,(f.tackleCd||0)-1);
      const hasPlayerBall=b.owner==='player';
      let tx,ty;
      if(hasPlayerBall && i<4){tx=p.x+(i%2?20:-18);ty=p.y+(i-1.5)*20;}
      else if(b.owner===null && i<3){tx=b.x;ty=b.y;}
      else {tx=610+(i%4)*105;ty=75+(i%5)*112;}
      const ddx=tx-f.x,ddy=ty-f.y,dm=Math.hypot(ddx,ddy)||1;
      const defSpeed=hasPlayerBall&&i<4?2.25:1.25;
      f.x+=ddx/dm*defSpeed;f.y+=ddy/dm*defSpeed;

      if(hasPlayerBall && performance.now()>evadeUntil && f.tackleCd<=0 && Math.hypot(f.x-p.x,f.y-p.y)<25){
        f.tackleCd=75;
        const win=.46 + Math.max(0,(68-S.attributes.dribbling))/140 + (keys.shift?.07:0);
        if(Math.random()<win){b.owner='foe';b.carrier=f;match.rating=Math.max(3,match.rating-.12);p.x-=10;flash('Tackled! The defender wins the ball.');}
        else {match.dribbles++;match.rating=Math.min(10,match.rating+.05);flash('You ride the tackle.');}
      }
    });

    // Opponent carrier moves away and then releases the ball, allowing you to tackle back.
    if(b.owner==='foe'&&b.carrier){const f=b.carrier;f.x=Math.max(90,f.x-1.6);if(Math.random()<.006){b.owner=null;b.carrier=null;b.vx=-3.2;b.vy=(Math.random()-.5)*2;}}

    match.mates.forEach((a,i)=>{a.x+=(Math.min(980,p.x+80+(i%3)*70)-a.x)*.002;a.y+=(75+(i%5)*110-a.y)*.003;});
    $('#clock').textContent=`${String(Math.min(90,Math.floor(match.time/60))).padStart(2,'0')}:${String(Math.floor(match.time%60)).padStart(2,'0')}`;
    $('#homeScore').textContent=match.home;$('#awayScore').textContent=match.away;$('#matchRating').textContent=match.rating.toFixed(1);
  };

  // Draw real goal frames/nets and the goalkeeper.
  const baseDrawPitch=drawPitch;
  drawPitch = function(){
    baseDrawPitch();
    ctx.save();
    ctx.lineWidth=4;ctx.strokeStyle='#fff';
    // left goal
    ctx.strokeRect(0,GOAL_TOP,18,GOAL_BOTTOM-GOAL_TOP);
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;
    for(let y=GOAL_TOP;y<=GOAL_BOTTOM;y+=12){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(18,y);ctx.stroke();}
    // right goal
    ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(RIGHT_LINE,GOAL_TOP,18,GOAL_BOTTOM-GOAL_TOP);
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;
    for(let y=GOAL_TOP;y<=GOAL_BOTTOM;y+=12){ctx.beginPath();ctx.moveTo(RIGHT_LINE,y);ctx.lineTo(1100,y);ctx.stroke();}
    for(let x=RIGHT_LINE;x<=1100;x+=6){ctx.beginPath();ctx.moveTo(x,GOAL_TOP);ctx.lineTo(x,GOAL_BOTTOM);ctx.stroke();}
    ctx.restore();
  };

  const baseDraw=draw;
  draw = function(){
    baseDraw();
    if(!match?.keeper)return;
    // Draw keeper on top in canvas coordinates respecting the active camera.
    let mode=$('#cameraSelect').value,p=match.player,scale=1,ox=0,oy=0;
    if(mode==='Pro Camera'){scale=1.42;ox=cvs.width/2-p.x*scale;oy=cvs.height*.68-p.y*scale}
    else if(mode==='Shoulder'){scale=1.72;ox=cvs.width*.42-p.x*scale;oy=cvs.height*.72-p.y*scale}
    else if(mode==='Player Follow'){scale=1.2;ox=cvs.width/2-p.x*scale;oy=cvs.height/2-p.y*scale}
    ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    drawPlayer(match.keeper,'#ffb42d',false);
    ctx.restore();
  };
})();
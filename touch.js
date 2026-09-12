(() => {
  const joystick=document.getElementById('joystick'),stick=document.getElementById('stick');
  const sprint=document.getElementById('touchSprint'),pass=document.getElementById('touchPass'),shoot=document.getElementById('touchShoot'),tackle=document.getElementById('touchTackle');
  const actions=document.querySelector('.action-buttons');
  if(!joystick||!stick)return;

  let skill=document.getElementById('touchSkill');
  if(!skill){
    skill=document.createElement('button');skill.id='touchSkill';skill.className='action skill';skill.textContent='SKILL';
    Object.assign(skill.style,{right:'142px',top:'88px',width:'64px',height:'64px',background:'rgba(180,106,255,.92)',color:'#fff'});
    actions?.appendChild(skill);
  }

  const bridge=()=>window.Career3DBridge||{};
  if(!bridge().shotAim)bridge().shotAim={active:false,offset:0,power:.72};

  let activePointer=null,joyX=0,joyY=0,joyMag=0,velocityX=0,velocityY=0,lastMoveX=1,lastMoveY=0;
  let lastShot=0,skillCooldown=0,evadeUntil=0,tackleCooldown=0;
  const max=46,deadzone=.075,GOAL_TOP=248,GOAL_BOTTOM=372,RIGHT_LINE=1082;

  function publishInput(){
    bridge().lastMove={x:lastMoveX,y:lastMoveY};
    bridge().analogueInput={x:joyX,y:joyY,mag:joyMag};
  }
  function setDir(x,y){
    const mag=Math.hypot(x,y),nx=mag?x/mag:0,ny=mag?y/mag:0,raw=Math.min(1,mag/max);
    joyMag=raw<deadzone?0:(raw-deadzone)/(1-deadzone);joyX=joyMag?nx:0;joyY=joyMag?ny:0;
    const dist=Math.min(max,mag);stick.style.transform=`translate(${nx*dist}px,${ny*dist}px)`;publishInput();
  }
  function clearDir(){joyX=joyY=joyMag=0;stick.style.transform='translate(0,0)';keys.a=keys.d=keys.w=keys.s=false;publishInput();}
  function moveFromEvent(e){const r=joystick.getBoundingClientRect();setDir(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);}
  joystick.addEventListener('pointerdown',e=>{activePointer=e.pointerId;joystick.setPointerCapture?.(e.pointerId);moveFromEvent(e);e.preventDefault();});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;moveFromEvent(e);e.preventDefault();});
  const endStick=e=>{if(activePointer!==null&&e.pointerId!==activePointer)return;activePointer=null;clearDir();e.preventDefault();};
  joystick.addEventListener('pointerup',endStick);joystick.addEventListener('pointercancel',endStick);

  function holdButton(el,keyName){
    if(!el)return;
    el.addEventListener('pointerdown',e=>{if(bridge().inputLocked)return;keys[keyName]=true;el.classList.add('active');el.setPointerCapture?.(e.pointerId);e.preventDefault();});
    const release=e=>{keys[keyName]=false;el.classList.remove('active');e.preventDefault();};
    el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
  }
  function tapButton(el,keyName,ms=90){
    if(!el)return;
    el.addEventListener('pointerdown',e=>{if(bridge().inputLocked)return;keys[keyName]=true;el.classList.add('active');e.preventDefault();setTimeout(()=>{keys[keyName]=false;el.classList.remove('active');},ms);});
  }
  holdButton(sprint,'shift');tapButton(pass,' ',80);tapButton(tackle,'k',95);tapButton(skill,'x',105);

  let shotPointer=null,shotStartX=0,shotStartY=0;
  shoot?.addEventListener('pointerdown',e=>{
    if(bridge().inputLocked)return;
    shotPointer=e.pointerId;shotStartX=e.clientX;shotStartY=e.clientY;shoot.setPointerCapture?.(e.pointerId);shoot.classList.add('active');
    const a=bridge().shotAim||(bridge().shotAim={});a.active=true;a.offset=0;a.power=.68;e.preventDefault();
  });
  shoot?.addEventListener('pointermove',e=>{
    if(e.pointerId!==shotPointer)return;const a=bridge().shotAim;if(!a)return;
    a.offset=Math.max(-1,Math.min(1,(e.clientX-shotStartX)/82));
    a.power=Math.max(.48,Math.min(1,.64+(shotStartY-e.clientY)/112));e.preventDefault();
  });
  function releaseShot(e){
    if(shotPointer===null||(e.pointerId!==undefined&&e.pointerId!==shotPointer))return;
    const a=bridge().shotAim||{offset:0,power:.7};shoot.classList.remove('active');shotPointer=null;a.active=false;
    if(!bridge().inputLocked)shootBall(a.offset||0,a.power||.7);e.preventDefault();
  }
  shoot?.addEventListener('pointerup',releaseShot);
  shoot?.addEventListener('pointercancel',e=>{if(bridge().shotAim)bridge().shotAim.active=false;shotPointer=null;shoot.classList.remove('active');e.preventDefault();});
  document.addEventListener('touchmove',e=>{if(e.target.closest?.('.touch-controls'))e.preventDefault();},{passive:false});

  function cameraRelativeInput(){
    if(!joyMag)return null;
    const b=bridge().cameraBasis||{fx:1,fz:0,rx:0,rz:1};
    const forward=-joyY,right=joyX;
    let x=b.rx*right+b.fx*forward,y=b.rz*right+b.fz*forward;
    const m=Math.hypot(x,y)||1;return{x:x/m,y:y/m,mag:joyMag};
  }
  function ballFree(x=550,y=310,vx=0,vy=0){match.ball.owner=null;match.ball.carrier=null;match.ball.x=x;match.ball.y=y;match.ball.vx=vx;match.ball.vy=vy;}
  function kickOffReset(){if(!match)return;match.player.x=280;match.player.y=310;velocityX=velocityY=0;match.foes.forEach((f,i)=>{f.x=620+(i%4)*95;f.y=80+(i%5)*108;f.tackleCd=0;});ballFree();}
  function scoreGoal(){match.home++;match.playerGoals=(match.playerGoals||0)+1;match.rating=Math.min(10,match.rating+1.35);flash('GOAL!');setTimeout(()=>{if(match?.running&&!match.training)kickOffReset();},450);}

  function shootBall(offset=0,power=.7){
    if(!match||match.ball.owner!=='player'||bridge().inputLocked)return;
    const now=performance.now();if(now-lastShot<260)return;lastShot=now;
    const p=match.player,b=match.ball,shooting=S.attributes.shooting||60;
    const targetBase=310+offset*((GOAL_BOTTOM-GOAL_TOP)*.43);
    const error=(Math.random()-.5)*Math.max(2.5,13-(shooting-50)*.16)*(1-power*.42);
    const targetY=Math.max(GOAL_TOP+5,Math.min(GOAL_BOTTOM-5,targetBase+error));
    const dx=RIGHT_LINE-p.x,dy=targetY-p.y,dist=Math.hypot(dx,dy)||1;
    const shotPower=7.2+power*3.6+Math.max(0,shooting-60)*.022;
    b.owner=null;b.carrier=null;b.x=p.x+18;b.y=p.y;b.vx=dx/dist*shotPower;b.vy=dy/dist*shotPower;
    match.shotInFlight=true;match.shotTargetY=targetY;match.shotPower=power;
    bridge().playerAction={type:'shoot',active:true,start:now,duration:520};
    flash(offset<-.45?'Near-post strike...':offset>.45?'Far-post strike...':'Shot on target...');
  }

  function passToward(from,to,speed=5.0){const dx=to.x-from.x,dy=to.y-from.y,d=Math.hypot(dx,dy)||1;ballFree(from.x,from.y,dx/d*speed,dy/d*speed);}
  function bestSupportTarget(){
    const p=match.player,dirX=lastMoveX||1,dirY=lastMoveY||0;let best=null,bestScore=-9999;
    match.mates.forEach((a,i)=>{if(!a)return;const dx=a.x-p.x,dy=a.y-p.y,dist=Math.hypot(dx,dy)||1,forward=(dx*dirX+dy*dirY)/dist,width=Math.abs(dy)/220,pressure=match.foes.reduce((m,f)=>Math.min(m,Math.hypot(f.x-a.x,f.y-a.y)),999),score=forward*2.2-Math.abs(dist-145)/130+Math.min(1,pressure/90)*.9+width*.15+(i>=6?.25:0);if(score>bestScore){bestScore=score;best=a;}});
    return best;
  }
  function passBall(){
    if(!match||bridge().inputLocked)return;
    if(match.ball.owner==='mate'&&match.ball.carrier){const a=match.ball.carrier;passToward(a,match.player,5.3);flash('Teammate returns it.');return;}
    if(match.ball.owner!=='player')return;const target=bestSupportTarget();if(!target)return;
    passToward(match.player,target,5.25);match.chances++;match.rating=Math.min(10,match.rating+.08);bridge().playerAction={type:'pass',active:true,start:performance.now(),duration:380};flash('Pass played.');
  }
  function useLegacySkill(){
    if(!match?.running||match.ball.owner!=='player'||skillCooldown>0||bridge().skillSystemReady)return;
    skillCooldown=34;const p=match.player,dx=lastMoveX||1,dy=lastMoveY||0;p.x=Math.max(35,Math.min(1065,p.x+dx*12));p.y=Math.max(35,Math.min(585,p.y+dy*12));evadeUntil=performance.now()+500;flash('Skill move.');
  }
  function playerTackle(){if(!match?.running||tackleCooldown>0||bridge().inputLocked)return;tackleCooldown=30;const p=match.player,near=match.foes.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<34);if(near&&match.ball.owner==='foe'){match.ball.owner='player';match.ball.carrier=null;match.rating=Math.min(10,match.rating+.1);bridge().playerAction={type:'tackle',active:true,start:performance.now(),duration:460};flash('Ball won!');}}

  function moveMate(a,tx,ty,speed){const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy)||1,step=Math.min(speed,d);a.x+=dx/d*step;a.y+=dy/d*step;a.x=Math.max(40,Math.min(1040,a.x));a.y=Math.max(40,Math.min(580,a.y));}
  function updateTeammates(){
    const p=match.player,b=match.ball;if(!match.mates.length)return;
    match.mates.forEach((a,i)=>{if(a.baseLane==null){a.baseLane=i%5;a.role=i<3?'defender':i<6?'midfielder':'attacker';}});
    const nearestFoeDist=match.foes.reduce((m,f)=>Math.min(m,Math.hypot(f.x-p.x,f.y-p.y)),999),underPressure=nearestFoeDist<78;
    const nearestMateToBall=match.mates.reduce((best,a)=>{const d=Math.hypot(a.x-b.x,a.y-b.y);return d<(best?.d??999)?{a,d}:best},null);
    match.mates.forEach((a,i)=>{
      let tx=a.x,ty=a.y,speed=1.0;const laneY=70+(i%5)*120;
      if(b.owner==='player'){
        if(a.role==='attacker'){tx=Math.min(1015,p.x+150+(i-6)*42);ty=Math.max(65,Math.min(555,p.y+(i===6?-125:i===7?0:125)));speed=1.28;}
        else if(a.role==='midfielder'){
          if(underPressure&&i===3){tx=p.x-55;ty=p.y-70;speed=1.35;}else if(underPressure&&i===4){tx=p.x-50;ty=p.y+70;speed=1.35;}else{tx=Math.min(960,p.x+65+(i-3)*25);ty=p.y+(i===3?-105:i===4?0:105);speed=1.15;}
        }else{tx=Math.max(90,p.x-145+(i%2)*35);ty=laneY;speed=.92;}
      }else if(b.owner==='mate'){
        if(b.carrier===a){tx=Math.min(1005,a.x+85);ty=a.y+(310-a.y)*.06;speed=1.38;}else if(a.role==='attacker'){tx=Math.min(1030,b.x+120);ty=laneY;speed=1.22;}else{tx=Math.min(980,b.x+20+(i%3)*45);ty=laneY;speed=1.0;}
      }else if(b.owner===null&&nearestMateToBall?.a===a){tx=b.x;ty=b.y;speed=1.48;}else{tx=Math.min(930,220+(i%3)*170);ty=laneY;speed=.86;}
      moveMate(a,tx,ty,speed);
    });
    if(b.owner===null&&nearestMateToBall&&nearestMateToBall.d<21&&Math.hypot(b.vx||0,b.vy||0)<4.5){b.owner='mate';b.carrier=nearestMateToBall.a;b.vx=b.vy=0;b.carrier.holdUntil=performance.now()+650+Math.random()*500;}
    if(b.owner==='mate'&&b.carrier){
      const a=b.carrier;b.x=a.x+12;b.y=a.y;const pressure=match.foes.reduce((m,f)=>Math.min(m,Math.hypot(f.x-a.x,f.y-a.y)),999),canRelease=performance.now()>(a.holdUntil||0);
      if(canRelease&&(pressure<65||Math.hypot(a.x-p.x,a.y-p.y)>230||Math.random()<.012)){
        if(p.x<a.x+120){passToward(a,p,5.25);flash('Teammate finds you.');}else{const forward=match.mates.filter(x=>x!==a&&x.x>a.x+40).sort((x,y)=>y.x-x.x)[0];if(forward)passToward(a,forward,5.0);else passToward(a,p,5.1);}
      }
    }
  }

  update=function(){
    if(!match)return;const p=match.player,b=match.ball;
    let inputX=0,inputY=0,inputMag=0;const locked=!!bridge().inputLocked;
    const mobile=locked?null:cameraRelativeInput();
    if(!locked&&mobile){inputX=mobile.x;inputY=mobile.y;inputMag=mobile.mag;}
    else if(!locked){inputX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);inputY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);inputMag=Math.min(1,Math.hypot(inputX,inputY));const m=Math.hypot(inputX,inputY)||1;inputX/=m;inputY/=m;}
    if(inputMag>.02){lastMoveX=inputX;lastMoveY=inputY;publishInput();}

    const pace=S.attributes.pace||65,paceBoost=Math.max(0,(pace-60)/180),baseSpeed=1.62+paceBoost,sprintSpeed=2.30+paceBoost*.62,targetSpeed=(keys.shift?sprintSpeed:baseSpeed)*inputMag;
    const targetVX=inputX*targetSpeed,targetVY=inputY*targetSpeed,accel=inputMag>0?(keys.shift?0.15:0.21):0.30;
    if(locked){velocityX*=.58;velocityY*=.58;}else{velocityX+=(targetVX-velocityX)*accel;velocityY+=(targetVY-velocityY)*accel;if(inputMag===0){velocityX*=.79;velocityY*=.79;}p.x=Math.max(28,Math.min(1072,p.x+velocityX));p.y=Math.max(28,Math.min(592,p.y+velocityY));}
    match.time+=.038*60;if(skillCooldown>0)skillCooldown--;if(tackleCooldown>0)tackleCooldown--;

    if(!locked){if(keys.j){keys.j=false;shootBall(0,.72);}if(keys[' ']){keys[' ']=false;passBall();}if(keys.k){keys.k=false;playerTackle();}if(keys.x){keys.x=false;useLegacySkill();}}
    else{keys[' ']=keys.j=keys.k=keys.x=false;}

    if(b.owner===null&&!match.setPieceTaking&&Math.hypot(p.x-b.x,p.y-b.y)<23&&Math.hypot(b.vx||0,b.vy||0)<4.8){b.owner='player';b.carrier=null;b.vx=b.vy=0;}
    if(b.owner==='player'){b.x=p.x+16*(lastMoveX||1);b.y=p.y+8*(lastMoveY||0);}else if(b.owner==='foe'&&b.carrier){b.x=b.carrier.x-13;b.y=b.carrier.y;}else if(b.owner===null&&!match.setPieceTaking){b.x+=(b.vx||0);b.y+=(b.vy||0);b.vx=(b.vx||0)*.985;b.vy=(b.vy||0)*.985;if(!match.shotInFlight){if(b.y<25||b.y>595)b.vy*=-.75;if(b.x<25||b.x>1075)b.vx*=-.75;}}

    updateTeammates();
    match.keeper=match.keeper||{x:1046,y:310};
    if(!match.setPieceTaking)match.keeper.y+=(Math.max(GOAL_TOP+14,Math.min(GOAL_BOTTOM-14,b.y))-match.keeper.y)*.055;
    if(match.shotInFlight&&b.vx>0&&Math.hypot(b.x-match.keeper.x,b.y-match.keeper.y)<22){
      const placement=Math.min(1,Math.abs((match.shotTargetY||310)-310)/58),power=match.shotPower||.7,saveChance=Math.max(.08,.45-placement*.29-power*.12+Math.max(0,68-(S.attributes.shooting||60))/210);
      if(Math.random()<saveChance){match.shotInFlight=false;b.vx=-3.1;b.vy+=(Math.random()-.5)*2.2;flash('Saved!');}
    }
    if(match.shotInFlight&&b.x>=RIGHT_LINE){match.shotInFlight=false;if(b.y>GOAL_TOP&&b.y<GOAL_BOTTOM)scoreGoal();else{flash('Wide.');ballFree(1010,Math.max(45,Math.min(575,b.y)),-2,0);}}

    if(!match.training){
      match.foes.forEach((f,i)=>{f.tackleCd=Math.max(0,(f.tackleCd||0)-1);const has=b.owner==='player';let tx,ty;if(has&&i<4){tx=p.x+(i%2?22:-20);ty=p.y+(i-1.5)*24;}else if(b.owner==='mate'&&b.carrier&&i<4){tx=b.carrier.x;ty=b.carrier.y+(i-1.5)*18;}else if(b.owner===null&&i<3){tx=b.x;ty=b.y;}else{tx=610+(i%4)*105;ty=75+(i%5)*112;}const dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy)||1,s=(has||b.owner==='mate')&&i<4?1.78:1.08;f.x+=dx/d*s;f.y+=dy/d*s;if(has&&performance.now()>evadeUntil&&f.tackleCd<=0&&Math.hypot(f.x-p.x,f.y-p.y)<25){f.tackleCd=78;const win=.43+Math.max(0,(68-(S.attributes.dribbling||60)))/150+(keys.shift?0.06:0);if(Math.random()<win){b.owner='foe';b.carrier=f;velocityX*=.35;velocityY*=.35;match.rating=Math.max(3,match.rating-.12);flash('Tackled.');}else{match.dribbles++;match.rating=Math.min(10,match.rating+.05);}}if(b.owner==='mate'&&b.carrier&&Math.hypot(f.x-b.carrier.x,f.y-b.carrier.y)<22&&Math.random()<.018){b.owner='foe';b.carrier=f;flash('Teammate loses it.');}});
      if(b.owner==='foe'&&b.carrier){const f=b.carrier;f.x=Math.max(90,f.x-1.25);if(Math.random()<.006){b.owner=null;b.carrier=null;b.vx=-2.6;b.vy=(Math.random()-.5)*1.6;}}
    }

    $('#clock').textContent=`${String(Math.min(90,Math.floor(match.time/60))).padStart(2,'0')}:${String(Math.floor(match.time%60)).padStart(2,'0')}`;$('#homeScore').textContent=match.home;$('#awayScore').textContent=match.away;$('#matchRating').textContent=match.rating.toFixed(1);
  };

  const baseDrawPitch=drawPitch;drawPitch=function(){baseDrawPitch();};
  publishInput();
})();
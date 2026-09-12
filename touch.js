(() => {
  const joystick=document.getElementById('joystick'),stick=document.getElementById('stick');
  const sprint=document.getElementById('touchSprint'),pass=document.getElementById('touchPass'),shoot=document.getElementById('touchShoot'),tackle=document.getElementById('touchTackle');
  const actions=document.querySelector('.action-buttons');
  if(!joystick||!stick)return;

  let skill=document.getElementById('touchSkill');
  if(!skill){skill=document.createElement('button');skill.id='touchSkill';skill.className='action skill';skill.textContent='SKILL';Object.assign(skill.style,{right:'142px',top:'88px',width:'64px',height:'64px',background:'rgba(180,106,255,.92)',color:'#fff'});actions?.appendChild(skill);}

  const bridge=()=>window.Career3DBridge||{};
  if(!bridge().shotAim)bridge().shotAim={active:false,offset:0,power:.72};

  let activePointer=null,joyX=0,joyY=0,joyMag=0,velocityX=0,velocityY=0,lastMoveX=1,lastMoveY=0;
  let lastShot=0,skillCooldown=0,evadeUntil=0,tackleCooldown=0;
  const max=46,deadzone=.12,GOAL_TOP=248,GOAL_BOTTOM=372,RIGHT_LINE=1082;

  function setDir(x,y){
    const mag=Math.hypot(x,y),nx=mag?x/mag:0,ny=mag?y/mag:0,raw=Math.min(1,mag/max);
    joyMag=raw<deadzone?0:(raw-deadzone)/(1-deadzone);joyX=joyMag?nx:0;joyY=joyMag?ny:0;
    const dist=Math.min(max,mag);stick.style.transform=`translate(${nx*dist}px,${ny*dist}px)`;
  }
  function clearDir(){joyX=joyY=joyMag=0;stick.style.transform='translate(0,0)';keys.a=keys.d=keys.w=keys.s=false;}
  function moveFromEvent(e){const r=joystick.getBoundingClientRect();setDir(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);}
  joystick.addEventListener('pointerdown',e=>{activePointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveFromEvent(e);e.preventDefault();});
  joystick.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;moveFromEvent(e);e.preventDefault();});
  const endStick=e=>{if(activePointer!==null&&e.pointerId!==activePointer)return;activePointer=null;clearDir();e.preventDefault();};
  joystick.addEventListener('pointerup',endStick);joystick.addEventListener('pointercancel',endStick);

  function holdButton(el,keyName){if(!el)return;el.addEventListener('pointerdown',e=>{keys[keyName]=true;el.classList.add('active');el.setPointerCapture?.(e.pointerId);e.preventDefault();});const release=e=>{keys[keyName]=false;el.classList.remove('active');e.preventDefault();};el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);}
  function tapButton(el,keyName,ms=90){if(!el)return;el.addEventListener('pointerdown',e=>{keys[keyName]=true;el.classList.add('active');e.preventDefault();setTimeout(()=>{keys[keyName]=false;el.classList.remove('active');},ms);});}
  holdButton(sprint,'shift');tapButton(pass,' ',80);tapButton(tackle,'k',95);tapButton(skill,'x',105);

  // FC-style shooting: hold SHOOT, drag left/right to place the shot, drag up for more power, release to strike.
  let shotPointer=null,shotStartX=0,shotStartY=0;
  shoot?.addEventListener('pointerdown',e=>{
    shotPointer=e.pointerId;shotStartX=e.clientX;shotStartY=e.clientY;shoot.setPointerCapture?.(e.pointerId);shoot.classList.add('active');
    const a=bridge().shotAim||(bridge().shotAim={});a.active=true;a.offset=0;a.power=.68;e.preventDefault();
  });
  shoot?.addEventListener('pointermove',e=>{
    if(e.pointerId!==shotPointer)return;const a=bridge().shotAim; if(!a)return;
    a.offset=Math.max(-1,Math.min(1,(e.clientX-shotStartX)/82));
    a.power=Math.max(.52,Math.min(1,.68+(shotStartY-e.clientY)/120));e.preventDefault();
  });
  function releaseShot(e){if(shotPointer===null||(e.pointerId!==undefined&&e.pointerId!==shotPointer))return;const a=bridge().shotAim||{offset:0,power:.7};shoot.classList.remove('active');shotPointer=null;a.active=false;shootBall(a.offset||0,a.power||.7);e.preventDefault();}
  shoot?.addEventListener('pointerup',releaseShot);shoot?.addEventListener('pointercancel',e=>{if(bridge().shotAim)bridge().shotAim.active=false;shotPointer=null;shoot.classList.remove('active');e.preventDefault();});

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
  function scoreGoal(){match.home++;match.playerGoals=(match.playerGoals||0)+1;match.rating=Math.min(10,match.rating+1.35);flash('GOAL!');setTimeout(()=>{if(match?.running)kickOffReset();},450);}

  function shootBall(offset=0,power=.7){
    if(!match||match.ball.owner!=='player')return;const now=performance.now();if(now-lastShot<260)return;lastShot=now;
    const p=match.player,b=match.ball,shooting=S.attributes.shooting||60;
    const targetBase=310+offset*((GOAL_BOTTOM-GOAL_TOP)*.43);
    const error=(Math.random()-.5)*Math.max(3,16-(shooting-50)*.18)*(1-power*.35);
    const targetY=Math.max(GOAL_TOP+7,Math.min(GOAL_BOTTOM-7,targetBase+error));
    const dx=RIGHT_LINE-p.x,dy=targetY-p.y,dist=Math.hypot(dx,dy)||1;
    const shotPower=6.8+power*3.1+Math.max(0,shooting-60)*.018;
    b.owner=null;b.carrier=null;b.x=p.x+18;b.y=p.y;b.vx=dx/dist*shotPower;b.vy=dy/dist*shotPower;
    match.shotInFlight=true;match.shotTargetY=targetY;match.shotPower=power;flash(offset<-.45?'Aiming near post...':offset>.45?'Aiming far post...':'Shot on target...');
  }
  function passBall(){if(!match||match.ball.owner!=='player')return;const candidates=match.mates.filter(Boolean);let nearest=candidates.sort((a,b)=>Math.hypot(a.x-match.player.x,a.y-match.player.y)-Math.hypot(b.x-match.player.x,b.y-match.player.y))[0];const tx=nearest?.x||match.player.x+120,ty=nearest?.y||match.player.y,dx=tx-match.player.x,dy=ty-match.player.y,d=Math.hypot(dx,dy)||1;ballFree(match.player.x+14,match.player.y,dx/d*5.0,dy/d*5.0);match.chances++;match.rating=Math.min(10,match.rating+.08);flash('Pass played.');}
  function useSkill(){if(!match?.running||match.ball.owner!=='player'||skillCooldown>0)return;skillCooldown=34;const p=match.player,near=match.foes.reduce((best,f)=>{const d=Math.hypot(f.x-p.x,f.y-p.y);return d<(best?.d??999)?{f,d}:best},null),names=['Step-over','Body feint','Roulette'],name=names[Math.floor(Math.random()*names.length)];let dx=lastMoveX||1,dy=lastMoveY||0;if(name==='Roulette'){const ox=dx;dx=-dy;dy=ox;}if(name==='Body feint'){dy+=(Math.random()<.5?-.5:.5);const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;}p.x=Math.max(35,Math.min(1065,p.x+dx*20));p.y=Math.max(35,Math.min(585,p.y+dy*20));velocityX=dx*1.65;velocityY=dy*1.65;evadeUntil=performance.now()+620;if(near&&near.d<70){match.dribbles++;match.rating=Math.min(10,match.rating+.14);flash(`${name}! Defender beaten.`);}else flash(name);}
  function playerTackle(){if(!match?.running||tackleCooldown>0)return;tackleCooldown=30;const p=match.player,near=match.foes.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<34);if(near&&match.ball.owner==='foe'){match.ball.owner='player';match.ball.carrier=null;match.rating=Math.min(10,match.rating+.1);flash('Ball won!');}}

  update=function(){
    if(!match)return;const p=match.player,b=match.ball;
    let inputX=0,inputY=0,inputMag=0;const mobile=cameraRelativeInput();
    if(mobile){inputX=mobile.x;inputY=mobile.y;inputMag=mobile.mag;}
    else{inputX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);inputY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);inputMag=Math.min(1,Math.hypot(inputX,inputY));const m=Math.hypot(inputX,inputY)||1;inputX/=m;inputY/=m;}
    if(inputMag>.02){lastMoveX=inputX;lastMoveY=inputY;}

    const pace=S.attributes.pace||65,paceBoost=Math.max(0,(pace-60)/180),baseSpeed=1.62+paceBoost,sprintSpeed=2.30+paceBoost*.62,targetSpeed=(keys.shift?sprintSpeed:baseSpeed)*inputMag;
    const targetVX=inputX*targetSpeed,targetVY=inputY*targetSpeed,accel=inputMag>0?(keys.shift?.15:.21):.30;
    velocityX+=(targetVX-velocityX)*accel;velocityY+=(targetVY-velocityY)*accel;if(inputMag===0){velocityX*=.79;velocityY*=.79;}
    p.x=Math.max(28,Math.min(1072,p.x+velocityX));p.y=Math.max(28,Math.min(592,p.y+velocityY));
    match.time+=.038*60;if(skillCooldown>0)skillCooldown--;if(tackleCooldown>0)tackleCooldown--;

    if(keys.j){keys.j=false;shootBall(0,.72);}if(keys[' ']){keys[' ']=false;passBall();}if(keys.k){keys.k=false;playerTackle();}if(keys.x){keys.x=false;useSkill();}

    if(b.owner===null&&Math.hypot(p.x-b.x,p.y-b.y)<23&&Math.hypot(b.vx||0,b.vy||0)<4.8){b.owner='player';b.vx=b.vy=0;}
    if(b.owner==='player'){b.x=p.x+16*(lastMoveX||1);b.y=p.y+8*(lastMoveY||0);}else if(b.owner==='foe'&&b.carrier){b.x=b.carrier.x-13;b.y=b.carrier.y;}else{b.x+=(b.vx||0);b.y+=(b.vy||0);b.vx=(b.vx||0)*.985;b.vy=(b.vy||0)*.985;if(!match.shotInFlight){if(b.y<25||b.y>595)b.vy*=-.75;if(b.x<25||b.x>1075)b.vx*=-.75;}}

    match.keeper=match.keeper||{x:1046,y:310};match.keeper.y+=(Math.max(GOAL_TOP+14,Math.min(GOAL_BOTTOM-14,b.y))-match.keeper.y)*.075;
    if(match.shotInFlight&&b.vx>0&&Math.hypot(b.x-match.keeper.x,b.y-match.keeper.y)<24){const placement=Math.min(1,Math.abs((match.shotTargetY||310)-310)/58),power=match.shotPower||.7,saveChance=Math.max(.12,.60-placement*.32-power*.13+Math.max(0,70-(S.attributes.shooting||60))/180);if(Math.random()<saveChance){match.shotInFlight=false;b.vx=-3.1;b.vy+=(Math.random()-.5)*2.2;flash('Saved!');}}
    if(match.shotInFlight&&b.x>=RIGHT_LINE){match.shotInFlight=false;if(b.y>GOAL_TOP&&b.y<GOAL_BOTTOM)scoreGoal();else{flash('Wide.');ballFree(1010,Math.max(45,Math.min(575,b.y)),-2,0);}}

    match.foes.forEach((f,i)=>{f.tackleCd=Math.max(0,(f.tackleCd||0)-1);const has=b.owner==='player';let tx,ty;if(has&&i<4){tx=p.x+(i%2?22:-20);ty=p.y+(i-1.5)*24;}else if(b.owner===null&&i<3){tx=b.x;ty=b.y;}else{tx=610+(i%4)*105;ty=75+(i%5)*112;}const dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy)||1,s=has&&i<4?1.78:1.08;f.x+=dx/d*s;f.y+=dy/d*s;if(has&&performance.now()>evadeUntil&&f.tackleCd<=0&&Math.hypot(f.x-p.x,f.y-p.y)<25){f.tackleCd=78;const win=.43+Math.max(0,(68-(S.attributes.dribbling||60)))/150+(keys.shift?.06:0);if(Math.random()<win){b.owner='foe';b.carrier=f;velocityX*=.35;velocityY*=.35;match.rating=Math.max(3,match.rating-.12);flash('Tackled.');}else{match.dribbles++;match.rating=Math.min(10,match.rating+.05);}}});
    if(b.owner==='foe'&&b.carrier){const f=b.carrier;f.x=Math.max(90,f.x-1.25);if(Math.random()<.006){b.owner=null;b.carrier=null;b.vx=-2.6;b.vy=(Math.random()-.5)*1.6;}}
    match.mates.forEach((a,i)=>{a.x+=(Math.min(980,p.x+80+(i%3)*70)-a.x)*.0018;a.y+=(75+(i%5)*110-a.y)*.0024;});
    $('#clock').textContent=`${String(Math.min(90,Math.floor(match.time/60))).padStart(2,'0')}:${String(Math.floor(match.time%60)).padStart(2,'0')}`;$('#homeScore').textContent=match.home;$('#awayScore').textContent=match.away;$('#matchRating').textContent=match.rating.toFixed(1);
  };

  // Legacy canvas stays hidden under the 3D renderer, but these wrappers preserve the old engine safely.
  const baseDrawPitch=drawPitch;drawPitch=function(){baseDrawPitch();};
})();
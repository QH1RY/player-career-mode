(() => {
  const bridge=()=>window.Career3DBridge||{};
  const getMatch=()=>bridge().getMatch?.()||null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>t*t*(3-2*t);

  function persist(){try{save?.();}catch(_){try{localStorage.setItem('rtgCareer',JSON.stringify(S));}catch(__){}}}

  function ensureAdvancedAttributes(){
    if(typeof S==='undefined'||!S)return;
    if(!S.advancedAttributes)S.advancedAttributes={};
    const A=S.advancedAttributes;
    const shooting=S.attributes?.shooting||60,dribbling=S.attributes?.dribbling||60,passing=S.attributes?.passing||60,pace=S.attributes?.pace||60;
    if(typeof A.finishing!=='number')A.finishing=shooting;
    if(typeof A.shotPower!=='number')A.shotPower=Math.round(shooting*.65+(S.attributes?.physical||55)*.35);
    if(typeof A.curve!=='number')A.curve=Math.round((shooting+passing)/2);
    if(typeof A.freeKickAccuracy!=='number')A.freeKickAccuracy=S.freeKickSkill||55;
    if(typeof A.ballControl!=='number')A.ballControl=dribbling;
    if(typeof A.agility!=='number')A.agility=Math.round((pace+dribbling)/2);
    if(!Array.isArray(S.playStyles))S.playStyles=[];
    const unlock=(name,test)=>{if(test&&!S.playStyles.includes(name))S.playStyles.push(name)};
    unlock('Technical',A.ballControl>=72);
    unlock('Finesse Shot',A.finishing>=74&&A.curve>=70);
    unlock('Dead Ball',A.freeKickAccuracy>=72&&A.curve>=70);
    unlock('Quick Step',A.agility>=75);
  }

  function addAdvancedAttributeUI(){
    ensureAdvancedAttributes();
    const tab=document.getElementById('careerTab');
    if(!tab||document.getElementById('advancedAttributesPanel'))return;
    const panel=document.createElement('div');panel.id='advancedAttributesPanel';panel.className='panel';panel.style.marginTop='14px';
    panel.innerHTML=`<div class="eyebrow">TECHNICAL ATTRIBUTES</div><h3>Player Attributes & PlayStyles</h3><div id="advancedAttributeGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin-top:12px"></div><div class="eyebrow" style="margin-top:18px">PLAYSTYLES</div><div id="playStyleBadges" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div>`;
    tab.appendChild(panel);renderAdvancedAttributes();
  }
  function renderAdvancedAttributes(){
    ensureAdvancedAttributes();const A=S.advancedAttributes||{};
    const grid=document.getElementById('advancedAttributeGrid');
    if(grid)grid.innerHTML=Object.entries(A).map(([k,v])=>`<div style="padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.035)"><span style="display:block;font-size:11px;opacity:.68;text-transform:uppercase">${k.replace(/([A-Z])/g,' $1')}</span><b style="font-size:24px">${v}</b></div>`).join('');
    const badges=document.getElementById('playStyleBadges');if(badges)badges.innerHTML=(S.playStyles||[]).length?S.playStyles.map(x=>`<span style="padding:8px 11px;border-radius:999px;background:rgba(223,255,77,.12);border:1px solid rgba(223,255,77,.38);color:#eaff76;font-weight:800;font-size:12px">✦ ${x}</span>`).join(''):'<span style="opacity:.65">Improve technical attributes to unlock PlayStyles.</span>';
  }

  // -------- Visible skill actions: no teleporting --------
  let skillIndex=0,skillBusy=false;
  const skillTypes=['stepover','bodyFeint','roulette'];
  function performSkill(type){
    const m=getMatch();if(!m?.running||m.ball?.owner!=='player'||skillBusy)return;
    skillBusy=true;
    const p=m.player,start={x:p.x,y:p.y},ball=m.ball;
    let fx=(ball.x-p.x),fy=(ball.y-p.y);let fm=Math.hypot(fx,fy);if(fm<2){fx=1;fy=0;fm=1;}fx/=fm;fy/=fm;
    const rx=-fy,ry=fx;
    const duration=type==='roulette'?760:620,startTime=performance.now();
    bridge().skillAction={type,start:startTime,duration,active:true};
    const label=type==='stepover'?'Step-over':type==='bodyFeint'?'Body feint':'Roulette';
    try{flash?.(`${label}...`);}catch(_){ }
    function frame(now){
      const t=clamp((now-startTime)/duration,0,1),e=ease(t);
      let forward=18*e,lateral=0;
      if(type==='stepover')lateral=Math.sin(t*Math.PI*2)*4.8*(1-t*.3);
      if(type==='bodyFeint')lateral=Math.sin(t*Math.PI)*11*(1-t*.25)-Math.sin(t*Math.PI*2)*2;
      if(type==='roulette')lateral=Math.sin(t*Math.PI*2)*7.2,forward=15*e+Math.sin(t*Math.PI)*3;
      p.x=clamp(start.x+fx*forward+rx*lateral,30,1070);
      p.y=clamp(start.y+fy*forward+ry*lateral,30,590);
      if(ball.owner==='player'){ball.x=p.x+fx*15;ball.y=p.y+fy*8;}
      if(t<1){requestAnimationFrame(frame);}else{
        skillBusy=false;bridge().skillAction={type,active:false,end:now};
        const defender=m.foes?.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<72);
        if(defender){m.dribbles=(m.dribbles||0)+1;m.rating=Math.min(10,(m.rating||6)+.12);try{flash?.(`${label} completed.`);}catch(_){}}
      }
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener('pointerdown',e=>{
    if(e.target?.id!=='touchSkill')return;
    e.preventDefault();e.stopImmediatePropagation();
    performSkill(skillTypes[skillIndex++%skillTypes.length]);
  },true);
  addEventListener('keydown',e=>{if(e.key?.toLowerCase()==='x'){e.preventDefault();e.stopImmediatePropagation();performSkill(skillTypes[skillIndex++%skillTypes.length]);}},true);

  // -------- Playable training ground --------
  let drill=null,drillRAF=0;
  function addPlayableTraining(){
    const tab=document.getElementById('trainingTab');if(!tab||document.getElementById('playableDrillsPanel'))return;
    const panel=document.createElement('div');panel.id='playableDrillsPanel';panel.className='panel';panel.style.marginTop='14px';
    panel.innerHTML=`<div class="eyebrow">ON-PITCH TRAINING</div><h3>Play the drills with your character</h3><p>These drills use the same joystick, shooting, passing and skill controls as matches. Your score affects development.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"><button data-play-drill="finishing">🎯 Play Finishing Drill<br><small>Score as many as possible</small></button><button data-play-drill="dribbling">⚡ Play Skill Course<br><small>Beat defenders with skills</small></button><button data-play-drill="passing">🔺 Play Passing Drill<br><small>Create accurate passes</small></button><button data-play-drill="freeKick">🥅 Play Free-Kick Drill<br><small>Aim, power & curve</small></button></div><div id="playableDrillMsg" class="message" style="margin-top:10px">Pick a drill to enter the training pitch.</div>`;
    tab.appendChild(panel);panel.querySelectorAll('[data-play-drill]').forEach(b=>b.onclick=()=>startPlayableDrill(b.dataset.playDrill));
  }

  function showMatchTab(){document.querySelector('[data-tab="matchTab"]')?.click();}
  function makeTrainingHUD(type){
    document.getElementById('trainingHUD')?.remove();
    const wrap=document.querySelector('.pitch-wrap');if(!wrap)return null;
    const hud=document.createElement('div');hud.id='trainingHUD';Object.assign(hud.style,{position:'absolute',top:'14px',left:'50%',transform:'translateX(-50%)',zIndex:'20',background:'rgba(4,12,8,.88)',border:'1px solid rgba(223,255,77,.35)',borderRadius:'14px',padding:'10px 14px',color:'#fff',font:'700 12px system-ui',minWidth:'250px',textAlign:'center'});
    hud.innerHTML=`<div style="color:#dfff4d;letter-spacing:.12em;font-size:10px">TRAINING</div><div id="trainingHUDTitle" style="font-size:16px;margin:3px 0">${type}</div><div><span id="trainingTime">30</span>s · Score <b id="trainingScore">0</b></div><div id="trainingInstruction" style="font-weight:500;opacity:.8;margin-top:4px"></div><button id="endTrainingBtn" style="margin-top:7px;padding:5px 10px">End Drill</button>`;
    wrap.appendChild(hud);hud.querySelector('#endTrainingBtn').onclick=()=>finishDrill(false);return hud;
  }

  function startPlayableDrill(type){
    if(typeof S==='undefined'||!S)return;
    if((S.training||0)<=0){const x=document.getElementById('playableDrillMsg');if(x)x.textContent='No training sessions left. Sim forward to recover sessions.';return;}
    showMatchTab();
    if(typeof startMatch==='function')startMatch();
    setTimeout(()=>{
      const m=getMatch();if(!m)return;
      m.training=true;m.trainingType=type;m.time=0;m.home=0;m.away=0;m.rating=6;m.playerGoals=0;m.chances=0;m.dribbles=0;
      bridge().trainingMode={type,active:true};
      const instructions={finishing:'Use movement + your shot controls. Goals are worth 3 points.',dribbling:'Use SKILL near defenders. Completed skill moves score points.',passing:'Move into space and PASS. Each completed attacking pass scores.',freeKick:'Take repeated free kicks using target, power and curve.'};
      makeTrainingHUD(type);document.getElementById('trainingInstruction').textContent=instructions[type];
      drill={type,start:performance.now(),duration:30000,score:0,lastGoals:0,lastDribbles:0,lastChances:0,lastFK:0};
      if(type==='finishing'){m.player.x=760;m.player.y=310;m.ball.x=778;m.ball.y=310;m.ball.owner='player';m.foes?.forEach((f,i)=>{f.x=840+(i%2)*60;f.y=180+(i%5)*65;});}
      if(type==='dribbling'){m.player.x=300;m.player.y=310;m.ball.x=316;m.ball.y=310;m.ball.owner='player';m.foes?.forEach((f,i)=>{f.x=440+i*48;f.y=220+(i%2)*180;});}
      if(type==='passing'){m.player.x=350;m.player.y=310;m.ball.x=366;m.ball.y=310;m.ball.owner='player';m.foes?.forEach((f,i)=>{f.x=600+(i%3)*80;f.y=160+(i%5)*75;});}
      if(type==='freeKick')startFreeKickTrainingRound();
      trainingTick();
    },80);
  }

  function trainingTick(){
    cancelAnimationFrame(drillRAF);if(!drill)return;
    const m=getMatch();if(!m)return finishDrill(false);
    const elapsed=performance.now()-drill.start,remain=Math.max(0,Math.ceil((drill.duration-elapsed)/1000));
    const goals=m.home||0,dribbles=m.dribbles||0,chances=m.chances||0;
    if(drill.type==='finishing'&&goals>drill.lastGoals){drill.score+=(goals-drill.lastGoals)*3;drill.lastGoals=goals;m.ball.owner='player';m.player.x=760;m.player.y=310;}
    if(drill.type==='dribbling'&&dribbles>drill.lastDribbles){drill.score+=(dribbles-drill.lastDribbles)*2;drill.lastDribbles=dribbles;}
    if(drill.type==='passing'&&chances>drill.lastChances){drill.score+=(chances-drill.lastChances);drill.lastChances=chances;}
    const t=document.getElementById('trainingTime'),s=document.getElementById('trainingScore');if(t)t.textContent=remain;if(s)s.textContent=drill.score;
    if(elapsed>=drill.duration)return finishDrill(true);
    drillRAF=requestAnimationFrame(trainingTick);
  }

  function finishDrill(completed=true){
    if(!drill)return;const m=getMatch();if(m)m.running=false;
    const type=drill.type,score=drill.score;cancelAnimationFrame(drillRAF);drill=null;bridge().trainingMode=null;document.getElementById('trainingHUD')?.remove();
    S.training=Math.max(0,(S.training||0)-1);ensureAdvancedAttributes();
    const points=score>=12?3:score>=6?2:1;S.skillPoints=(S.skillPoints||0)+points;
    if(completed){
      if(type==='finishing'){S.advancedAttributes.finishing=Math.min(99,S.advancedAttributes.finishing+(score>=9?2:1));S.attributes.shooting=Math.min(99,S.attributes.shooting+(score>=12?1:0));}
      if(type==='dribbling'){S.advancedAttributes.ballControl=Math.min(99,S.advancedAttributes.ballControl+(score>=8?2:1));S.advancedAttributes.agility=Math.min(99,S.advancedAttributes.agility+1);}
      if(type==='passing')S.attributes.passing=Math.min(99,S.attributes.passing+(score>=8?1:0));
      if(type==='freeKick'){S.advancedAttributes.freeKickAccuracy=Math.min(99,S.advancedAttributes.freeKickAccuracy+(score>=6?2:1));S.freeKickSkill=Math.max(S.freeKickSkill||55,S.advancedAttributes.freeKickAccuracy);}
    }
    ensureAdvancedAttributes();persist();renderAdvancedAttributes();
    try{flash?.(`Training complete: ${score} points. +${points} development point${points===1?'':'s'}.`);}catch(_){ }
  }

  // -------- FIFA-style free-kick interface --------
  let fkState=null;
  function buildFreeKickUI(){
    if(document.getElementById('freeKickControl'))return document.getElementById('freeKickControl');
    const wrap=document.querySelector('.pitch-wrap');if(!wrap)return null;
    const ui=document.createElement('div');ui.id='freeKickControl';Object.assign(ui.style,{position:'absolute',inset:'0',zIndex:'30',display:'none',alignItems:'center',justifyContent:'center',background:'rgba(1,6,4,.32)',pointerEvents:'auto'});
    ui.innerHTML=`<div style="position:absolute;right:14px;top:14px;width:min(330px,44%);background:rgba(4,12,8,.94);color:white;border:1px solid rgba(223,255,77,.4);border-radius:18px;padding:14px;font-family:system-ui"><div style="font-size:10px;letter-spacing:.14em;color:#dfff4d;font-weight:900">FREE KICK</div><b style="font-size:18px">Aim the strike</b><p style="font-size:11px;opacity:.72;margin:5px 0 10px">Drag the target inside the goal. Set power and curve, then shoot.</p><div id="fkGoalBox" style="height:112px;border:3px solid #fff;border-bottom-width:5px;position:relative;background:linear-gradient(rgba(255,255,255,.04),rgba(255,255,255,.01));touch-action:none"><div id="fkTarget" style="width:24px;height:24px;border:2px solid #dfff4d;border-radius:50%;position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);box-shadow:0 0 12px #dfff4d"></div><div style="position:absolute;left:50%;bottom:0;width:42%;height:44%;transform:translateX(-50%);background:repeating-linear-gradient(90deg,rgba(255,80,80,.65) 0 9px,rgba(140,30,30,.65) 9px 18px);opacity:.65"></div></div><label style="display:block;font-size:11px;margin-top:10px">POWER <b id="fkPowerText">68</b>%<input id="fkPower" type="range" min="35" max="100" value="68" style="width:100%"></label><label style="display:block;font-size:11px;margin-top:8px">CURVE <b id="fkCurveText">0</b><input id="fkCurve" type="range" min="-100" max="100" value="0" style="width:100%"></label><div style="display:flex;gap:7px;margin-top:10px"><button id="fkShoot" class="primary" style="flex:1">SHOOT</button><button id="fkCancel">Cancel</button></div></div>`;
    wrap.appendChild(ui);
    const box=ui.querySelector('#fkGoalBox'),target=ui.querySelector('#fkTarget'),power=ui.querySelector('#fkPower'),curve=ui.querySelector('#fkCurve');
    function aim(e){const r=box.getBoundingClientRect();fkState.aimX=clamp((e.clientX-r.left)/r.width,0,1);fkState.aimY=clamp((e.clientY-r.top)/r.height,0,1);target.style.left=(fkState.aimX*100)+'%';target.style.top=(fkState.aimY*100)+'%';}
    box.addEventListener('pointerdown',e=>{box.setPointerCapture?.(e.pointerId);aim(e);e.preventDefault();});box.addEventListener('pointermove',e=>{if(e.buttons||e.pressure)aim(e);});
    power.oninput=()=>{fkState.power=+power.value/100;ui.querySelector('#fkPowerText').textContent=power.value;};curve.oninput=()=>{fkState.curve=+curve.value/100;ui.querySelector('#fkCurveText').textContent=curve.value;};
    ui.querySelector('#fkShoot').onclick=shootInteractiveFreeKick;ui.querySelector('#fkCancel').onclick=closeFreeKick;
    return ui;
  }

  function openFreeKick(training=false){
    const m=getMatch();if(!m)return;
    ensureAdvancedAttributes();fkState={training,aimX:.5,aimY:.38,power:.68,curve:0};bridge().shotAim={active:true,offset:0,power:.68,curve:0};
    const ui=buildFreeKickUI();ui.style.display='flex';
    const p=m.player;m.ball.owner=null;m.ball.carrier=null;m.ball.x=p.x+13;m.ball.y=p.y;m.ball.vx=m.ball.vy=0;
    // Build a visible wall from opposition players.
    const wallX=Math.min(965,p.x+115);(m.foes||[]).slice(0,5).forEach((f,i)=>{f.x=wallX;f.y=250+i*30;});
  }
  function closeFreeKick(){const ui=document.getElementById('freeKickControl');if(ui)ui.style.display='none';if(bridge().shotAim)bridge().shotAim.active=false;fkState=null;}

  function shootInteractiveFreeKick(){
    const m=getMatch();if(!m||!fkState)return;
    const ui=document.getElementById('freeKickControl');if(ui)ui.style.display='none';if(bridge().shotAim)bridge().shotAim.active=false;
    const state={...fkState};fkState=null;const b=m.ball,p=m.player,start={x:b.x,y:b.y};
    const targetY=248+state.aimX*(372-248); // left/right placement in the goal mouth
    const targetX=1084,curvePx=state.curve*75;
    const duration=1050-state.power*360,startT=performance.now();m.setPieceTaking=true;
    function flight(now){
      const t=clamp((now-startT)/duration,0,1),e=ease(t);
      b.x=start.x+(targetX-start.x)*e;
      const straight=start.y+(targetY-start.y)*e;
      b.y=straight+Math.sin(Math.PI*t)*curvePx*(1-t*.18);
      if(t<1)return requestAnimationFrame(flight);
      m.setPieceTaking=false;
      ensureAdvancedAttributes();const A=S.advancedAttributes;
      const placement=Math.abs(state.aimX-.5)*2,top=Math.max(0,.55-state.aimY)/.55;
      const technique=((A.freeKickAccuracy||55)+(A.curve||55)+(A.shotPower||55))/300;
      const wallPenalty=Math.max(0,.32-Math.abs(state.curve)*.20-state.power*.10);
      const accuracy=clamp(.36+technique*.42+placement*.08+top*.05-wallPenalty,0.18,.88);
      const onTarget=Math.random()<accuracy;
      const keeperSave=onTarget&&Math.random()<clamp(.44-placement*.20-state.power*.14-Math.abs(state.curve)*.08,0.12,.48);
      if(onTarget&&!keeperSave){m.home++;m.playerGoals=(m.playerGoals||0)+1;m.rating=Math.min(10,(m.rating||6)+1.0);try{flash?.('FREE KICK GOAL!');}catch(_){ }if(state.training&&drill)drill.score+=3;}
      else{try{flash?.(onTarget?'Free kick saved.':'Free kick off target.');}catch(_){ }if(state.training&&drill&&onTarget)drill.score+=1;}
      if(state.training){setTimeout(startFreeKickTrainingRound,650);}else{m.setPiece=null;document.getElementById('takeSetPieceBtn')?.style&& (document.getElementById('takeSetPieceBtn').style.display='none');b.x=550;b.y=310;b.vx=b.vy=0;}
    }
    requestAnimationFrame(flight);
  }

  function startFreeKickTrainingRound(){
    if(!drill||drill.type!=='freeKick')return;
    const m=getMatch();if(!m)return;
    m.player.x=735+Math.random()*75;m.player.y=245+Math.random()*130;m.ball.x=m.player.x+13;m.ball.y=m.player.y;m.setPiece={type:'freeKick',x:m.player.x,y:m.player.y};openFreeKick(true);
  }

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#takeSetPieceBtn');if(!btn)return;
    const m=getMatch();if(m?.setPiece?.type!=='freeKick')return;
    e.preventDefault();e.stopImmediatePropagation();openFreeKick(false);
  },true);

  // Make the existing simulated training buttons secondary so the playable version is obvious.
  function relabelOldTraining(){document.querySelectorAll('[data-drill],[data-setpiece-drill]').forEach(b=>{if(!b.dataset.oldLabel){b.dataset.oldLabel='1';b.title='Quick simulation. Use On-Pitch Training below to play the drill yourself.';}});}

  ensureAdvancedAttributes();addAdvancedAttributeUI();addPlayableTraining();relabelOldTraining();
  setTimeout(()=>{ensureAdvancedAttributes();addAdvancedAttributeUI();addPlayableTraining();renderAdvancedAttributes();relabelOldTraining();},500);
})();
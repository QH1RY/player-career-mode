(() => {
  const bridge=()=>window.Career3DBridge||{};
  const getMatch=()=>bridge().getMatch?.()||null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>t*t*(3-2*t);
  bridge().skillSystemReady=true;
  bridge().gameplayBuild=39;

  function persist(){try{save?.();}catch(_){try{localStorage.setItem('rtgCareer',JSON.stringify(S));}catch(__){}}}

  function ensureAdvancedAttributes(){
    if(typeof S==='undefined'||!S)return;
    if(!S.advancedAttributes)S.advancedAttributes={};
    const A=S.advancedAttributes,shooting=S.attributes?.shooting||60,dribbling=S.attributes?.dribbling||60,passing=S.attributes?.passing||60,pace=S.attributes?.pace||60;
    if(typeof A.finishing!=='number')A.finishing=shooting;
    if(typeof A.shotPower!=='number')A.shotPower=Math.round(shooting*.65+(S.attributes?.physical||55)*.35);
    if(typeof A.curve!=='number')A.curve=Math.round((shooting+passing)/2);
    if(typeof A.freeKickAccuracy!=='number')A.freeKickAccuracy=S.freeKickSkill||55;
    if(typeof A.ballControl!=='number')A.ballControl=dribbling;
    if(typeof A.agility!=='number')A.agility=Math.round((pace+dribbling)/2);
    if(!Array.isArray(S.playStyles))S.playStyles=[];
    const unlock=(name,test)=>{if(test&&!S.playStyles.includes(name))S.playStyles.push(name)};
    unlock('Technical',A.ballControl>=72);unlock('Finesse Shot',A.finishing>=74&&A.curve>=70);unlock('Dead Ball',A.freeKickAccuracy>=72&&A.curve>=70);unlock('Quick Step',A.agility>=75);
  }

  function addAdvancedAttributeUI(){
    ensureAdvancedAttributes();const tab=document.getElementById('careerTab');
    if(!tab||document.getElementById('advancedAttributesPanel'))return;
    const panel=document.createElement('div');panel.id='advancedAttributesPanel';panel.className='panel';panel.style.marginTop='14px';
    panel.innerHTML='<div class="eyebrow">TECHNICAL ATTRIBUTES</div><h3>Player Attributes & PlayStyles</h3><div id="advancedAttributeGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin-top:12px"></div><div class="eyebrow" style="margin-top:18px">PLAYSTYLES</div><div id="playStyleBadges" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div>';
    tab.appendChild(panel);renderAdvancedAttributes();
  }
  function renderAdvancedAttributes(){
    ensureAdvancedAttributes();const A=S.advancedAttributes||{},grid=document.getElementById('advancedAttributeGrid');
    if(grid)grid.innerHTML=Object.entries(A).map(([k,v])=>`<div style="padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.035)"><span style="display:block;font-size:11px;opacity:.68;text-transform:uppercase">${k.replace(/([A-Z])/g,' $1')}</span><b style="font-size:24px">${v}</b></div>`).join('');
    const badges=document.getElementById('playStyleBadges');if(badges)badges.innerHTML=(S.playStyles||[]).length?S.playStyles.map(x=>`<span style="padding:8px 11px;border-radius:999px;background:rgba(223,255,77,.12);border:1px solid rgba(223,255,77,.38);color:#eaff76;font-weight:800;font-size:12px">✦ ${x}</span>`).join(''):'<span style="opacity:.65">Improve technical attributes to unlock PlayStyles.</span>';
  }

  let skillIndex=0,skillBusy=false;
  const skillTypes=['stepover','bodyFeint','roulette'];
  function performSkill(type){
    const m=getMatch();if(!m?.running||m.ball?.owner!=='player'||skillBusy||m.setPieceTaking)return;
    skillBusy=true;bridge().inputLocked=true;
    const p=m.player,start={x:p.x,y:p.y},ball=m.ball,lm=bridge().lastMove||{x:1,y:0};
    let fx=lm.x||1,fy=lm.y||0,mag=Math.hypot(fx,fy)||1;fx/=mag;fy/=mag;const rx=-fy,ry=fx;
    const duration=type==='roulette'?780:650,startTime=performance.now();
    bridge().skillAction={type,start:startTime,duration,active:true,progress:0};
    const label=type==='stepover'?'Step-over':type==='bodyFeint'?'Body feint':'Roulette';try{flash?.(`${label}...`);}catch(_){ }
    function frame(now){
      const t=clamp((now-startTime)/duration,0,1),e=ease(t);let forward=0,lateral=0;
      if(type==='stepover'){forward=16*e;lateral=Math.sin(t*Math.PI*2)*4.2*(1-t*.25);}
      if(type==='bodyFeint'){forward=14*e;lateral=Math.sin(t*Math.PI)*9.5-Math.sin(t*Math.PI*2)*2.2;}
      if(type==='roulette'){forward=13*e+Math.sin(t*Math.PI)*2.5;lateral=Math.sin(t*Math.PI*2)*6.5;}
      p.x=clamp(start.x+fx*forward+rx*lateral,30,1070);p.y=clamp(start.y+fy*forward+ry*lateral,30,590);
      if(ball.owner==='player'){ball.x=p.x+fx*14;ball.y=p.y+fy*7;}
      bridge().skillAction.progress=t;
      if(t<1)return requestAnimationFrame(frame);
      const defender=m.foes?.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<76);
      if(defender){m.dribbles=(m.dribbles||0)+1;m.rating=Math.min(10,(m.rating||6)+.12);}
      bridge().skillAction={type,active:false,progress:1,end:now};bridge().inputLocked=false;skillBusy=false;try{flash?.(`${label} completed.`);}catch(_){ }
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('pointerdown',e=>{if(e.target?.id!=='touchSkill')return;e.preventDefault();e.stopImmediatePropagation();performSkill(skillTypes[skillIndex++%skillTypes.length]);},true);
  addEventListener('keydown',e=>{if(e.key?.toLowerCase()==='x'){e.preventDefault();e.stopImmediatePropagation();performSkill(skillTypes[skillIndex++%skillTypes.length]);}},true);

  let drill=null,drillRAF=0;
  function addPlayableTraining(){
    const tab=document.getElementById('trainingTab');if(!tab||document.getElementById('playableDrillsPanel'))return;
    const panel=document.createElement('div');panel.id='playableDrillsPanel';panel.className='panel';panel.style.marginTop='14px';
    panel.innerHTML='<div class="eyebrow">ON-PITCH TRAINING</div><h3>Play the drills with your character</h3><p>Enter the pitch and complete the drill yourself. Your score affects development.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"><button data-play-drill="finishing">🎯 Play Finishing Drill<br><small>Score as many as possible</small></button><button data-play-drill="dribbling">⚡ Play Skill Course<br><small>Beat defenders with skills</small></button><button data-play-drill="passing">🔺 Play Passing Drill<br><small>Create accurate passes</small></button><button data-play-drill="freeKick">🥅 Play Free-Kick Drill<br><small>Aim, power & curve</small></button></div><div id="playableDrillMsg" class="message" style="margin-top:10px">Pick a drill to enter the training pitch.</div>';
    tab.appendChild(panel);panel.querySelectorAll('[data-play-drill]').forEach(b=>b.onclick=()=>startPlayableDrill(b.dataset.playDrill));
  }
  function showMatchTab(){document.querySelector('[data-tab="matchTab"]')?.click();}
  function makeTrainingHUD(type){
    document.getElementById('trainingHUD')?.remove();const wrap=document.querySelector('.pitch-wrap');if(!wrap)return null;
    const hud=document.createElement('div');hud.id='trainingHUD';Object.assign(hud.style,{position:'absolute',top:'14px',left:'50%',transform:'translateX(-50%)',zIndex:'20',background:'rgba(4,12,8,.9)',border:'1px solid rgba(223,255,77,.35)',borderRadius:'14px',padding:'10px 14px',color:'#fff',font:'700 12px system-ui',minWidth:'260px',textAlign:'center'});
    hud.innerHTML=`<div style="color:#dfff4d;letter-spacing:.12em;font-size:10px">TRAINING</div><div style="font-size:16px;margin:3px 0">${type.toUpperCase()}</div><div><span id="trainingTime">30</span>s · Score <b id="trainingScore">0</b></div><div id="trainingInstruction" style="font-weight:500;opacity:.8;margin-top:4px"></div><button id="endTrainingBtn" style="margin-top:7px;padding:5px 10px">End Drill</button>`;
    wrap.appendChild(hud);hud.querySelector('#endTrainingBtn').onclick=()=>finishDrill(false);return hud;
  }
  function startPlayableDrill(type){
    if(typeof S==='undefined'||!S)return;if((S.training||0)<=0){const x=document.getElementById('playableDrillMsg');if(x)x.textContent='No training sessions left. Sim forward to recover sessions.';return;}
    showMatchTab();if(typeof startMatch==='function')startMatch();
    setTimeout(()=>{
      const m=getMatch();if(!m)return;m.training=true;m.trainingType=type;m.time=0;m.home=0;m.away=0;m.rating=6;m.playerGoals=0;m.chances=0;m.dribbles=0;m.halfTime=false;m.secondHalf=true;
      bridge().trainingMode={type,active:true};bridge().inputLocked=false;
      const instructions={finishing:'Move into position and shoot. Every goal is 3 points.',dribbling:'Use SKILL near defenders. Beat them cleanly for points.',passing:'Move into space and PASS. Accurate attacking passes score.',freeKick:'Drag the target, set power and curve, then strike.'};
      makeTrainingHUD(type);document.getElementById('trainingInstruction').textContent=instructions[type];drill={type,start:performance.now(),duration:30000,score:0,lastGoals:0,lastDribbles:0,lastChances:0};
      if(type==='finishing'){m.player.x=760;m.player.y=310;m.ball.x=778;m.ball.y=310;m.ball.owner='player';m.foes?.forEach((f,i)=>{f.x=860+(i%2)*58;f.y=170+(i%5)*70;});}
      if(type==='dribbling'){m.player.x=300;m.player.y=310;m.ball.x=316;m.ball.y=310;m.ball.owner='player';m.foes?.forEach((f,i)=>{f.x=450+i*50;f.y=220+(i%2)*180;});}
      if(type==='passing'){m.player.x=350;m.player.y=310;m.ball.x=366;m.ball.y=310;m.ball.owner='player';m.foes?.forEach((f,i)=>{f.x=650+(i%3)*72;f.y=160+(i%5)*76;});}
      if(type==='freeKick')startFreeKickTrainingRound();trainingTick();
    },100);
  }
  function trainingTick(){
    cancelAnimationFrame(drillRAF);if(!drill)return;const m=getMatch();if(!m)return finishDrill(false);
    const elapsed=performance.now()-drill.start,remain=Math.max(0,Math.ceil((drill.duration-elapsed)/1000)),goals=m.home||0,dribbles=m.dribbles||0,chances=m.chances||0;
    if(drill.type==='finishing'&&goals>drill.lastGoals){drill.score+=(goals-drill.lastGoals)*3;drill.lastGoals=goals;m.ball.owner='player';m.player.x=760;m.player.y=310;}
    if(drill.type==='dribbling'&&dribbles>drill.lastDribbles){drill.score+=(dribbles-drill.lastDribbles)*2;drill.lastDribbles=dribbles;}
    if(drill.type==='passing'&&chances>drill.lastChances){drill.score+=(chances-drill.lastChances);drill.lastChances=chances;}
    const t=document.getElementById('trainingTime'),s=document.getElementById('trainingScore');if(t)t.textContent=remain;if(s)s.textContent=drill.score;
    if(elapsed>=drill.duration)return finishDrill(true);drillRAF=requestAnimationFrame(trainingTick);
  }
  function finishDrill(completed=true){
    if(!drill)return;const m=getMatch();if(m){m.running=false;m.training=false;m.setPieceTaking=false;}closeFreeKick();
    const type=drill.type,score=drill.score;cancelAnimationFrame(drillRAF);drill=null;bridge().trainingMode=null;bridge().inputLocked=false;document.getElementById('trainingHUD')?.remove();
    S.training=Math.max(0,(S.training||0)-1);ensureAdvancedAttributes();const points=score>=12?3:score>=6?2:1;S.skillPoints=(S.skillPoints||0)+points;
    if(completed){if(type==='finishing'){S.advancedAttributes.finishing=Math.min(99,S.advancedAttributes.finishing+(score>=9?2:1));if(score>=12)S.attributes.shooting=Math.min(99,S.attributes.shooting+1);}if(type==='dribbling'){S.advancedAttributes.ballControl=Math.min(99,S.advancedAttributes.ballControl+(score>=8?2:1));S.advancedAttributes.agility=Math.min(99,S.advancedAttributes.agility+1);}if(type==='passing'&&score>=8)S.attributes.passing=Math.min(99,S.attributes.passing+1);if(type==='freeKick'){S.advancedAttributes.freeKickAccuracy=Math.min(99,S.advancedAttributes.freeKickAccuracy+(score>=6?2:1));S.freeKickSkill=Math.max(S.freeKickSkill||55,S.advancedAttributes.freeKickAccuracy);}}
    ensureAdvancedAttributes();persist();renderAdvancedAttributes();try{flash?.(`Training complete: ${score} points. +${points} development point${points===1?'':'s'}.`);}catch(_){ }
  }

  let fkState=null;
  function buildFreeKickUI(){
    if(document.getElementById('freeKickControl'))return document.getElementById('freeKickControl');const wrap=document.querySelector('.pitch-wrap');if(!wrap)return null;
    const ui=document.createElement('div');ui.id='freeKickControl';Object.assign(ui.style,{position:'absolute',inset:'0',zIndex:'30',display:'none',background:'rgba(1,6,4,.24)',pointerEvents:'auto'});
    ui.innerHTML=`<div style="position:absolute;right:14px;top:14px;width:min(350px,48%);background:rgba(4,12,8,.95);color:white;border:1px solid rgba(223,255,77,.4);border-radius:18px;padding:14px;font-family:system-ui"><div style="font-size:10px;letter-spacing:.14em;color:#dfff4d;font-weight:900">FREE KICK</div><b style="font-size:18px">Aim the strike</b><p style="font-size:11px;opacity:.72;margin:5px 0 10px">Drag the reticle. Add power and left/right curve, then shoot.</p><div id="fkGoalBox" style="height:118px;border:3px solid #fff;border-bottom-width:5px;position:relative;background:linear-gradient(rgba(255,255,255,.05),rgba(255,255,255,.01));touch-action:none"><div id="fkTarget" style="width:26px;height:26px;border:2px solid #dfff4d;border-radius:50%;position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);box-shadow:0 0 14px #dfff4d"></div><div style="position:absolute;left:50%;bottom:0;width:43%;height:46%;transform:translateX(-50%);background:repeating-linear-gradient(90deg,rgba(255,80,80,.62) 0 10px,rgba(140,30,30,.62) 10px 20px);opacity:.58"></div></div><label style="display:block;font-size:11px;margin-top:10px">POWER <b id="fkPowerText">68</b>%<input id="fkPower" type="range" min="35" max="100" value="68" style="width:100%"></label><label style="display:block;font-size:11px;margin-top:8px">CURVE <b id="fkCurveText">0</b><input id="fkCurve" type="range" min="-100" max="100" value="0" style="width:100%"></label><div style="display:flex;gap:7px;margin-top:10px"><button id="fkShoot" class="primary" style="flex:1">SHOOT</button><button id="fkCancel">Cancel</button></div></div>`;
    wrap.appendChild(ui);const box=ui.querySelector('#fkGoalBox'),target=ui.querySelector('#fkTarget'),power=ui.querySelector('#fkPower'),curve=ui.querySelector('#fkCurve');
    function aim(e){if(!fkState)return;const r=box.getBoundingClientRect();fkState.aimX=clamp((e.clientX-r.left)/r.width,0,1);fkState.aimY=clamp((e.clientY-r.top)/r.height,0,1);target.style.left=(fkState.aimX*100)+'%';target.style.top=(fkState.aimY*100)+'%';bridge().freeKickTarget={x:fkState.aimX,y:fkState.aimY};}
    box.addEventListener('pointerdown',e=>{box.setPointerCapture?.(e.pointerId);aim(e);e.preventDefault();});box.addEventListener('pointermove',e=>{if(e.buttons||e.pressure)aim(e);});
    power.oninput=()=>{if(!fkState)return;fkState.power=+power.value/100;ui.querySelector('#fkPowerText').textContent=power.value;};curve.oninput=()=>{if(!fkState)return;fkState.curve=+curve.value/100;ui.querySelector('#fkCurveText').textContent=curve.value;};
    ui.querySelector('#fkShoot').onclick=shootInteractiveFreeKick;ui.querySelector('#fkCancel').onclick=()=>closeFreeKick(true);return ui;
  }
  function openFreeKick(training=false){
    const m=getMatch();if(!m)return;ensureAdvancedAttributes();fkState={training,aimX:.5,aimY:.38,power:.68,curve:0};bridge().freeKickActive=true;bridge().inputLocked=true;bridge().freeKickTarget={x:.5,y:.38};
    const ui=buildFreeKickUI();ui.style.display='block';const p=m.player;m.ball.owner=null;m.ball.carrier=null;m.ball.x=p.x+13;m.ball.y=p.y;m.ball.vx=m.ball.vy=0;m.setPieceTaking=true;
    const wallX=Math.min(965,p.x+112);(m.foes||[]).slice(0,5).forEach((f,i)=>{f.x=wallX;f.y=250+i*30;});
  }
  function closeFreeKick(cancelled=false){const ui=document.getElementById('freeKickControl');if(ui)ui.style.display='none';bridge().freeKickActive=false;bridge().freeKickFlight=null;bridge().freeKickTarget=null;bridge().inputLocked=false;if(cancelled){const m=getMatch();if(m)m.setPieceTaking=false;}fkState=null;}
  function shootInteractiveFreeKick(){
    const m=getMatch();if(!m||!fkState)return;const ui=document.getElementById('freeKickControl');if(ui)ui.style.display='none';const state={...fkState};fkState=null;
    const b=m.ball,start={x:b.x,y:b.y},targetY=248+state.aimX*(372-248),targetX=1084,curvePx=state.curve*78,duration=1120-state.power*390,startT=performance.now();
    bridge().freeKickActive=false;bridge().freeKickFlight={active:true,height:0,curve:state.curve,power:state.power};bridge().playerAction={type:'freeKick',active:true,start:startT,duration:620};m.setPieceTaking=true;
    function flight(now){
      const t=clamp((now-startT)/duration,0,1),e=ease(t);b.x=start.x+(targetX-start.x)*e;const straight=start.y+(targetY-start.y)*e;b.y=straight+Math.sin(Math.PI*t)*curvePx*(1-t*.18);bridge().freeKickFlight={active:true,height:Math.sin(Math.PI*t)*(1.2+state.power*1.2),curve:state.curve,power:state.power,progress:t};
      if(t<1)return requestAnimationFrame(flight);
      m.setPieceTaking=false;bridge().freeKickFlight=null;bridge().inputLocked=false;ensureAdvancedAttributes();const A=S.advancedAttributes,placement=Math.abs(state.aimX-.5)*2,top=Math.max(0,.58-state.aimY)/.58,technique=((A.freeKickAccuracy||55)+(A.curve||55)+(A.shotPower||55))/300,wallPenalty=Math.max(0,.26-Math.abs(state.curve)*.18-state.power*.09),accuracy=clamp(.40+technique*.43+placement*.08+top*.04-wallPenalty,.20,.90),onTarget=Math.random()<accuracy,keeperSave=onTarget&&Math.random()<clamp(.38-placement*.22-state.power*.14-Math.abs(state.curve)*.09,.08,.40);
      if(onTarget&&!keeperSave){m.home++;m.playerGoals=(m.playerGoals||0)+1;m.rating=Math.min(10,(m.rating||6)+1);try{flash?.('FREE KICK GOAL!');}catch(_){ }if(state.training&&drill)drill.score+=3;}else{try{flash?.(onTarget?'Free kick saved.':'Free kick off target.');}catch(_){ }if(state.training&&drill&&onTarget)drill.score+=1;}
      if(state.training&&drill){setTimeout(startFreeKickTrainingRound,650);}else{m.setPiece=null;const btn=document.getElementById('takeSetPieceBtn');if(btn)btn.style.display='none';b.x=550;b.y=310;b.vx=b.vy=0;}
    }
    requestAnimationFrame(flight);
  }
  function startFreeKickTrainingRound(){if(!drill||drill.type!=='freeKick')return;const m=getMatch();if(!m)return;m.player.x=735+Math.random()*75;m.player.y=245+Math.random()*130;m.ball.x=m.player.x+13;m.ball.y=m.player.y;m.setPiece={type:'freeKick',x:m.player.x,y:m.player.y};openFreeKick(true);}
  document.addEventListener('click',e=>{const btn=e.target?.closest?.('#takeSetPieceBtn');if(!btn)return;const m=getMatch();if(m?.setPiece?.type!=='freeKick')return;e.preventDefault();e.stopImmediatePropagation();openFreeKick(false);},true);

  function relabelOldTraining(){document.querySelectorAll('[data-drill],[data-setpiece-drill]').forEach(b=>{if(!b.dataset.oldLabel){b.dataset.oldLabel='1';b.title='Quick simulation. Use On-Pitch Training below to play the drill yourself.';b.style.opacity='.62';}});}
  ensureAdvancedAttributes();addAdvancedAttributeUI();addPlayableTraining();relabelOldTraining();
  setTimeout(()=>{ensureAdvancedAttributes();addAdvancedAttributeUI();addPlayableTraining();renderAdvancedAttributes();relabelOldTraining();},500);
})();
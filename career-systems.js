(() => {
  function ensureCareerSystems(){
    if(typeof S==='undefined') return;
    if(typeof S.careerDay!=='number') S.careerDay=1;
    if(typeof S.nextFixtureDay!=='number') S.nextFixtureDay=S.careerDay+5;
    if(typeof S.trainingXP!=='number') S.trainingXP=0;
    if(typeof S.foulsWon!=='number') S.foulsWon=0;
    if(typeof S.pensWon!=='number') S.pensWon=0;
    if(typeof S.freeKicksWon!=='number') S.freeKicksWon=0;
  }

  function persist(){try{localStorage.setItem('rtgCareer',JSON.stringify(S));}catch(_){} try{save?.();}catch(_){}}

  function addCalendarUI(){
    const side=document.querySelector('.match-side');
    if(!side||document.getElementById('calendarPanel'))return;
    const panel=document.createElement('div');
    panel.id='calendarPanel';
    panel.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12)';
    panel.innerHTML=`<div class="eyebrow">CAREER CALENDAR</div>
      <div style="display:flex;justify-content:space-between;gap:10px;margin:8px 0 10px"><span>Day <b id="careerDayText">1</b></span><span>Next match: <b id="fixtureDayText">Day 6</b></span></div>
      <button id="simDaysBtn" style="width:100%">Sim to Next Fixture</button>
      <div id="calendarMsg" class="message" style="margin-top:8px">Training and recovery happen between fixtures.</div>`;
    side.appendChild(panel);
    panel.querySelector('#simDaysBtn').onclick=simToFixture;
    renderCalendar();
  }

  function renderCalendar(){
    ensureCareerSystems();
    const a=document.getElementById('careerDayText'),b=document.getElementById('fixtureDayText'),btn=document.getElementById('simDaysBtn');
    if(a)a.textContent=S.careerDay;
    if(b)b.textContent=`Day ${S.nextFixtureDay}`;
    if(btn){const days=Math.max(0,S.nextFixtureDay-S.careerDay);btn.textContent=days?`Sim ${days} Day${days===1?'':'s'} to Fixture`:'Fixture Ready';btn.disabled=days===0;}
  }

  function simToFixture(){
    ensureCareerSystems();
    if(S.careerDay>=S.nextFixtureDay)return;
    const days=S.nextFixtureDay-S.careerDay;
    for(let d=0;d<days;d++){
      S.careerDay++;
      if(S.careerDay%2===0) S.training=Math.min(3,(S.training||0)+1);
      if(Math.random()<.16) S.news?.unshift?.(`Day ${S.careerDay}: Recovery and tactical work completed ahead of the next fixture.`);
    }
    const msg=document.getElementById('calendarMsg');if(msg)msg.textContent=`Simulated ${days} day${days===1?'':'s'}. Match day is here.`;
    const matchMsg=document.getElementById('matchMessage');if(matchMsg)matchMsg.textContent='Fixture day. You are ready to play.';
    persist();renderCalendar();try{render?.();}catch(_){ }
  }

  function scheduleNextFixture(){
    ensureCareerSystems();
    S.careerDay=Math.max(S.careerDay,S.nextFixtureDay);
    S.nextFixtureDay=S.careerDay+4+Math.floor(Math.random()*4);
    persist();renderCalendar();
  }

  function addTrainingMode(){
    const tab=document.getElementById('trainingTab');
    if(!tab||document.getElementById('trainingGroundPanel'))return;
    const panel=document.createElement('div');panel.id='trainingGroundPanel';panel.className='panel';panel.style.marginTop='14px';
    panel.innerHTML=`<div class="eyebrow">TRAINING GROUND</div><h3>Playable Training Mode</h3>
      <p>Complete drills between fixtures to earn development points and improve specific attributes.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        <button data-drill="finishing">🎯 Finishing Drill<br><small>Shooting + points</small></button>
        <button data-drill="dribbling">⚡ Dribbling Course<br><small>Dribbling + pace</small></button>
        <button data-drill="passing">🔺 Passing Gates<br><small>Passing + vision</small></button>
      </div><div id="drillMsg" class="message" style="margin-top:10px">Choose a drill. Better scores earn more development points.</div>`;
    tab.appendChild(panel);
    panel.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>runDrill(b.dataset.drill));
  }

  function runDrill(type){
    ensureCareerSystems();
    if((S.training||0)<=0){const m=document.getElementById('drillMsg');if(m)m.textContent='No training sessions left. Sim days to recover sessions.';return;}
    S.training--;
    const base=55+Math.random()*35+(S.overall-60)*.35;
    const score=Math.max(40,Math.min(100,Math.round(base)));
    const reward=score>=90?3:score>=78?2:1;
    S.skillPoints=(S.skillPoints||0)+reward;
    const attrs=type==='finishing'?['shooting']:type==='dribbling'?['dribbling','pace']:['passing'];
    if(score>=82){const key=attrs[Math.floor(Math.random()*attrs.length)];S.attributes[key]=Math.min(99,S.attributes[key]+1);}
    S.trainingXP+=score;S.timeline?.unshift?.(`Training: ${type} drill scored ${score}/100 and earned ${reward} development point${reward===1?'':'s'}.`);
    const m=document.getElementById('drillMsg');if(m)m.textContent=`${type[0].toUpperCase()+type.slice(1)} drill: ${score}/100. +${reward} development point${reward===1?'':'s'}${score>=82?' and an attribute boost.':''}`;
    persist();try{render?.();}catch(_){ }
  }

  let foulCooldown=0;
  function isInPenaltyArea(p){return p.x>907&&p.y>155&&p.y<465;}

  function awardFoul(defender){
    if(!match?.running||match.setPiece)return;
    const p=match.player;
    const penalty=isInPenaltyArea(p);
    match.setPiece={type:penalty?'penalty':'freeKick',x:p.x,y:p.y};
    match.running=true;match.ball.owner=null;match.ball.carrier=null;match.ball.x=p.x;match.ball.y=p.y;match.ball.vx=0;match.ball.vy=0;
    S.foulsWon++;if(penalty)S.pensWon++;else S.freeKicksWon++;
    showSetPieceButton(penalty);
    flash(penalty?'PENALTY! You were brought down in the box.':'FOUL! Free kick awarded.');
    persist();
  }

  function showSetPieceButton(penalty){
    const side=document.querySelector('.match-side');if(!side)return;
    let btn=document.getElementById('takeSetPieceBtn');
    if(!btn){btn=document.createElement('button');btn.id='takeSetPieceBtn';btn.className='primary';btn.style.cssText='width:100%;margin-top:10px;background:#ffe34d;color:#111';side.insertBefore(btn,document.getElementById('matchMessage'));}
    btn.textContent=penalty?'Take Penalty':'Take Free Kick';btn.style.display='block';
    btn.onclick=takeSetPiece;
  }

  function takeSetPiece(){
    if(!match?.setPiece)return;
    const sp=match.setPiece,shooting=S.attributes.shooting||60;
    const aim=window.Career3DBridge?.shotAim?.offset||((Math.random()-.5)*1.2);
    const placement=Math.min(1,Math.abs(aim));
    const baseChance=sp.type==='penalty'?.68:.18;
    const chance=Math.min(.93,baseChance+(shooting-60)/180+placement*.11);
    const scored=Math.random()<chance;
    if(scored){match.home++;match.playerGoals=(match.playerGoals||0)+1;match.rating=Math.min(10,match.rating+(sp.type==='penalty'?.9:1.05));flash(sp.type==='penalty'?'Penalty scored!':'Free kick GOAL!');}
    else{flash(sp.type==='penalty'?'Penalty saved!':'Free kick saved or wide.');}
    match.ball.x=550;match.ball.y=310;match.ball.owner=null;match.ball.vx=match.ball.vy=0;match.setPiece=null;
    const btn=document.getElementById('takeSetPieceBtn');if(btn)btn.style.display='none';
  }

  function wrapMatchLogic(){
    if(typeof update==='function'&&!update.__careerSystemsWrapped){
      const baseUpdate=update;
      const wrapped=function(){
        baseUpdate();
        if(!match?.running||match.setPiece)return;
        if(foulCooldown>0)foulCooldown--;
        if(match.ball?.owner==='player'&&foulCooldown<=0){
          const p=match.player;
          const close=match.foes?.find(f=>Math.hypot(f.x-p.x,f.y-p.y)<24);
          if(close){
            const sprinting=typeof keys!=='undefined'&&keys.shift;
            const foulChance=.004+(sprinting?.004:0);
            if(Math.random()<foulChance){foulCooldown=180;awardFoul(close);}
          }
        }
      };
      wrapped.__careerSystemsWrapped=true;update=wrapped;
    }

    if(typeof completeMatch==='function'&&!completeMatch.__calendarWrapped){
      const baseComplete=completeMatch;
      const wrappedComplete=function(...args){const out=baseComplete(...args);scheduleNextFixture();return out;};
      wrappedComplete.__calendarWrapped=true;completeMatch=wrappedComplete;
    }
  }

  ensureCareerSystems();addCalendarUI();addTrainingMode();wrapMatchLogic();
  setTimeout(()=>{addCalendarUI();addTrainingMode();wrapMatchLogic();renderCalendar();},500);
})();
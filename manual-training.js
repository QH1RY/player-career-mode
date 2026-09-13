(() => {
  const bridge=()=>window.Career3DBridge||{};
  const getMatch=()=>bridge().getMatch?.()||null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let drill=null,raf=0,lastOwner=null,lastPlayer={x:0,y:0};

  const drills={
    pace:{title:'Sprint & Agility',instruction:'Hold SPRINT and race through the pitch. Distance covered scores points.',duration:30000,attr:'pace'},
    shooting:{title:'Finishing',instruction:'Get into shooting positions and score as many goals as you can.',duration:30000,attr:'shooting'},
    passing:{title:'Chance Creation',instruction:'Move into space and use PASS to create chances.',duration:30000,attr:'passing'},
    dribbling:{title:'1v1 Dribbling',instruction:'Carry the ball at defenders and use SKILL to beat them.',duration:30000,attr:'dribbling'},
    physical:{title:'Strength & Stamina',instruction:'Sprint continuously and cover as much ground as possible before time runs out.',duration:35000,attr:'physical'},
    defending:{title:'Defensive Work',instruction:'Close down the ball carrier and use TACKLE to win possession back.',duration:30000,attr:'defending'}
  };

  function persist(){try{save?.();}catch(_){try{localStorage.setItem('rtgCareer',JSON.stringify(S));}catch(__){}}}
  function openMatchTab(){document.querySelector('[data-tab="matchTab"]')?.click();}
  function setupHUD(meta){
    document.getElementById('manualTrainingHUD')?.remove();
    const wrap=document.querySelector('.pitch-wrap');if(!wrap)return;
    const hud=document.createElement('div');hud.id='manualTrainingHUD';
    Object.assign(hud.style,{position:'absolute',left:'50%',top:'12px',transform:'translateX(-50%)',zIndex:'35',minWidth:'285px',maxWidth:'72%',padding:'10px 14px',borderRadius:'14px',background:'rgba(24,50,94,.93)',color:'#fff',font:'800 12px system-ui',textAlign:'center',boxShadow:'0 6px 20px rgba(0,0,0,.28)',pointerEvents:'auto'});
    hud.innerHTML=`<div style="font-size:10px;letter-spacing:.12em;color:#ffdf48">MANUAL TRAINING</div><div style="font-size:17px;margin:2px 0 4px">${meta.title}</div><div id="manualTrainingInstruction" style="font-weight:500;opacity:.88;margin-bottom:6px">${meta.instruction}</div><div><b id="manualTrainingTime">30</b>s · Score <b id="manualTrainingScore">0</b></div><button id="manualTrainingEnd" style="margin-top:8px;border:0;border-radius:9px;padding:6px 10px;font-weight:900">END DRILL</button>`;
    wrap.appendChild(hud);hud.querySelector('#manualTrainingEnd').onclick=()=>finish(false);
  }

  function setupMatch(type){
    const m=getMatch();if(!m)return;
    m.training=true;m.trainingType=type;m.time=0;m.home=0;m.away=0;m.rating=6;m.playerGoals=0;m.chances=0;m.dribbles=0;m.halfTime=false;m.secondHalf=true;
    bridge().trainingMode={active:true,type};bridge().inputLocked=false;
    m.player.x=type==='shooting'?760:type==='defending'?520:300;m.player.y=310;
    m.ball.x=m.player.x+16;m.ball.y=310;m.ball.vx=0;m.ball.vy=0;m.ball.owner=type==='defending'?'foe':'player';
    if(type==='shooting')m.foes?.forEach((f,i)=>{f.x=860+(i%2)*55;f.y=160+(i%5)*72;});
    if(type==='dribbling')m.foes?.forEach((f,i)=>{f.x=445+i*48;f.y=220+(i%2)*180;});
    if(type==='passing')m.foes?.forEach((f,i)=>{f.x=620+(i%3)*80;f.y=145+(i%5)*82;});
    if(type==='defending'){
      const foe=m.foes?.[0];if(foe){foe.x=650;foe.y=310;m.ball.x=foe.x;m.ball.y=foe.y;}
      m.foes?.slice(1).forEach((f,i)=>{f.x=720+(i%3)*65;f.y=150+(i%5)*80;});
    }
    lastOwner=m.ball.owner;lastPlayer={x:m.player.x,y:m.player.y};
  }

  function start(type){
    const meta=drills[type];if(!meta||typeof S==='undefined'||!S)return;
    if((S.training||0)<=0){const msg=document.getElementById('trainingMsg');if(msg)msg.textContent='No training sessions left this week.';return;}
    openMatchTab();
    if(typeof startMatch==='function')startMatch();
    setTimeout(()=>{
      const m=getMatch();if(!m)return;
      setupMatch(type);setupHUD(meta);
      drill={type,meta,start:performance.now(),score:0,lastGoals:0,lastChances:0,lastDribbles:0,distance:0,lastDefScore:0};
      tick();
    },120);
  }

  function tick(){
    cancelAnimationFrame(raf);if(!drill)return;
    const m=getMatch();if(!m)return finish(false);
    const now=performance.now(),elapsed=now-drill.start,remain=Math.max(0,Math.ceil((drill.meta.duration-elapsed)/1000));
    const dx=m.player.x-lastPlayer.x,dy=m.player.y-lastPlayer.y,dist=Math.hypot(dx,dy);lastPlayer={x:m.player.x,y:m.player.y};

    if(drill.type==='pace'||drill.type==='physical'){
      drill.distance+=dist;
      const step=drill.type==='physical'?110:85;
      drill.score=Math.floor(drill.distance/step);
    }
    if(drill.type==='shooting'){
      const goals=m.playerGoals||m.home||0;if(goals>drill.lastGoals){drill.score+=(goals-drill.lastGoals)*3;drill.lastGoals=goals;m.player.x=760;m.player.y=310;m.ball.x=776;m.ball.y=310;m.ball.owner='player';m.ball.vx=0;m.ball.vy=0;}
    }
    if(drill.type==='passing'){
      const chances=m.chances||0;if(chances>drill.lastChances){drill.score+=(chances-drill.lastChances);drill.lastChances=chances;}
    }
    if(drill.type==='dribbling'){
      const dr=m.dribbles||0;if(dr>drill.lastDribbles){drill.score+=(dr-drill.lastDribbles)*2;drill.lastDribbles=dr;}
    }
    if(drill.type==='defending'){
      const owner=m.ball?.owner;
      if(lastOwner==='foe'&&(owner==='player'||owner===null)&&Math.hypot(m.player.x-m.ball.x,m.player.y-m.ball.y)<70){drill.score+=2;const foe=m.foes?.[0];if(foe){foe.x=650+Math.random()*170;foe.y=150+Math.random()*320;m.ball.x=foe.x;m.ball.y=foe.y;m.ball.owner='foe';}}
      lastOwner=m.ball?.owner;
    }

    const t=document.getElementById('manualTrainingTime'),s=document.getElementById('manualTrainingScore');if(t)t.textContent=remain;if(s)s.textContent=drill.score;
    if(elapsed>=drill.meta.duration)return finish(true);
    raf=requestAnimationFrame(tick);
  }

  function finish(completed){
    if(!drill)return;cancelAnimationFrame(raf);
    const m=getMatch();if(m){m.running=false;m.training=false;}
    const d=drill;drill=null;bridge().trainingMode=null;bridge().inputLocked=false;document.getElementById('manualTrainingHUD')?.remove();
    S.training=Math.max(0,(S.training||0)-1);
    const gain=d.score>=10?2:1;
    if(completed&&S.attributes?.[d.meta.attr]!=null)S.attributes[d.meta.attr]=clamp(S.attributes[d.meta.attr]+gain,1,99);
    if(completed&&d.type==='shooting'&&S.advancedAttributes?.finishing!=null)S.advancedAttributes.finishing=clamp(S.advancedAttributes.finishing+gain,1,99);
    if(completed&&d.type==='dribbling'&&S.advancedAttributes?.ballControl!=null)S.advancedAttributes.ballControl=clamp(S.advancedAttributes.ballControl+gain,1,99);
    S.skillPoints=(S.skillPoints||0)+(d.score>=12?3:d.score>=6?2:1);
    persist();try{render?.();}catch(_){ }
    const msg=document.getElementById('trainingMsg');if(msg)msg.textContent=`${d.meta.title}: ${d.score} points. ${completed?`+${gain} ${d.meta.attr}.`:'Drill ended.'} ${S.training} session${S.training===1?'':'s'} left.`;
    document.querySelector('[data-tab="trainingTab"]')?.click();
  }

  function convertButtons(){
    document.querySelectorAll('[data-train]').forEach(btn=>{
      if(btn.dataset.manualReady)return;btn.dataset.manualReady='1';btn.innerHTML='▶ '+btn.textContent.trim();
    });
    const panel=document.getElementById('playableDrillsPanel');if(panel)panel.style.display='none';
    const note=document.getElementById('trainingMsg');if(note&&note.textContent.includes('sessions available'))note.textContent=`${S?.training??3} playable training sessions available. Tap a drill and control your player yourself.`;
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-train]');if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();start(btn.dataset.train);
  },true);

  convertButtons();setTimeout(convertButtons,300);setTimeout(convertButtons,900);
  window.RTGManualTraining={start,finish};
})();
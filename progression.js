(() => {
  function ensureProgression(){
    if(typeof S==='undefined') return;
    if(typeof S.skillPoints!=='number') S.skillPoints=0;
    if(!S.attributeHistory) S.attributeHistory=[];
  }

  function costFor(value){
    if(value>=90) return 3;
    if(value>=80) return 2;
    return 1;
  }

  function calcOverall(){
    const a=S.attributes;
    const weights={
      ST:{pace:.18,shooting:.34,passing:.12,dribbling:.20,physical:.12,defending:.04},
      LW:{pace:.26,shooting:.19,passing:.16,dribbling:.28,physical:.07,defending:.04},
      RW:{pace:.26,shooting:.19,passing:.16,dribbling:.28,physical:.07,defending:.04},
      CAM:{pace:.12,shooting:.18,passing:.28,dribbling:.28,physical:.07,defending:.07},
      CM:{pace:.10,shooting:.12,passing:.30,dribbling:.20,physical:.13,defending:.15},
      CDM:{pace:.08,shooting:.06,passing:.22,dribbling:.12,physical:.22,defending:.30},
      LB:{pace:.20,shooting:.05,passing:.16,dribbling:.12,physical:.18,defending:.29},
      RB:{pace:.20,shooting:.05,passing:.16,dribbling:.12,physical:.18,defending:.29},
      CB:{pace:.10,shooting:.03,passing:.10,dribbling:.05,physical:.28,defending:.44}
    }[S.position] || {pace:.17,shooting:.17,passing:.17,dribbling:.17,physical:.16,defending:.16};
    const raw=Object.entries(weights).reduce((t,[k,w])=>t+a[k]*w,0);
    const next=Math.round(raw);
    S.overall=Math.min(S.potential,Math.max(S.overall,next));
  }

  function pointsEarned(rating, goals, assists){
    let pts=0;
    if(rating>=6.5) pts+=1;
    if(rating>=7.0) pts+=1;
    if(rating>=7.5) pts+=1;
    if(rating>=8.0) pts+=1;
    if(rating>=8.5) pts+=1;
    if(rating>=9.0) pts+=1;
    pts += (goals||0)*2;
    pts += (assists||0);
    if(match?.dribbles>=3) pts+=1;
    if(match?.chances>=2) pts+=1;
    return pts;
  }

  function buildUI(){
    ensureProgression();
    const careerPanel=document.querySelector('#careerTab .grid-2');
    if(!careerPanel || document.getElementById('skillPointPanel')) return;
    const wrap=document.createElement('div');
    wrap.id='skillPointPanel';
    wrap.className='panel';
    wrap.style.gridColumn='1 / -1';
    wrap.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div><div class="eyebrow">PLAYER DEVELOPMENT</div><h3>Attribute Points</h3><p style="color:var(--muted);margin:.35rem 0 0">Play well to earn points, then spend them on the attributes you want.</p></div>
        <div style="background:#09140f;border:1px solid #294733;border-radius:14px;padding:12px 18px;text-align:center"><strong id="skillPointCount" style="font-size:32px;color:var(--accent)">0</strong><div style="font-size:10px;color:var(--muted);font-weight:800">POINTS AVAILABLE</div></div>
      </div>
      <div id="upgradeGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:16px"></div>
      <div id="upgradeMsg" class="message">Higher attributes cost more points: 1 point below 80, 2 points from 80–89, 3 points from 90+.</div>`;
    careerPanel.appendChild(wrap);
  }

  function renderProgression(){
    ensureProgression(); buildUI();
    const count=document.getElementById('skillPointCount');
    const grid=document.getElementById('upgradeGrid');
    if(!count||!grid) return;
    count.textContent=S.skillPoints;
    grid.innerHTML=Object.entries(S.attributes).map(([k,v])=>{
      const cost=costFor(v);
      const disabled=v>=99||S.skillPoints<cost;
      return `<button data-upgrade="${k}" ${disabled?'disabled':''} style="text-align:left;padding:14px;opacity:${disabled?.55:1}"><span style="display:flex;justify-content:space-between"><b>${k[0].toUpperCase()+k.slice(1)}</b><strong style="color:var(--accent)">${v}</strong></span><small style="display:block;color:var(--muted);margin-top:5px">+1 costs ${cost} point${cost>1?'s':''}</small></button>`;
    }).join('');
    grid.querySelectorAll('[data-upgrade]').forEach(btn=>btn.onclick=()=>{
      const key=btn.dataset.upgrade;const old=S.attributes[key];const cost=costFor(old);
      if(S.skillPoints<cost||old>=99)return;
      S.skillPoints-=cost;S.attributes[key]++;
      calcOverall();S.value*=1.018;
      S.attributeHistory.unshift(`${key} improved to ${S.attributes[key]}`);
      const msg=document.getElementById('upgradeMsg');
      if(msg) msg.textContent=`${key[0].toUpperCase()+key.slice(1)} upgraded to ${S.attributes[key]}. Overall is now ${S.overall}.`;
      localStorage.setItem('rtgCareer',JSON.stringify(S));
      render();renderProgression();
    });
  }

  const originalRender=render;
  render=function(){originalRender();renderProgression();};

  const originalCompleteMatch=completeMatch;
  completeMatch=function(perf,g,a,hs,as){
    ensureProgression();
    const earned=pointsEarned(perf,g,a);
    originalCompleteMatch(perf,g,a,hs,as);
    ensureProgression();
    S.skillPoints+=earned;
    if(earned>0){
      S.news.unshift(`${S.first} ${S.last} earned ${earned} development point${earned===1?'':'s'} from the latest match.`);
      S.timeline.unshift(`Earned ${earned} attribute point${earned===1?'':'s'} after a ${perf.toFixed(1)} match rating.`);
    }
    localStorage.setItem('rtgCareer',JSON.stringify(S));
    render();
    const msg=document.getElementById('matchMessage');
    if(msg) msg.textContent += ` You earned ${earned} attribute point${earned===1?'':'s'}.`;
  };

  ensureProgression();
  renderProgression();
})();
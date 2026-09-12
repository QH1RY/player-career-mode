(() => {
  const LEAGUE_NAME='Premier Career League';
  const TEAMS=['South London FC','Northbridge United','Capital City','Riverside Athletic','Borough Town','Eastside Rovers','Kingsbridge FC','Docklands City','Westfield United','Thames Athletic'];

  function ensureLeague(){
    if(typeof S==='undefined'||!S)return;
    if(!S.leagueName)S.leagueName=LEAGUE_NAME;
    if(!Array.isArray(S.leagueTeams)||S.leagueTeams.length<10)S.leagueTeams=[...TEAMS];
    if(!S.leagueTeams.includes(S.club))S.leagueTeams[0]=S.club;
    if(!Array.isArray(S.leagueTable)||S.leagueTable.length!==S.leagueTeams.length){
      S.leagueTable=S.leagueTeams.map(name=>({name,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
    }
    if(typeof S.leagueRound!=='number')S.leagueRound=1;
    if(typeof S.leagueSeasonMatches!=='number')S.leagueSeasonMatches=0;
    if(typeof S.currentOpponent!=='string')S.currentOpponent=nextOpponent();
  }

  function nextOpponent(){
    const list=(S.leagueTeams||TEAMS).filter(t=>t!==S.club);
    const idx=((S.leagueRound||1)-1)%list.length;
    return list[idx]||'Riverside Athletic';
  }

  function row(name){return S.leagueTable.find(r=>r.name===name);}
  function applyResult(home,away,hg,ag){
    const h=row(home),a=row(away);if(!h||!a)return;
    h.p++;a.p++;h.gf+=hg;h.ga+=ag;a.gf+=ag;a.ga+=hg;
    if(hg>ag){h.w++;a.l++;h.pts+=3;}else if(hg<ag){a.w++;h.l++;a.pts+=3;}else{h.d++;a.d++;h.pts++;a.pts++;}
  }

  function simulateOtherFixtures(){
    const others=S.leagueTeams.filter(t=>t!==S.club&&t!==S.currentOpponent).sort(()=>Math.random()-.5);
    for(let i=0;i<others.length-1;i+=2){
      const h=others[i],a=others[i+1];
      const hg=Math.floor(Math.random()*4),ag=Math.floor(Math.random()*4);
      applyResult(h,a,hg,ag);
    }
  }

  function sorted(){
    return [...S.leagueTable].sort((a,b)=>b.pts-a.pts||((b.gf-b.ga)-(a.gf-a.ga))||b.gf-a.gf||a.name.localeCompare(b.name));
  }

  function persist(){try{save?.();}catch(_){try{localStorage.setItem('rtgCareer',JSON.stringify(S));}catch(__){}}}

  function addLeagueTab(){
    const tabs=document.querySelector('.tabs');
    if(!tabs||document.querySelector('[data-tab="leagueTab"]'))return;
    const btn=document.createElement('button');btn.className='tab';btn.dataset.tab='leagueTab';btn.textContent='League';
    tabs.insertBefore(btn,tabs.querySelector('[data-tab="newsTab"]'));
    const section=document.createElement('section');section.id='leagueTab';section.className='tab-page hidden';
    section.innerHTML=`<div class="panel"><div class="eyebrow">${LEAGUE_NAME.toUpperCase()}</div><div style="display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap"><div><h3 style="margin:5px 0">League Table</h3><p id="leagueRoundText" style="margin:0;opacity:.75"></p></div><div id="nextLeagueFixture" class="message"></div></div><div style="overflow:auto;margin-top:14px"><table style="width:100%;border-collapse:collapse;min-width:560px;font-size:13px"><thead><tr><th style="text-align:left;padding:8px">#</th><th style="text-align:left">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead><tbody id="leagueTableBody"></tbody></table></div></div>`;
    document.querySelector('#career')?.appendChild(section);
    btn.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.tab-page').forEach(p=>p.classList.add('hidden'));section.classList.remove('hidden');renderLeague();};
  }

  function renderLeague(){
    ensureLeague();
    const body=document.getElementById('leagueTableBody');if(!body)return;
    const table=sorted();
    body.innerHTML=table.map((r,i)=>`<tr style="${r.name===S.club?'background:rgba(223,255,77,.10);font-weight:700':''}"><td style="padding:9px 8px">${i+1}</td><td>${r.name}</td><td style="text-align:center">${r.p}</td><td style="text-align:center">${r.w}</td><td style="text-align:center">${r.d}</td><td style="text-align:center">${r.l}</td><td style="text-align:center">${r.gf}</td><td style="text-align:center">${r.ga}</td><td style="text-align:center">${r.gf-r.ga}</td><td style="text-align:center">${r.pts}</td></tr>`).join('');
    const rr=document.getElementById('leagueRoundText');if(rr)rr.textContent=`Season ${S.season} · Round ${S.leagueRound}`;
    const fx=document.getElementById('nextLeagueFixture');if(fx)fx.textContent=`Next: ${S.club} vs ${S.currentOpponent}`;
    const away=document.getElementById('awayTeam');if(away)away.textContent=S.currentOpponent;
    const home=document.getElementById('homeTeam');if(home)home.textContent=S.club;
  }

  function wrapCompleteMatch(){
    if(typeof completeMatch!=='function'||completeMatch.__leagueWrapped)return;
    const base=completeMatch;
    const wrapped=function(perf,g,a,hs,as){
      ensureLeague();
      const opponent=S.currentOpponent||nextOpponent();
      applyResult(S.club,opponent,Number(hs)||0,Number(as)||0);
      simulateOtherFixtures();
      S.leagueSeasonMatches++;
      S.leagueRound++;
      if(S.leagueSeasonMatches>=18){
        const champion=sorted()[0]?.name;
        S.news?.unshift?.(`${champion} are crowned ${LEAGUE_NAME} champions.`);
        S.timeline?.unshift?.(`Completed league season ${S.season}. ${S.club} finished ${sorted().findIndex(r=>r.name===S.club)+1}${['st','nd','rd'][Math.min(2,Math.max(0,sorted().findIndex(r=>r.name===S.club)))]||'th'}.`);
        S.leagueSeasonMatches=0;S.leagueRound=1;
        S.leagueTable=S.leagueTeams.map(name=>({name,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
      }
      S.currentOpponent=nextOpponent();
      const out=base(perf,g,a,hs,as);
      persist();renderLeague();return out;
    };
    wrapped.__leagueWrapped=true;completeMatch=wrapped;
  }

  function makeMatchesLonger(){
    if(typeof update!=='function'||update.__durationWrapped)return;
    const base=update;
    const wrapped=function(){
      if(!match)return base();
      const before=match.time||0;
      const out=base();
      const after=match.time||before;
      const delta=Math.max(0,after-before);
      // Existing engine advances about 2.28 game-seconds/frame. Scale to ~5.5 real minutes for 90 minutes.
      match.time=before+delta*0.12;
      return out;
    };
    wrapped.__durationWrapped=true;update=wrapped;
  }

  function wrapStartMatch(){
    if(typeof startMatch!=='function'||startMatch.__leagueStartWrapped)return;
    const base=startMatch;
    const wrapped=function(){ensureLeague();renderLeague();const out=base();const away=document.getElementById('awayTeam');if(away)away.textContent=S.currentOpponent;return out;};
    wrapped.__leagueStartWrapped=true;startMatch=wrapped;
    const k=document.getElementById('kickoffBtn');if(k)k.onclick=startMatch;
  }

  ensureLeague();addLeagueTab();wrapCompleteMatch();makeMatchesLonger();wrapStartMatch();renderLeague();
  setTimeout(()=>{ensureLeague();addLeagueTab();wrapCompleteMatch();makeMatchesLonger();wrapStartMatch();renderLeague();},450);
})();
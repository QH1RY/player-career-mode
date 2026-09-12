(() => {
  let overlay=null;

  function createOverlay(){
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='halfTimeOverlay';
    Object.assign(overlay.style,{position:'absolute',inset:'0',zIndex:'40',display:'none',alignItems:'center',justifyContent:'center',padding:'18px',background:'rgba(3,10,7,.82)',backdropFilter:'blur(8px)',borderRadius:'15px'});
    overlay.innerHTML=`<div style="width:min(430px,92%);background:linear-gradient(160deg,#102219,#07110d);border:1px solid rgba(255,255,255,.16);border-radius:22px;padding:22px;color:#fff;box-shadow:0 24px 70px rgba(0,0,0,.5);font-family:system-ui,-apple-system,sans-serif;text-align:center">
      <div style="font-size:11px;font-weight:900;letter-spacing:.18em;color:#dfff4d">HALF TIME</div>
      <h2 style="margin:7px 0 12px;font-size:28px">45:00</h2>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:14px;border-radius:16px;background:rgba(255,255,255,.05)">
        <div id="htHome" style="font-weight:800;text-align:right">Home</div>
        <div style="font-size:28px;font-weight:900"><span id="htHomeScore">0</span> - <span id="htAwayScore">0</span></div>
        <div id="htAway" style="font-weight:800;text-align:left">Away</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0">
        <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.05)"><small style="opacity:.7">Rating</small><div id="htRating" style="font-size:20px;font-weight:900">6.0</div></div>
        <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.05)"><small style="opacity:.7">Goals</small><div id="htGoals" style="font-size:20px;font-weight:900">0</div></div>
        <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.05)"><small style="opacity:.7">Chances</small><div id="htChances" style="font-size:20px;font-weight:900">0</div></div>
      </div>
      <p id="htMessage" style="margin:8px 0 16px;color:#c7d3cc;line-height:1.45">First half complete. Reset and go again.</p>
      <button id="startSecondHalfBtn" style="width:100%;padding:14px;border:0;border-radius:14px;background:#dfff4d;color:#07110d;font-weight:900;font-size:16px">Start Second Half</button>
    </div>`;
    document.querySelector('.pitch-wrap')?.appendChild(overlay);
    overlay.querySelector('#startSecondHalfBtn').onclick=startSecondHalf;
    return overlay;
  }

  function resetForSecondHalf(){
    if(!match)return;
    match.player.x=280;match.player.y=310;
    match.ball.x=550;match.ball.y=310;match.ball.vx=0;match.ball.vy=0;match.ball.owner=null;match.ball.carrier=null;
    match.shotInFlight=false;
    match.mates?.forEach((a,i)=>{a.x=150+(i%3)*135;a.y=80+(i%5)*110;});
    match.foes?.forEach((f,i)=>{f.x=640+(i%4)*90;f.y=75+(i%5)*112;f.tackleCd=0;});
    if(match.homeKeeper){match.homeKeeper.x=54;match.homeKeeper.y=310;}
    if(match.awayKeeper){match.awayKeeper.x=1046;match.awayKeeper.y=310;}
    if(match.keeper){match.keeper.x=1046;match.keeper.y=310;}
  }

  function showHalfTime(){
    const el=createOverlay();
    const home=document.getElementById('homeTeam')?.textContent||S?.club||'Home';
    const away=document.getElementById('awayTeam')?.textContent||S?.currentOpponent||'Away';
    el.querySelector('#htHome').textContent=home;
    el.querySelector('#htAway').textContent=away;
    el.querySelector('#htHomeScore').textContent=match?.home||0;
    el.querySelector('#htAwayScore').textContent=match?.away||0;
    el.querySelector('#htRating').textContent=(match?.rating||6).toFixed(1);
    el.querySelector('#htGoals').textContent=match?.playerGoals||0;
    el.querySelector('#htChances').textContent=match?.chances||0;
    const rating=match?.rating||6;
    el.querySelector('#htMessage').textContent=rating>=7.5?'Strong first half. Keep making the difference.':rating<6.2?'You can turn this around. Keep your positioning simple and get involved.':'Solid first half. Find more space and create the next big chance.';
    el.style.display='flex';
    const msg=document.getElementById('matchMessage');if(msg)msg.textContent=`Half time: ${match?.home||0}-${match?.away||0}.`;
  }

  function startSecondHalf(){
    if(!match||!match.halfTime)return;
    overlay.style.display='none';
    resetForSecondHalf();
    match.halfTime=false;
    match.secondHalf=true;
    match.running=true;
    const msg=document.getElementById('matchMessage');if(msg)msg.textContent='Second half underway.';
    requestAnimationFrame(loop);
  }

  function wrapUpdate(){
    if(typeof update!=='function'||update.__halfTimeWrapped)return;
    const base=update;
    const wrapped=function(){
      if(!match)return base();
      if(match.halfTime)return;
      const before=match.time||0;
      const out=base();
      if(!match.halfTime&&!match.secondHalf&&before<45*60&&(match.time||0)>=45*60){
        match.time=45*60;
        match.running=false;
        match.halfTime=true;
        showHalfTime();
      }
      return out;
    };
    wrapped.__halfTimeWrapped=true;
    update=wrapped;
  }

  function wrapStartMatch(){
    if(typeof startMatch!=='function'||startMatch.__halfTimeStartWrapped)return;
    const base=startMatch;
    const wrapped=function(){
      if(overlay)overlay.style.display='none';
      const out=base();
      if(match){match.halfTime=false;match.secondHalf=false;}
      return out;
    };
    wrapped.__halfTimeStartWrapped=true;
    startMatch=wrapped;
    const btn=document.getElementById('kickoffBtn');if(btn)btn.onclick=startMatch;
  }

  createOverlay();wrapUpdate();wrapStartMatch();
  setTimeout(()=>{wrapUpdate();wrapStartMatch();},500);
})();
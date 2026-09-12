(() => {
  const KEY='rtg3dHowToPlaySeen_v1';
  const topActions=document.querySelector('.top-actions');
  const help=document.createElement('button');
  help.id='howToPlayBtn';help.textContent='? How to Play';
  help.style.whiteSpace='nowrap';
  topActions?.prepend(help);

  const overlay=document.createElement('div');
  overlay.id='howToPlayOverlay';
  Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'99999',display:'none',alignItems:'center',justifyContent:'center',padding:'18px',background:'rgba(2,8,6,.86)',backdropFilter:'blur(10px)'});
  overlay.innerHTML=`
    <div style="width:min(760px,100%);max-height:92vh;overflow:auto;background:linear-gradient(160deg,#11241a,#07110d);border:1px solid #355846;border-radius:24px;padding:24px;box-shadow:0 28px 90px rgba(0,0,0,.55);color:#fff;font-family:system-ui,-apple-system,sans-serif">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
        <div><div style="font-size:11px;letter-spacing:.16em;font-weight:900;color:#dfff4d">ROAD TO GLORY</div><h2 style="font-size:30px;margin:5px 0 7px">How to Play</h2><p style="margin:0;color:#b9c9c0;line-height:1.5">Your controls now follow the camera, so the direction you push on the joystick matches the direction you see on screen.</p></div>
        <div style="font-size:36px">⚽</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:22px 0">
        <div style="padding:16px;border-radius:16px;background:#0b1912;border:1px solid #294437"><b style="color:#dfff4d">1 · MOVE</b><p style="margin:7px 0 0;color:#c8d5ce;line-height:1.45">Use the left joystick. Push up to move up the screen, left to go left, and so on. Small movements give you finer control.</p></div>
        <div style="padding:16px;border-radius:16px;background:#0b1912;border:1px solid #294437"><b style="color:#dfff4d">2 · SPRINT</b><p style="margin:7px 0 0;color:#c8d5ce;line-height:1.45">Hold <b>Sprint</b> while moving. Sprint is quicker but defenders have a slightly better chance of tackling you.</p></div>
        <div style="padding:16px;border-radius:16px;background:#0b1912;border:1px solid #294437"><b style="color:#dfff4d">3 · AIM & SHOOT</b><p style="margin:7px 0 0;color:#c8d5ce;line-height:1.45">Hold <b>Shoot</b>. A bright aiming line appears. Drag left or right to choose where in the goal you want to place it, drag upward for more power, then release to shoot.</p></div>
        <div style="padding:16px;border-radius:16px;background:#0b1912;border:1px solid #294437"><b style="color:#dfff4d">4 · PASS</b><p style="margin:7px 0 0;color:#c8d5ce;line-height:1.45">Tap <b>Pass</b> to play the ball towards a nearby teammate. Move before passing to open a better angle.</p></div>
        <div style="padding:16px;border-radius:16px;background:#0b1912;border:1px solid #294437"><b style="color:#dfff4d">5 · SKILLS</b><p style="margin:7px 0 0;color:#c8d5ce;line-height:1.45">Tap <b>Skill</b> near a defender for a step-over, body feint or roulette. Time it before the tackle arrives.</p></div>
        <div style="padding:16px;border-radius:16px;background:#0b1912;border:1px solid #294437"><b style="color:#dfff4d">6 · DEFEND</b><p style="margin:7px 0 0;color:#c8d5ce;line-height:1.45">When the opposition has the ball, get close and tap <b>Tackle</b>. Your keeper protects the goal behind you.</p></div>
      </div>
      <div style="padding:14px 16px;border-radius:14px;background:rgba(223,255,77,.08);border:1px solid rgba(223,255,77,.3);color:#e9f5df"><b>Career tip:</b> better match ratings, goals, assists, chances and dribbles earn development points. Spend them in the Career tab to improve your player.</div>
      <button id="closeHowToPlay" style="width:100%;margin-top:18px;padding:15px;border:0;border-radius:14px;background:#dfff4d;color:#07110d;font-weight:900;font-size:16px">Got it · Start Playing</button>
    </div>`;
  document.body.appendChild(overlay);

  function open(){overlay.style.display='flex';}
  function close(mark=true){overlay.style.display='none';if(mark)localStorage.setItem(KEY,'1');}
  help.onclick=open;
  overlay.querySelector('#closeHowToPlay').onclick=()=>close(true);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close(true);});

  function maybeShow(){if(localStorage.getItem(KEY)==='1')return;const career=document.getElementById('career');if(career&&!career.classList.contains('hidden'))open();}
  setTimeout(maybeShow,350);
  document.getElementById('startBtn')?.addEventListener('click',()=>setTimeout(maybeShow,250));
})();
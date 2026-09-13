(() => {
  const getMatch=()=>window.Career3DBridge?.getMatch?.()||window.match||null;
  const pitch=document.querySelector('.pitch-wrap');
  if(!pitch||document.getElementById('rtgQolBar'))return;

  const bar=document.createElement('div');bar.id='rtgQolBar';bar.className='rtg-qol-bar';
  bar.innerHTML='<button class="rtg-qol-btn" id="rtgCameraBtn">CAMERA</button><button class="rtg-qol-btn" id="rtgHelpBtn">?<span class="help-text"> HELP</span></button><button class="rtg-qol-btn" id="rtgPauseBtn">PAUSE</button>';
  pitch.appendChild(bar);

  const possession=document.createElement('div');possession.className='rtg-possession-pill';possession.textContent='KICK OFF';pitch.appendChild(possession);

  const overlay=document.createElement('div');overlay.className='rtg-qol-overlay hidden';overlay.id='rtgQolOverlay';
  overlay.innerHTML='<div class="rtg-qol-card"><h3 id="rtgOverlayTitle">Paused</h3><p id="rtgOverlayText">Match paused.</p><div id="rtgHelpGrid" class="rtg-help-grid" style="display:none"><div><b>Move</b><br>Left joystick</div><div><b>Sprint</b><br>Hold Sprint</div><div><b>Pass / Call</b><br>Tap Pass</div><div><b>Shoot</b><br>Hold, aim and release</div><div><b>Tackle</b><br>Use when defending</div><div><b>Camera</b><br>Tap CAMERA to cycle</div></div><div class="rtg-qol-actions"><button id="rtgResumeBtn">RESUME</button><button class="secondary" id="rtgOverlayCameraBtn">CHANGE CAMERA</button><button class="secondary" id="rtgCloseHelpBtn" style="display:none">CLOSE HELP</button></div></div>';
  pitch.appendChild(overlay);

  const pauseBtn=document.getElementById('rtgPauseBtn'),helpBtn=document.getElementById('rtgHelpBtn'),cameraBtn=document.getElementById('rtgCameraBtn'),resumeBtn=document.getElementById('rtgResumeBtn'),overlayCameraBtn=document.getElementById('rtgOverlayCameraBtn'),closeHelpBtn=document.getElementById('rtgCloseHelpBtn'),helpGrid=document.getElementById('rtgHelpGrid'),title=document.getElementById('rtgOverlayTitle'),text=document.getElementById('rtgOverlayText');
  let pausedByQol=false;

  function cycleCamera(){
    const sel=document.getElementById('cameraSelect');if(!sel)return;
    sel.selectedIndex=(sel.selectedIndex+1)%sel.options.length;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    cameraBtn.textContent=sel.value.toUpperCase().replace(' CAMERA','').slice(0,14);
  }

  function showPause(){
    const m=getMatch();if(!m?.running)return;
    pausedByQol=true;m.running=false;overlay.classList.remove('hidden');title.textContent='Paused';text.textContent='Take a break. Your match is frozen.';helpGrid.style.display='none';resumeBtn.style.display='block';overlayCameraBtn.style.display='block';closeHelpBtn.style.display='none';pauseBtn.textContent='RESUME';
  }
  function resume(){
    const m=getMatch();if(pausedByQol&&m){m.running=true;pausedByQol=false;}overlay.classList.add('hidden');pauseBtn.textContent='PAUSE';
  }
  function showHelp(){
    const m=getMatch();const wasRunning=!!m?.running;
    if(wasRunning){m.running=false;pausedByQol=true;}
    overlay.classList.remove('hidden');title.textContent='Quick Controls';text.textContent='Everything you need during a match.';helpGrid.style.display='grid';resumeBtn.style.display=wasRunning?'block':'none';overlayCameraBtn.style.display='block';closeHelpBtn.style.display=wasRunning?'none':'block';
  }

  pauseBtn.addEventListener('click',()=>pausedByQol?resume():showPause());
  resumeBtn.addEventListener('click',resume);helpBtn.addEventListener('click',showHelp);closeHelpBtn.addEventListener('click',()=>overlay.classList.add('hidden'));cameraBtn.addEventListener('click',cycleCamera);overlayCameraBtn.addEventListener('click',cycleCamera);

  document.addEventListener('visibilitychange',()=>{const m=getMatch();if(document.hidden&&m?.running)showPause();});

  const passBtn=document.getElementById('touchPass'),tackleBtn=document.getElementById('touchTackle');
  function refresh(){
    const m=getMatch();
    if(!m){possession.textContent='READY';return requestAnimationFrame(refresh);}
    const owner=m.ball?.owner;
    if(owner==='player'){possession.textContent='YOU HAVE THE BALL';if(passBtn)passBtn.textContent='PASS';if(tackleBtn)tackleBtn.style.opacity='.55';}
    else if(owner==='mate'){possession.textContent='TEAMMATE ON BALL';if(passBtn)passBtn.textContent='CALL';if(tackleBtn)tackleBtn.style.opacity='.55';}
    else if(owner==='foe'){possession.textContent='DEFENDING';if(passBtn)passBtn.textContent='PASS';if(tackleBtn)tackleBtn.style.opacity='1';}
    else{possession.textContent=m.running?'LOOSE BALL':'READY';if(passBtn)passBtn.textContent='PASS';if(tackleBtn)tackleBtn.style.opacity='.82';}
    requestAnimationFrame(refresh);
  }
  refresh();
})();
(() => {
  const bridge=()=>window.Career3DBridge||{};
  const wrap=document.querySelector('.pitch-wrap');
  if(!wrap||document.getElementById('shotAimGuide'))return;

  const guide=document.createElement('div');
  guide.id='shotAimGuide';
  Object.assign(guide.style,{position:'absolute',right:'18px',top:'50%',transform:'translateY(-50%)',zIndex:'26',width:'132px',padding:'10px',borderRadius:'14px',background:'rgba(13,31,58,.9)',color:'#fff',font:'800 11px system-ui',textAlign:'center',boxShadow:'0 8px 24px rgba(0,0,0,.28)',pointerEvents:'none',opacity:'0',transition:'opacity .12s'});
  guide.innerHTML=`<div style="font-size:9px;letter-spacing:.12em;color:#ffdf48;margin-bottom:6px">SHOT TARGET</div><div id="aimGoal" style="height:100px;border:3px solid #fff;border-bottom-width:5px;position:relative;background:linear-gradient(rgba(255,255,255,.05),rgba(255,255,255,.01));overflow:hidden"><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.22)"></div><div id="aimDot" style="position:absolute;left:50%;top:50%;width:22px;height:22px;border:3px solid #ffdf48;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 14px rgba(255,223,72,.9)"></div></div><div style="margin-top:7px">Power <b id="aimPowerText">68%</b></div><div style="height:7px;background:rgba(255,255,255,.18);border-radius:999px;overflow:hidden;margin-top:4px"><div id="aimPowerBar" style="height:100%;width:68%;background:#ffdf48"></div></div>`;
  wrap.appendChild(guide);
  const dot=guide.querySelector('#aimDot'),powerText=guide.querySelector('#aimPowerText'),powerBar=guide.querySelector('#aimPowerBar');

  function update(){
    requestAnimationFrame(update);
    const a=bridge().shotAim;
    if(!a?.active){guide.style.opacity='0';return;}
    guide.style.opacity='1';
    const offset=Math.max(-1,Math.min(1,a.offset||0));
    const power=Math.max(.48,Math.min(1,a.power||.68));
    // offset controls the vertical placement across the goal in gameplay coordinates.
    const y=50+offset*34;
    dot.style.top=`${y}%`;
    powerText.textContent=`${Math.round(power*100)}%`;
    powerBar.style.width=`${Math.round(power*100)}%`;
  }
  update();
})();
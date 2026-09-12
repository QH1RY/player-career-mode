import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/utils/SkeletonUtils.js';

const wrap=document.querySelector('.pitch-wrap'),legacyCanvas=document.getElementById('gameCanvas');
if(!wrap||!legacyCanvas)throw new Error('3D match container not found');
const bridge=()=>window.Career3DBridge||{},getMatch=()=>bridge().getMatch?.()||null;
legacyCanvas.style.opacity='0';legacyCanvas.style.pointerEvents='none';legacyCanvas.style.position='relative';legacyCanvas.style.zIndex='0';

const scene=new THREE.Scene();scene.background=new THREE.Color(0x91b9d8);scene.fog=new THREE.Fog(0x91b9d8,78,160);
const camera=new THREE.PerspectiveCamera(48,16/9,.1,260);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.id='threeGameCanvas';Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'1',borderRadius:'15px',touchAction:'none'});
wrap.insertBefore(renderer.domElement,document.getElementById('touchControls'));const touch=document.getElementById('touchControls');if(touch)touch.style.zIndex='5';

scene.add(new THREE.HemisphereLight(0xffffff,0x40603d,1.7));
const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(-32,54,26);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-72;sun.shadow.camera.right=72;sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;scene.add(sun);
const fill=new THREE.DirectionalLight(0xb9d7ff,.55);fill.position.set(35,18,-20);scene.add(fill);

const FIELD_L=105,FIELD_W=68;
const pitch=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L,FIELD_W),new THREE.MeshStandardMaterial({color:0x247943,roughness:.93}));pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);
for(let i=0;i<12;i++)if(i%2===0){const s=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L/12-.05,FIELD_W),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.024,depthWrite:false}));s.rotation.x=-Math.PI/2;s.position.set(-FIELD_L/2+(i+.5)*FIELD_L/12,.012,0);scene.add(s);}
const lineMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.92});
function line(points){scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.035,p[1]))),lineMat));}
line([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34],[-52.5,-34]]);line([[0,-34],[0,34]]);
function rectLine(x1,z1,x2,z2){line([[x1,z1],[x2,z1],[x2,z2],[x1,z2],[x1,z1]])}
rectLine(-52.5,-20.16,-36,20.16);rectLine(36,-20.16,52.5,20.16);rectLine(-52.5,-9.16,-47,9.16);rectLine(47,-9.16,52.5,9.16);
const cc=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;cc.push([Math.cos(a)*9.15,Math.sin(a)*9.15])}line(cc);

const standMat=new THREE.MeshStandardMaterial({color:0x253342,roughness:.84}),crowdMat=new THREE.MeshStandardMaterial({color:0x556674,roughness:.95});
function stand(x,z,w,d){const b=new THREE.Mesh(new THREE.BoxGeometry(w,7,d),standMat);b.position.set(x,3.5,z);scene.add(b);const c=new THREE.Mesh(new THREE.BoxGeometry(w*.96,2.4,d*.75),crowdMat);c.position.set(x,7.05,z);scene.add(c)}
stand(0,-43,112,12);stand(0,43,112,12);stand(-61,0,12,74);stand(61,0,12,74);
const boardMat=new THREE.MeshStandardMaterial({color:0x0c171e,emissive:0x06100b,emissiveIntensity:.5});
[[-54.5,0,.35,68],[54.5,0,.35,68],[0,-35.5,105,.35],[0,35.5,105,.35]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,1.05,d),boardMat);m.position.set(x,.525,z);scene.add(m)});
function buildGoal(x,dir){const g=new THREE.Group(),white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35}),pg=new THREE.CylinderGeometry(.07,.07,2.44,10),bg=new THREE.CylinderGeometry(.07,.07,7.32,10),p1=new THREE.Mesh(pg,white),p2=p1.clone(),bar=new THREE.Mesh(bg,white);p1.position.set(0,1.22,-3.66);p2.position.set(0,1.22,3.66);bar.rotation.x=Math.PI/2;bar.position.set(0,2.44,0);g.add(p1,p2,bar);const net=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.35,7.25,4,4,8),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.16}));net.position.set(dir*1.05,1.15,0);g.add(net);g.position.x=x;scene.add(g)}
buildGoal(-52.5,-1);buildGoal(52.5,1);

function makeFallback(team='home',hero=false,gk=false){
  const kit=gk?(team==='home'?0x25c4ff:0xffaa28):(team==='home'?(hero?0xdfff4d:0x42b7e9):0xd83d4f),skin=new THREE.MeshStandardMaterial({color:0xa87856,roughness:.74}),shirt=new THREE.MeshStandardMaterial({color:kit,roughness:.58}),dark=new THREE.MeshStandardMaterial({color:0x17222b,roughness:.7}),g=new THREE.Group();
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.68,6,10),shirt);torso.position.y=1.36;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),skin);head.position.y=2.06;head.castShadow=true;g.add(head);
  [-1,1].forEach(s=>{const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.54,5,8),skin);arm.position.set(s*.31,1.37,0);arm.rotation.z=s*.08;arm.castShadow=true;g.add(arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.74,5,8),dark);leg.position.set(s*.12,.52,0);leg.castShadow=true;g.add(leg);});
  return g;
}

const teamColour={home:0x49c6f2,away:0xe84b5c,hero:0xe2ff55,gkHome:0x31d2ff,gkAway:0xffae34};
function makeSlot(team='home',hero=false,gk=false,index=0){
  const root=new THREE.Group(),visual=new THREE.Group(),fallback=makeFallback(team,hero,gk);root.add(visual);visual.add(fallback);scene.add(root);
  const ring=new THREE.Mesh(new THREE.RingGeometry(hero?.52:.38,hero?.65:.46,36),new THREE.MeshBasicMaterial({color:hero?0xffffff:(gk?(team==='home'?teamColour.gkHome:teamColour.gkAway):(team==='home'?teamColour.home:teamColour.away)),side:THREE.DoubleSide,transparent:true,opacity:hero?.9:.34}));ring.rotation.x=-Math.PI/2;ring.position.y=.018;root.add(ring);
  return{root,visual,fallback,model:null,mixer:null,actions:{},current:'',prev:new THREE.Vector3(),initialised:false,team,hero,gk,index,lastOneShot:0,lastSkillType:''};
}

const heroSlot=makeSlot('home',true,false,0),mateSlots=Array.from({length:9},(_,i)=>makeSlot('home',false,false,i+1)),foeSlots=Array.from({length:10},(_,i)=>makeSlot('away',false,false,i)),homeGKSlot=makeSlot('home',false,true,0),awayGKSlot=makeSlot('away',false,true,1);
const allSlots=[heroSlot,...mateSlots,...foeSlots,homeGKSlot,awayGKSlot];

const MODEL_URLS=[
 'https://raw.githubusercontent.com/HisenseYin-renlab-ai/football-match-simulator/feature/agent-realtime-dashboard/backend/static/players/man1.glb',
 'https://raw.githubusercontent.com/HisenseYin-renlab-ai/football-match-simulator/feature/agent-realtime-dashboard/backend/static/players/man2.glb',
 'https://raw.githubusercontent.com/HisenseYin-renlab-ai/football-match-simulator/feature/agent-realtime-dashboard/backend/static/players/man3.glb',
 'https://raw.githubusercontent.com/HisenseYin-renlab-ai/football-match-simulator/feature/agent-realtime-dashboard/backend/static/players/man4.glb'
];
const loader=new GLTFLoader(),protos=[];
function clipBy(proto,needle){return proto.animations?.find(c=>c.name===needle||c.name.endsWith('|'+needle)||c.name.includes(needle))||null;}
function normaliseModel(model){
  model.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);const scale=size.y>0?1.82/size.y:1;model.scale.setScalar(scale);model.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(model);model.position.y-=box.min.y;model.rotation.y=Math.PI;
  model.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.castShadow=true;o.receiveShadow=false;if(o.material){o.material=o.material.clone();o.material.roughness=Math.max(.48,o.material.roughness??.65);}}});
}
function attachModel(slot,proto){
  try{
    const model=skeletonClone(proto.scene);normaliseModel(model);slot.visual.remove(slot.fallback);slot.visual.add(model);slot.model=model;slot.mixer=new THREE.AnimationMixer(model);
    const idle=clipBy(proto,'Man_Idle'),walk=clipBy(proto,'Man_Walk'),kick=clipBy(proto,'Man_Kick'),clap=clipBy(proto,'Man_Clapping');
    if(idle)slot.actions.idle=slot.mixer.clipAction(idle);if(walk)slot.actions.walk=slot.mixer.clipAction(walk);if(kick){slot.actions.kick=slot.mixer.clipAction(kick);slot.actions.kick.setLoop(THREE.LoopOnce,1);slot.actions.kick.clampWhenFinished=true;}if(clap)slot.actions.clap=slot.mixer.clipAction(clap);
    if(slot.actions.idle){slot.actions.idle.play();slot.current='idle';}
  }catch(e){console.warn('Player model attach failed',e);}
}
async function loadHumans(){
  const loaded=await Promise.all(MODEL_URLS.map(async u=>{try{return await loader.loadAsync(u)}catch(e){console.warn('Human model failed',u,e);return null}}));protos.push(...loaded.filter(Boolean));
  if(!protos.length)return;allSlots.forEach((slot,i)=>attachModel(slot,protos[i%protos.length]));
  const badge=document.getElementById('renderBadge');if(badge)badge.textContent='RIGGED HUMAN PLAYERS';
}
loadHumans();

const ball=new THREE.Mesh(new THREE.SphereGeometry(.22,20,16),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.38}));ball.castShadow=true;scene.add(ball);
const aimGeom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),aimLine=new THREE.Line(aimGeom,new THREE.LineBasicMaterial({color:0xeaff76,transparent:true,opacity:.92}));aimLine.visible=false;scene.add(aimLine);
const aimTarget=new THREE.Mesh(new THREE.TorusGeometry(.42,.055,8,28),new THREE.MeshBasicMaterial({color:0xeaff76,transparent:true,opacity:.95}));aimTarget.rotation.y=Math.PI/2;aimTarget.visible=false;scene.add(aimTarget);

function worldPos(p){return new THREE.Vector3((p.x/1100-.5)*FIELD_L,0,(p.y/620-.5)*FIELD_W)}
function stateYToZ(y){return(y/620-.5)*FIELD_W}
function angleLerp(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI;return a+d*t;}
function fadeTo(slot,name,duration=.14,timeScale=1){
  if(!slot.mixer||!slot.actions[name]||slot.current===name){if(slot.actions[name])slot.actions[name].timeScale=timeScale;return;}
  const next=slot.actions[name],prev=slot.actions[slot.current];next.enabled=true;next.reset();next.timeScale=timeScale;next.fadeIn(duration).play();if(prev)prev.fadeOut(duration);slot.current=name;
}
function oneShot(slot,name,stamp){
  if(!slot.mixer||!slot.actions[name]||slot.lastOneShot===stamp)return;slot.lastOneShot=stamp;const act=slot.actions[name];act.reset();act.enabled=true;act.setLoop(THREE.LoopOnce,1);act.clampWhenFinished=true;act.fadeIn(.08).play();const base=slot.actions[slot.current];if(base&&base!==act)base.fadeOut(.08);setTimeout(()=>{if(slot.actions.idle){act.fadeOut(.12);slot.actions.idle.reset().fadeIn(.12).play();slot.current='idle';}},420);
}
function animateFallback(slot,speed,dt){
  if(slot.model)return;const t=performance.now()*.008,children=slot.fallback.children;if(children[2]&&children[3]){children[2].rotation.x=Math.sin(t)*.32*Math.min(1,speed/4);children[3].rotation.x=-Math.sin(t)*.32*Math.min(1,speed/4);}slot.fallback.position.y=Math.sin(t*2)*.015*Math.min(1,speed/4);
}
function skillVisual(slot){
  if(!slot.hero)return;const s=bridge().skillAction;
  slot.visual.rotation.set(0,0,0);slot.visual.position.set(0,0,0);
  if(!s?.active)return;const t=clamp(s.progress??((performance.now()-s.start)/s.duration),0,1);
  if(s.type==='roulette')slot.visual.rotation.y=t*Math.PI*2;
  else if(s.type==='bodyFeint')slot.visual.rotation.z=Math.sin(Math.PI*t)*.20;
  else if(s.type==='stepover'){slot.visual.rotation.z=Math.sin(t*Math.PI*2)*.07;slot.visual.position.y=Math.sin(Math.PI*t)*.035;}
}
function syncSlot(slot,p,dt){
  if(!slot||!p)return;const target=worldPos(p);
  if(!slot.initialised){slot.prev.copy(target);slot.root.position.copy(target);slot.initialised=true;}
  const dx=target.x-slot.prev.x,dz=target.z-slot.prev.z,speed=Math.hypot(dx,dz)/Math.max(dt,.001);
  slot.root.position.x=THREE.MathUtils.lerp(slot.root.position.x,target.x,.72);slot.root.position.z=THREE.MathUtils.lerp(slot.root.position.z,target.z,.72);
  if(Math.hypot(dx,dz)>.003){const yaw=Math.atan2(dx,dz);slot.root.rotation.y=angleLerp(slot.root.rotation.y,yaw,.24);}
  const playerAction=slot.hero?bridge().playerAction:null;
  if(playerAction?.active&&performance.now()-playerAction.start<(playerAction.duration||500)&&(playerAction.type==='shoot'||playerAction.type==='pass'||playerAction.type==='freeKick'))oneShot(slot,'kick',playerAction.start);
  else if(speed>1.2)fadeTo(slot,'walk',.12,clamp(.8+speed/5,.8,1.65));else fadeTo(slot,'idle',.18,1);
  if(slot.mixer)slot.mixer.update(dt);animateFallback(slot,speed,dt);skillVisual(slot);slot.prev.copy(target);
}

function cameraFollow(m){
  const hp=worldPos(m.player),mode=document.getElementById('cameraSelect')?.value||'Player Follow';let desired,look;
  if(mode==='Broadcast Lock'){desired=new THREE.Vector3(hp.x-1,25,hp.z+32);look=new THREE.Vector3(hp.x+8,0,hp.z)}
  else if(mode==='Shoulder'){desired=new THREE.Vector3(hp.x-5.2,3.2,hp.z+1.7);look=new THREE.Vector3(hp.x+8,1.1,hp.z)}
  else if(mode==='Pro Camera'){desired=new THREE.Vector3(hp.x-9.2,5.2,hp.z+1.0);look=new THREE.Vector3(hp.x+11,1.0,hp.z)}
  else{desired=new THREE.Vector3(hp.x-13.5,9.2,hp.z+6.5);look=new THREE.Vector3(hp.x+9,.8,hp.z)}
  camera.position.lerp(desired,.07);camera.lookAt(look);const dir=new THREE.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();bridge().cameraBasis={fx:dir.x,fz:dir.z,rx:-dir.z,rz:dir.x};
}
function updateAim(m){
  const a=bridge().shotAim;if(!a?.active||m.ball?.owner!=='player'){aimLine.visible=false;aimTarget.visible=false;return;}
  const p=worldPos(m.player),targetY=310+(a.offset||0)*((372-248)*.43),target=new THREE.Vector3(52.2,.38,stateYToZ(targetY));aimTarget.position.copy(target);aimLine.visible=aimTarget.visible=true;
  const arr=aimLine.geometry.attributes.position.array;arr[0]=p.x;arr[1]=.35;arr[2]=p.z;arr[3]=target.x;arr[4]=target.y;arr[5]=target.z;aimLine.geometry.attributes.position.needsUpdate=true;aimLine.material.opacity=.42+.52*(a.power||.7);aimTarget.scale.setScalar(.8+.45*(a.power||.7));
}
function resize(){const r=wrap.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(wrap);resize();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(.04,clock.getDelta()),m=getMatch();
  if(m){
    syncSlot(heroSlot,m.player,dt);for(let i=0;i<mateSlots.length;i++)syncSlot(mateSlots[i],m.mates?.[i]||{x:190+(i%3)*110,y:90+Math.floor(i/3)*180},dt);for(let i=0;i<foeSlots.length;i++)syncSlot(foeSlots[i],m.foes?.[i]||{x:650+(i%4)*105,y:70+(i%5)*110},dt);syncSlot(homeGKSlot,m.homeKeeper||{x:54,y:310},dt);syncSlot(awayGKSlot,m.awayKeeper||m.keeper||{x:1046,y:310},dt);
    if(m.ball){const bp=worldPos(m.ball),fk=bridge().freeKickFlight;ball.position.set(bp.x,.22+(fk?.active?(fk.height||0):0),bp.z);ball.rotation.z+=((m.ball.vx||0)*dt)*.3;ball.rotation.x+=((m.ball.vy||0)*dt)*.3;}
    cameraFollow(m);updateAim(m);
  }else{camera.position.lerp(new THREE.Vector3(-32,22,31),.03);camera.lookAt(0,0,0)}
  renderer.render(scene,camera);
}
animate();

const badge=document.createElement('div');badge.id='renderBadge';badge.textContent='LOADING HUMAN PLAYERS…';Object.assign(badge.style,{position:'absolute',left:'12px',top:'12px',zIndex:'4',padding:'6px 9px',borderRadius:'999px',background:'rgba(4,12,8,.72)',color:'#dfff4d',font:'800 9px system-ui',letterSpacing:'.08em',pointerEvents:'none'});wrap.appendChild(badge);
bridge().rendererVersion='human-rig-v1';
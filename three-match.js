import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const wrap=document.querySelector('.pitch-wrap');
const legacyCanvas=document.getElementById('gameCanvas');
if(!wrap||!legacyCanvas)throw new Error('3D match container not found');

const bridge=()=>window.Career3DBridge||{};
const getMatch=()=>bridge().getMatch?.()||null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

legacyCanvas.style.opacity='0';
legacyCanvas.style.pointerEvents='none';
legacyCanvas.style.position='relative';
legacyCanvas.style.zIndex='0';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fbbe0);
scene.fog=new THREE.Fog(0x8fbbe0,80,165);

const camera=new THREE.PerspectiveCamera(48,16/9,.1,260);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.id='threeGameCanvas';
Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'1',borderRadius:'15px',touchAction:'none'});
wrap.insertBefore(renderer.domElement,document.getElementById('touchControls'));
const touch=document.getElementById('touchControls');
if(touch)touch.style.zIndex='5';

scene.add(new THREE.HemisphereLight(0xffffff,0x345438,1.75));
const sun=new THREE.DirectionalLight(0xffffff,2.55);
sun.position.set(-32,52,28);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-72;
sun.shadow.camera.right=72;
sun.shadow.camera.top=48;
sun.shadow.camera.bottom=-48;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xb9d7ff,.5);
fill.position.set(36,18,-24);
scene.add(fill);

const FIELD_L=105,FIELD_W=68;
const pitch=new THREE.Mesh(
  new THREE.PlaneGeometry(FIELD_L,FIELD_W),
  new THREE.MeshStandardMaterial({color:0x247943,roughness:.93})
);
pitch.rotation.x=-Math.PI/2;
pitch.receiveShadow=true;
scene.add(pitch);

for(let i=0;i<12;i++)if(i%2===0){
  const s=new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD_L/12-.05,FIELD_W),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.024,depthWrite:false})
  );
  s.rotation.x=-Math.PI/2;
  s.position.set(-FIELD_L/2+(i+.5)*FIELD_L/12,.012,0);
  scene.add(s);
}

const lineMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.92});
function line(points){
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.035,p[1]))),
    lineMat
  ));
}
line([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34],[-52.5,-34]]);
line([[0,-34],[0,34]]);
function rectLine(x1,z1,x2,z2){line([[x1,z1],[x2,z1],[x2,z2],[x1,z2],[x1,z1]])}
rectLine(-52.5,-20.16,-36,20.16);
rectLine(36,-20.16,52.5,20.16);
rectLine(-52.5,-9.16,-47,9.16);
rectLine(47,-9.16,52.5,9.16);
const cc=[];
for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;cc.push([Math.cos(a)*9.15,Math.sin(a)*9.15])}
line(cc);

const standMat=new THREE.MeshStandardMaterial({color:0x253342,roughness:.84});
const crowdMat=new THREE.MeshStandardMaterial({color:0x556674,roughness:.95});
function stand(x,z,w,d){
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,7,d),standMat);
  b.position.set(x,3.5,z);scene.add(b);
  const c=new THREE.Mesh(new THREE.BoxGeometry(w*.96,2.4,d*.75),crowdMat);
  c.position.set(x,7.05,z);scene.add(c);
}
stand(0,-43,112,12);stand(0,43,112,12);stand(-61,0,12,74);stand(61,0,12,74);

const boardMat=new THREE.MeshStandardMaterial({color:0x0c171e,emissive:0x06100b,emissiveIntensity:.5});
[[-54.5,0,.35,68],[54.5,0,.35,68],[0,-35.5,105,.35],[0,35.5,105,.35]].forEach(([x,z,w,d])=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,1.05,d),boardMat);
  m.position.set(x,.525,z);scene.add(m);
});

function buildGoal(x,dir){
  const g=new THREE.Group();
  const white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35});
  const pg=new THREE.CylinderGeometry(.07,.07,2.44,12);
  const bg=new THREE.CylinderGeometry(.07,.07,7.32,12);
  const p1=new THREE.Mesh(pg,white),p2=p1.clone(),bar=new THREE.Mesh(bg,white);
  p1.position.set(0,1.22,-3.66);p2.position.set(0,1.22,3.66);
  bar.rotation.x=Math.PI/2;bar.position.set(0,2.44,0);
  g.add(p1,p2,bar);
  const net=new THREE.Mesh(
    new THREE.BoxGeometry(2.2,2.35,7.25,4,4,8),
    new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.16})
  );
  net.position.set(dir*1.05,1.15,0);g.add(net);g.position.x=x;scene.add(g);
}
buildGoal(-52.5,-1);buildGoal(52.5,1);

function capsule(mat,r,len,seg=10){
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.03,len-r*2),8,seg),mat);
  m.castShadow=true;
  return m;
}

function makeSmoothHuman(team='home',hero=false,gk=false,index=0){
  const kit=gk?(team==='home'?0x25c4ff:0xffaa28):(team==='home'?(hero?0xdfff4d:0x42b7e9):0xd83d4f);
  const shorts=team==='home'?0x102b3a:0x701929;
  const skinTones=[0x6f442d,0x8b5a3c,0xa97855,0xc48e68,0x855439];
  const skin=new THREE.MeshStandardMaterial({color:skinTones[index%skinTones.length],roughness:.7});
  const shirt=new THREE.MeshStandardMaterial({color:kit,roughness:.54});
  const shortsMat=new THREE.MeshStandardMaterial({color:gk?kit:shorts,roughness:.64});
  const socks=new THREE.MeshStandardMaterial({color:kit,roughness:.64});
  const boots=new THREE.MeshStandardMaterial({color:0x101010,roughness:.34});
  const hair=new THREE.MeshStandardMaterial({color:0x17120f,roughness:.86});

  const root=new THREE.Group();
  const body=new THREE.Group();
  root.add(body);

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.255,.66,10,16),shirt);
  torso.scale.set(1.12,1,.78);torso.position.y=1.48;torso.castShadow=true;body.add(torso);

  const chest=new THREE.Mesh(new THREE.SphereGeometry(.31,24,18),shirt);
  chest.scale.set(1.08,.72,.78);chest.position.y=1.72;chest.castShadow=true;body.add(chest);

  const waist=new THREE.Mesh(new THREE.CapsuleGeometry(.205,.24,8,14),shirt);
  waist.scale.set(1.04,1,.78);waist.position.y=1.06;body.add(waist);

  const shortsMesh=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.22,8,14),shortsMat);
  shortsMesh.scale.set(1.08,.82,.82);shortsMesh.position.y=.87;shortsMesh.castShadow=true;body.add(shortsMesh);

  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.085,.10,.16,14),skin);
  neck.position.y=2.08;body.add(neck);

  const head=new THREE.Mesh(new THREE.SphereGeometry(.195,26,20),skin);
  head.scale.set(.9,1.08,.92);head.position.y=2.285;head.castShadow=true;body.add(head);

  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.202,24,16,0,Math.PI*2,0,Math.PI*.5),hair);
  hairCap.position.y=2.35;body.add(hairCap);

  function makeArm(side){
    const shoulder=new THREE.Group();shoulder.position.set(side*.34,1.73,0);
    const shoulderJoint=new THREE.Mesh(new THREE.SphereGeometry(.082,14,10),shirt);shoulder.add(shoulderJoint);
    const upper=capsule(shirt,.067,.52,12);upper.position.y=-.25;shoulder.add(upper);
    const elbow=new THREE.Group();elbow.position.y=-.51;
    const elbowJoint=new THREE.Mesh(new THREE.SphereGeometry(.067,12,10),skin);elbow.add(elbowJoint);
    const lower=capsule(skin,.058,.48,12);lower.position.y=-.23;elbow.add(lower);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),skin);hand.scale.y=1.15;hand.position.y=-.48;elbow.add(hand);
    shoulder.add(elbow);body.add(shoulder);
    return{shoulder,elbow};
  }

  function makeLeg(side){
    const hip=new THREE.Group();hip.position.set(side*.14,.78,0);
    const hipJoint=new THREE.Mesh(new THREE.SphereGeometry(.095,14,10),shortsMat);hip.add(hipJoint);
    const upper=capsule(skin,.09,.68,12);upper.position.y=-.32;hip.add(upper);
    const knee=new THREE.Group();knee.position.y=-.64;
    const kneeJoint=new THREE.Mesh(new THREE.SphereGeometry(.082,12,10),skin);knee.add(kneeJoint);
    const lower=capsule(socks,.073,.66,12);lower.position.y=-.31;knee.add(lower);
    const boot=new THREE.Mesh(new THREE.CapsuleGeometry(.082,.20,6,10),boots);
    boot.rotation.x=Math.PI/2;boot.scale.set(1,.72,1.35);boot.position.set(0,-.66,.13);boot.castShadow=true;knee.add(boot);
    hip.add(knee);body.add(hip);
    return{hip,knee};
  }

  const la=makeArm(-1),ra=makeArm(1),ll=makeLeg(-1),rl=makeLeg(1);

  const ringInner=hero?.52:.38;
  const ringOuter=hero?.66:.46;
  const ringOpacity=hero?.92:.28;
  const ringColour=hero?0xffffff:(gk?(team==='home'?0x31d2ff:0xffae34):(team==='home'?0x49c6f2:0xe84b5c));
  const ring=new THREE.Mesh(new THREE.RingGeometry(ringInner,ringOuter,40),new THREE.MeshBasicMaterial({color:ringColour,side:THREE.DoubleSide,transparent:true,opacity:ringOpacity}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.018;root.add(ring);

  root.userData={
    prev:new THREE.Vector3(),initialised:false,
    body,parts:{la,ra,ll,rl,torso,chest,head},
    hero,team,gk,index,lastYaw:0
  };
  scene.add(root);
  return root;
}

const hero3D=makeSmoothHuman('home',true,false,0);
const mates3D=Array.from({length:9},(_,i)=>makeSmoothHuman('home',false,false,i+1));
const foes3D=Array.from({length:10},(_,i)=>makeSmoothHuman('away',false,false,i));
const homeGK=makeSmoothHuman('home',false,true,0);
const awayGK=makeSmoothHuman('away',false,true,1);

const ball=new THREE.Mesh(new THREE.SphereGeometry(.22,24,18),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.38}));
ball.castShadow=true;scene.add(ball);

const aimGeom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
const aimLine=new THREE.Line(aimGeom,new THREE.LineBasicMaterial({color:0xeaff76,transparent:true,opacity:.92}));
aimLine.visible=false;scene.add(aimLine);
const aimTarget=new THREE.Mesh(new THREE.TorusGeometry(.42,.055,10,32),new THREE.MeshBasicMaterial({color:0xeaff76,transparent:true,opacity:.95}));
aimTarget.rotation.y=Math.PI/2;aimTarget.visible=false;scene.add(aimTarget);

function worldPos(p){return new THREE.Vector3((p.x/1100-.5)*FIELD_L,0,(p.y/620-.5)*FIELD_W)}
function stateYToZ(y){return(y/620-.5)*FIELD_W}
function angleLerp(a,b,t){
  let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI;
  if(d<-Math.PI)d+=Math.PI*2;
  return a+d*t;
}

function animateBody(obj,speed,dt){
  const u=obj.userData,parts=u.parts;
  const run=clamp(speed/5.8,0,1);
  const phase=performance.now()*.009*(.85+run*.8)+(u.index||0)*.45;
  const swing=Math.sin(phase)*.55*run;

  parts.ll.hip.rotation.x=THREE.MathUtils.lerp(parts.ll.hip.rotation.x,swing,.28);
  parts.rl.hip.rotation.x=THREE.MathUtils.lerp(parts.rl.hip.rotation.x,-swing,.28);
  parts.la.shoulder.rotation.x=THREE.MathUtils.lerp(parts.la.shoulder.rotation.x,-swing*.68,.26);
  parts.ra.shoulder.rotation.x=THREE.MathUtils.lerp(parts.ra.shoulder.rotation.x,swing*.68,.26);
  parts.ll.knee.rotation.x=THREE.MathUtils.lerp(parts.ll.knee.rotation.x,Math.max(0,-Math.sin(phase))*.48*run,.25);
  parts.rl.knee.rotation.x=THREE.MathUtils.lerp(parts.rl.knee.rotation.x,Math.max(0,Math.sin(phase))*.48*run,.25);
  parts.la.elbow.rotation.x=THREE.MathUtils.lerp(parts.la.elbow.rotation.x,-.18*run,.2);
  parts.ra.elbow.rotation.x=THREE.MathUtils.lerp(parts.ra.elbow.rotation.x,-.18*run,.2);
  parts.torso.rotation.z=Math.sin(phase*2)*.018*run;
  parts.chest.rotation.y=Math.sin(phase)*.028*run;
  u.body.position.y=Math.abs(Math.sin(phase))*0.025*run;

  if(u.hero){
    const a=bridge().playerAction;
    const now=performance.now();
    if(a?.active&&now-a.start<(a.duration||500)){
      const t=clamp((now-a.start)/(a.duration||500),0,1);
      if(a.type==='shoot'||a.type==='pass'||a.type==='freeKick'){
        parts.rl.hip.rotation.x=-Math.sin(Math.PI*t)*1.05;
        parts.rl.knee.rotation.x=Math.sin(Math.PI*t)*.55;
        parts.la.shoulder.rotation.x=.35*Math.sin(Math.PI*t);
        parts.ra.shoulder.rotation.x=-.35*Math.sin(Math.PI*t);
      }
      if(a.type==='tackle')u.body.rotation.z=Math.sin(Math.PI*t)*.16;
    }else u.body.rotation.z=THREE.MathUtils.lerp(u.body.rotation.z,0,.2);

    const s=bridge().skillAction;
    if(s?.active){
      const t=clamp((now-s.start)/(s.duration||600),0,1);
      if(s.type==='roulette')u.body.rotation.y=t*Math.PI*2;
      else if(s.type==='bodyFeint')u.body.rotation.z=Math.sin(Math.PI*t)*.2;
      else if(s.type==='stepover'){
        parts.rl.hip.rotation.x=Math.sin(t*Math.PI*2)*.5;
        u.body.rotation.z=Math.sin(t*Math.PI*2)*.06;
      }
    }else u.body.rotation.y=THREE.MathUtils.lerp(u.body.rotation.y,0,.18);
  }
}

function syncHuman(obj,p,dt){
  if(!obj||!p)return;
  const target=worldPos(p),u=obj.userData;
  if(!u.initialised){u.prev.copy(target);obj.position.copy(target);u.initialised=true;}
  const dx=target.x-u.prev.x,dz=target.z-u.prev.z;
  const speed=Math.hypot(dx,dz)/Math.max(dt,.001);

  const posEase=1-Math.pow(.001,dt);
  obj.position.x=THREE.MathUtils.lerp(obj.position.x,target.x,clamp(posEase*.9,.18,.78));
  obj.position.z=THREE.MathUtils.lerp(obj.position.z,target.z,clamp(posEase*.9,.18,.78));

  if(Math.hypot(dx,dz)>.002){
    const yaw=Math.atan2(dx,dz);
    obj.rotation.y=angleLerp(obj.rotation.y,yaw,clamp(dt*8.5,.08,.34));
  }

  animateBody(obj,speed,dt);
  u.prev.copy(target);
}

function cameraFollow(m){
  const hp=worldPos(m.player),mode=document.getElementById('cameraSelect')?.value||'Player Follow';
  let desired,look;
  if(mode==='Broadcast Lock'){
    desired=new THREE.Vector3(hp.x-1,25,hp.z+32);look=new THREE.Vector3(hp.x+8,0,hp.z);
  }else if(mode==='Shoulder'){
    desired=new THREE.Vector3(hp.x-5.2,3.2,hp.z+1.7);look=new THREE.Vector3(hp.x+8,1.1,hp.z);
  }else if(mode==='Pro Camera'){
    desired=new THREE.Vector3(hp.x-9.2,5.2,hp.z+1);look=new THREE.Vector3(hp.x+11,1,hp.z);
  }else{
    desired=new THREE.Vector3(hp.x-13.5,9.2,hp.z+6.5);look=new THREE.Vector3(hp.x+9,.8,hp.z);
  }
  camera.position.lerp(desired,.07);
  camera.lookAt(look);
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();
  bridge().cameraBasis={fx:dir.x,fz:dir.z,rx:-dir.z,rz:dir.x};
}

function updateAim(m){
  const a=bridge().shotAim;
  if(!a?.active||m.ball?.owner!=='player'){aimLine.visible=false;aimTarget.visible=false;return;}
  const p=worldPos(m.player),targetY=310+(a.offset||0)*((372-248)*.43),target=new THREE.Vector3(52.2,.38,stateYToZ(targetY));
  aimTarget.position.copy(target);aimLine.visible=aimTarget.visible=true;
  const arr=aimLine.geometry.attributes.position.array;
  arr[0]=p.x;arr[1]=.35;arr[2]=p.z;arr[3]=target.x;arr[4]=target.y;arr[5]=target.z;
  aimLine.geometry.attributes.position.needsUpdate=true;
  aimLine.material.opacity=.42+.52*(a.power||.7);
  aimTarget.scale.setScalar(.8+.45*(a.power||.7));
}

function resize(){
  const r=wrap.getBoundingClientRect();
  renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);
  camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap);resize();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.04,clock.getDelta()),m=getMatch();
  if(m){
    syncHuman(hero3D,m.player,dt);
    for(let i=0;i<mates3D.length;i++)syncHuman(mates3D[i],m.mates?.[i]||{x:190+(i%3)*110,y:90+Math.floor(i/3)*180},dt);
    for(let i=0;i<foes3D.length;i++)syncHuman(foes3D[i],m.foes?.[i]||{x:650+(i%4)*105,y:70+(i%5)*110},dt);
    syncHuman(homeGK,m.homeKeeper||{x:54,y:310},dt);
    syncHuman(awayGK,m.awayKeeper||m.keeper||{x:1046,y:310},dt);

    if(m.ball){
      const bp=worldPos(m.ball),fk=bridge().freeKickFlight;
      ball.position.set(bp.x,.22+(fk?.active?(fk.height||0):0),bp.z);
      ball.rotation.z+=((m.ball.vx||0)*dt)*.3;
      ball.rotation.x+=((m.ball.vy||0)*dt)*.3;
    }
    cameraFollow(m);updateAim(m);
  }else{
    camera.position.lerp(new THREE.Vector3(-32,22,31),.03);camera.lookAt(0,0,0);
  }
  renderer.render(scene,camera);
}
animate();

const badge=document.createElement('div');
badge.id='renderBadge';badge.textContent='SMOOTH 3D PLAYERS · BUILD 40';
Object.assign(badge.style,{position:'absolute',left:'12px',top:'12px',zIndex:'4',padding:'6px 9px',borderRadius:'999px',background:'rgba(4,12,8,.72)',color:'#dfff4d',font:'800 9px system-ui',letterSpacing:'.08em',pointerEvents:'none'});
wrap.appendChild(badge);
bridge().rendererVersion='smooth-3d-v2';

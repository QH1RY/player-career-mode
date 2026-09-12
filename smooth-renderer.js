import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const wrap=document.querySelector('.pitch-wrap');
if(!wrap) throw new Error('Pitch container missing');
const bridge=()=>window.Career3DBridge||{};
const getMatch=()=>bridge().getMatch?.()||null;

// Hide the older renderer once the smoother renderer is ready.
const old=document.getElementById('threeGameCanvas');
if(old) old.style.display='none';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fb9da);
scene.fog=new THREE.Fog(0x8fb9da,78,165);

const camera=new THREE.PerspectiveCamera(48,16/9,.1,260);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.3));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.id='smoothThreeCanvas';
Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'2',borderRadius:'15px',touchAction:'none'});
wrap.insertBefore(renderer.domElement,document.getElementById('touchControls'));
const touch=document.getElementById('touchControls');if(touch)touch.style.zIndex='6';

scene.add(new THREE.HemisphereLight(0xffffff,0x45653f,1.65));
const sun=new THREE.DirectionalLight(0xffffff,2.45);sun.position.set(-34,54,24);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-72;sun.shadow.camera.right=72;sun.shadow.camera.top=48;sun.shadow.camera.bottom=-48;scene.add(sun);
const fill=new THREE.DirectionalLight(0xc7dcff,.48);fill.position.set(30,16,-22);scene.add(fill);

const FIELD_L=105,FIELD_W=68;
const pitch=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L,FIELD_W),new THREE.MeshStandardMaterial({color:0x267d45,roughness:.95}));pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);
for(let i=0;i<12;i++) if(i%2===0){const s=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L/12-.05,FIELD_W),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.025,depthWrite:false}));s.rotation.x=-Math.PI/2;s.position.set(-FIELD_L/2+(i+.5)*FIELD_L/12,.012,0);scene.add(s);}
const lineMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.94});
function line(points){scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.035,p[1]))),lineMat));}
line([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34],[-52.5,-34]]);line([[0,-34],[0,34]]);
function rect(x1,z1,x2,z2){line([[x1,z1],[x2,z1],[x2,z2],[x1,z2],[x1,z1]])}
rect(-52.5,-20.16,-36,20.16);rect(36,-20.16,52.5,20.16);rect(-52.5,-9.16,-47,9.16);rect(47,-9.16,52.5,9.16);
const circ=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;circ.push([Math.cos(a)*9.15,Math.sin(a)*9.15])}line(circ);

function stand(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,8,d),new THREE.MeshStandardMaterial({color:0x2b3945,roughness:.9}));m.position.set(x,4,z);scene.add(m);}
stand(0,-43,112,12);stand(0,43,112,12);stand(-61,0,12,74);stand(61,0,12,74);

function goal(x,dir){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.32});const postGeo=new THREE.CylinderGeometry(.07,.07,2.44,12),barGeo=new THREE.CylinderGeometry(.07,.07,7.32,12);const p1=new THREE.Mesh(postGeo,mat),p2=p1.clone(),bar=new THREE.Mesh(barGeo,mat);p1.position.set(0,1.22,-3.66);p2.position.set(0,1.22,3.66);bar.rotation.x=Math.PI/2;bar.position.set(0,2.44,0);g.add(p1,p2,bar);const net=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.35,7.25,5,5,10),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.14}));net.position.set(dir*1.05,1.15,0);g.add(net);g.position.x=x;scene.add(g)}
goal(-52.5,-1);goal(52.5,1);

function capsule(r,len,mat,segments=10){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.04,len-r*2),8,segments),mat);m.castShadow=true;return m;}
function smoothHuman(team='home',hero=false,gk=false,variant=0){
  const kit=gk?(team==='home'?0x26cfff:0xffa92e):(team==='home'?(hero?0xdfff4d:0x40b8ec):0xdf4356);
  const skinTones=[0x8e5c40,0xa96f4d,0x6d422f,0xc88c64];
  const skin=new THREE.MeshStandardMaterial({color:skinTones[variant%skinTones.length],roughness:.68});
  const shirt=new THREE.MeshStandardMaterial({color:kit,roughness:.5});
  const shorts=new THREE.MeshStandardMaterial({color:team==='home'?0x132d3c:0x691d29,roughness:.62});
  const socks=new THREE.MeshStandardMaterial({color:kit,roughness:.66});
  const boots=new THREE.MeshStandardMaterial({color:variant%2?0xf1f1f1:0x101010,roughness:.32});
  const hair=new THREE.MeshStandardMaterial({color:variant%3===0?0x17110f:0x2b1a13,roughness:.86});
  const root=new THREE.Group();const body=new THREE.Group();root.add(body);

  // Rounded athletic torso, tapered waist and shorts.
  const chest=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.50,10,18),shirt);chest.scale.set(1.05,1,.72);chest.position.y=1.55;chest.castShadow=true;body.add(chest);
  const waist=new THREE.Mesh(new THREE.CapsuleGeometry(.21,.25,8,16),shirt);waist.scale.z=.74;waist.position.y=1.08;body.add(waist);
  const shortsMesh=new THREE.Mesh(new THREE.CapsuleGeometry(.245,.18,8,16),shorts);shortsMesh.scale.set(1.08,.9,.78);shortsMesh.position.y=.88;shortsMesh.castShadow=true;body.add(shortsMesh);

  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.085,.10,.15,16),skin);neck.position.y=2.01;body.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.19,24,18),skin);head.scale.set(.88,1.08,.92);head.position.y=2.20;head.castShadow=true;body.add(head);
  const hairMesh=new THREE.Mesh(new THREE.SphereGeometry(.195,22,14,0,Math.PI*2,0,Math.PI*.46),hair);hairMesh.scale.set(.91,.85,.94);hairMesh.position.y=2.285;body.add(hairMesh);

  function arm(side){const shoulder=new THREE.Group();shoulder.position.set(side*.32,1.72,0);const upper=capsule(.07,.55,shirt,12);upper.position.y=-.255;shoulder.add(upper);const elbow=new THREE.Group();elbow.position.y=-.50;const lower=capsule(.062,.50,skin,12);lower.position.y=-.23;elbow.add(lower);const hand=new THREE.Mesh(new THREE.SphereGeometry(.075,14,10),skin);hand.scale.set(.85,1.05,.75);hand.position.y=-.49;elbow.add(hand);shoulder.add(elbow);body.add(shoulder);return{shoulder,elbow};}
  function leg(side){const hip=new THREE.Group();hip.position.set(side*.125,.76,0);const thigh=capsule(.09,.68,skin,12);thigh.position.y=-.31;hip.add(thigh);const knee=new THREE.Group();knee.position.y=-.62;const shin=capsule(.075,.63,socks,12);shin.position.y=-.29;knee.add(shin);const boot=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.22,6,12),boots);boot.rotation.x=Math.PI/2;boot.position.set(0,-.62,.09);boot.scale.set(1,.72,1.18);boot.castShadow=true;knee.add(boot);hip.add(knee);body.add(hip);return{hip,knee};}
  const la=arm(-1),ra=arm(1),ll=leg(-1),rl=leg(1);

  if(hero){const ring=new THREE.Mesh(new THREE.RingGeometry(.50,.62,48),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.92}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;root.add(ring);}
  root.userData={body,la,ra,ll,rl,prev:new THREE.Vector3(),initialised:false,speed:0,phase:variant*.7};
  scene.add(root);return root;
}

const hero=smoothHuman('home',true,false,0);
const mates=Array.from({length:9},(_,i)=>smoothHuman('home',false,false,i+1));
const foes=Array.from({length:10},(_,i)=>smoothHuman('away',false,false,i+2));
const homeGK=smoothHuman('home',false,true,2),awayGK=smoothHuman('away',false,true,3);

const ball=new THREE.Mesh(new THREE.SphereGeometry(.22,24,18),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.36}));ball.castShadow=true;scene.add(ball);

function worldPos(p){return new THREE.Vector3((p.x/1100-.5)*FIELD_L,0,(p.y/620-.5)*FIELD_W)}
function angleLerp(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI;return a+d*t;}
function damp(current,target,lambda,dt){return THREE.MathUtils.lerp(current,target,1-Math.exp(-lambda*dt));}

function animateHuman(obj,p,dt){
  if(!obj||!p)return;const u=obj.userData,target=worldPos(p);
  if(!u.initialised){u.prev.copy(target);obj.position.copy(target);u.initialised=true;}
  const dx=target.x-u.prev.x,dz=target.z-u.prev.z,instant=Math.hypot(dx,dz)/Math.max(dt,.001);
  u.speed=damp(u.speed,instant,8,dt);
  obj.position.x=damp(obj.position.x,target.x,12,dt);obj.position.z=damp(obj.position.z,target.z,12,dt);
  if(Math.hypot(dx,dz)>.002){const yaw=Math.atan2(dx,dz);obj.rotation.y=angleLerp(obj.rotation.y,yaw,1-Math.exp(-8*dt));}

  const run=Math.min(1,u.speed/6.2),walk=Math.min(1,u.speed/2.3);u.phase+=dt*(5.2+run*5.7);
  const stride=Math.sin(u.phase)*(.20+.34*run)*walk;
  const kneeA=Math.max(0,-Math.sin(u.phase))*.42*run;
  const kneeB=Math.max(0, Math.sin(u.phase))*.42*run;
  u.ll.hip.rotation.x=damp(u.ll.hip.rotation.x,stride,12,dt);u.rl.hip.rotation.x=damp(u.rl.hip.rotation.x,-stride,12,dt);
  u.la.shoulder.rotation.x=damp(u.la.shoulder.rotation.x,-stride*.62,12,dt);u.ra.shoulder.rotation.x=damp(u.ra.shoulder.rotation.x,stride*.62,12,dt);
  u.ll.knee.rotation.x=damp(u.ll.knee.rotation.x,kneeA,13,dt);u.rl.knee.rotation.x=damp(u.rl.knee.rotation.x,kneeB,13,dt);
  u.la.elbow.rotation.x=damp(u.la.elbow.rotation.x,-.12-run*.17,8,dt);u.ra.elbow.rotation.x=damp(u.ra.elbow.rotation.x,-.12-run*.17,8,dt);
  u.body.position.y=damp(u.body.position.y,Math.sin(u.phase*2)*.018*run,10,dt);
  u.body.rotation.z=damp(u.body.rotation.z,-Math.sin(u.phase*2)*.012*run,9,dt);
  u.body.rotation.x=damp(u.body.rotation.x,run*.035,8,dt);

  if(obj===hero){const skill=bridge().skillAction;if(skill?.active){const t=Math.max(0,Math.min(1,(performance.now()-skill.start)/(skill.duration||600)));if(skill.type==='roulette')u.body.rotation.y=t*Math.PI*2;else if(skill.type==='bodyFeint')u.body.rotation.z+=Math.sin(Math.PI*t)*.18;else if(skill.type==='stepover'){u.ll.hip.rotation.z=Math.sin(t*Math.PI*2)*.20;u.rl.hip.rotation.z=-Math.sin(t*Math.PI*2)*.20;}}else{u.body.rotation.y=damp(u.body.rotation.y,0,10,dt);u.ll.hip.rotation.z=damp(u.ll.hip.rotation.z,0,10,dt);u.rl.hip.rotation.z=damp(u.rl.hip.rotation.z,0,10,dt);}}
  u.prev.copy(target);
}

function cameraFollow(m,dt){const hp=worldPos(m.player),mode=document.getElementById('cameraSelect')?.value||'Player Follow';let desired,look;if(mode==='Broadcast Lock'){desired=new THREE.Vector3(hp.x-1,25,hp.z+32);look=new THREE.Vector3(hp.x+8,0,hp.z)}else if(mode==='Shoulder'){desired=new THREE.Vector3(hp.x-5.2,3.2,hp.z+1.7);look=new THREE.Vector3(hp.x+8,1.1,hp.z)}else if(mode==='Pro Camera'){desired=new THREE.Vector3(hp.x-9.2,5.2,hp.z+1);look=new THREE.Vector3(hp.x+11,1,hp.z)}else{desired=new THREE.Vector3(hp.x-13.5,9.2,hp.z+6.5);look=new THREE.Vector3(hp.x+9,.8,hp.z)}camera.position.lerp(desired,1-Math.exp(-5*dt));camera.lookAt(look);const dir=new THREE.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();bridge().cameraBasis={fx:dir.x,fz:dir.z,rx:-dir.z,rz:dir.x};}
function resize(){const r=wrap.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(wrap);resize();

const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(.04,clock.getDelta()),m=getMatch();if(m){animateHuman(hero,m.player,dt);mates.forEach((o,i)=>animateHuman(o,m.mates?.[i]||{x:190+(i%3)*110,y:90+Math.floor(i/3)*180},dt));foes.forEach((o,i)=>animateHuman(o,m.foes?.[i]||{x:650+(i%4)*105,y:70+(i%5)*110},dt));animateHuman(homeGK,m.homeKeeper||{x:54,y:310},dt);animateHuman(awayGK,m.awayKeeper||m.keeper||{x:1046,y:310},dt);if(m.ball){const bp=worldPos(m.ball),fk=bridge().freeKickFlight;ball.position.set(bp.x,.22+(fk?.active?(fk.height||0):0),bp.z);ball.rotation.x+=(m.ball.vy||0)*dt*.26;ball.rotation.z+=(m.ball.vx||0)*dt*.26;}cameraFollow(m,dt);}else{camera.position.lerp(new THREE.Vector3(-32,22,31),.035);camera.lookAt(0,0,0);}renderer.render(scene,camera);}
frame();

const badge=document.createElement('div');badge.textContent='SMOOTH 3D PLAYERS';Object.assign(badge.style,{position:'absolute',left:'12px',top:'12px',zIndex:'5',padding:'6px 9px',borderRadius:'999px',background:'rgba(4,12,8,.72)',color:'#dfff4d',font:'800 9px system-ui',letterSpacing:'.08em',pointerEvents:'none'});wrap.appendChild(badge);
bridge().rendererVersion='smooth-3d-v2';

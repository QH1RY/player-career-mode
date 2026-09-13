import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const wrap=document.querySelector('.pitch-wrap');
const legacy=document.getElementById('gameCanvas');
if(!wrap||!legacy) throw new Error('Match container missing');
legacy.style.opacity='0';legacy.style.pointerEvents='none';
const bridge=()=>window.Career3DBridge||{};
const getMatch=()=>bridge().getMatch?.()||null;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x7ecbff);
scene.fog=new THREE.Fog(0x7ecbff,82,165);
const camera=new THREE.PerspectiveCamera(45,16/9,.1,240);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.id='miniStarCanvas';
Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'2',borderRadius:'15px',touchAction:'none'});
wrap.insertBefore(renderer.domElement,document.getElementById('touchControls'));
const touch=document.getElementById('touchControls');if(touch)touch.style.zIndex='7';

scene.add(new THREE.HemisphereLight(0xffffff,0x4f7b48,2.0));
const sun=new THREE.DirectionalLight(0xffffff,2.8);sun.position.set(-28,48,20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun);

const FIELD_L=105,FIELD_W=68;
const pitchMat=new THREE.MeshStandardMaterial({color:0x54b948,roughness:.96});
const pitch=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L,FIELD_W),pitchMat);pitch.rotation.x=-Math.PI/2;pitch.receiveShadow=true;scene.add(pitch);
for(let i=0;i<10;i++){
  const stripe=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L/10-.03,FIELD_W),new THREE.MeshBasicMaterial({color:i%2?0x5fc351:0x4daf43,transparent:true,opacity:.32,depthWrite:false}));
  stripe.rotation.x=-Math.PI/2;stripe.position.set(-FIELD_L/2+(i+.5)*FIELD_L/10,.008,0);scene.add(stripe);
}
const white=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.97});
function line(points){scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.04,p[1]))),white));}
function rect(x1,z1,x2,z2){line([[x1,z1],[x2,z1],[x2,z2],[x1,z2],[x1,z1]])}
line([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34],[-52.5,-34]]);line([[0,-34],[0,34]]);rect(-52.5,-20.16,-36,20.16);rect(36,-20.16,52.5,20.16);rect(-52.5,-9.16,-47,9.16);rect(47,-9.16,52.5,9.16);
const circle=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;circle.push([Math.cos(a)*9.15,Math.sin(a)*9.15])}line(circle);

function stand(x,z,w,d){
 const base=new THREE.Mesh(new THREE.BoxGeometry(w,6,d),new THREE.MeshStandardMaterial({color:0x516376,roughness:.9}));base.position.set(x,3,z);scene.add(base);
 const crowd=new THREE.Group();const colours=[0xf3d44e,0x48a7ff,0xff6a6a,0xffffff,0x66cf7a,0x975bdb];
 const cols=Math.max(8,Math.floor(w/4)),rows=3;
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const person=new THREE.Mesh(new THREE.BoxGeometry(.55,.85,.55),new THREE.MeshStandardMaterial({color:colours[(r+c*2)%colours.length],roughness:.9}));
   const px=x-w*.42+(c/(Math.max(1,cols-1)))*w*.84;
   const pz=z+(r-1)*1.15;
   person.position.set(px,6.45+r*.55,pz);crowd.add(person);
 }
 scene.add(crowd);
}
stand(0,-43,112,12);stand(0,43,112,12);stand(-61,0,12,74);stand(61,0,12,74);

function goal(x,dir){
 const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35});
 const post=(z)=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.14,2.5,.14),mat);p.position.set(0,1.25,z);g.add(p)};post(-3.65);post(3.65);
 const bar=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,7.45),mat);bar.position.set(0,2.5,0);g.add(bar);
 const net=new THREE.Mesh(new THREE.BoxGeometry(2.1,2.3,7.2,5,5,10),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.17}));net.position.set(dir*1.0,1.15,0);g.add(net);g.position.x=x;scene.add(g);
}
goal(-52.5,-1);goal(52.5,1);

function mat(color,rough=.7){return new THREE.MeshStandardMaterial({color,roughness:rough});}
function makeMiniPlayer(team='home',hero=false,gk=false,index=0){
 const kit=gk?(team==='home'?0x2bc9ff:0xffb22e):(team==='home'?(hero?0xe9ff47:0x2e9be8):0xf04a57);
 const skinTones=[0x6f432d,0x8d5b3c,0xa97855,0xc58e67,0x8b573a];
 const skin=mat(skinTones[index%skinTones.length],.78),shirt=mat(kit,.55),shorts=mat(team==='home'?0x16304d:0x78202a,.68),sock=mat(kit,.68),boot=mat(0x131313,.38),hair=mat(index%3?0x21140f:0x111111,.88);
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.72,.86,.44),shirt);torso.position.y=1.48;torso.castShadow=true;body.add(torso);
 const shortsBox=new THREE.Mesh(new THREE.BoxGeometry(.68,.32,.46),shorts);shortsBox.position.y=.9;shortsBox.castShadow=true;body.add(shortsBox);
 const neck=new THREE.Mesh(new THREE.BoxGeometry(.18,.14,.18),skin);neck.position.y=1.99;body.add(neck);
 const head=new THREE.Mesh(new THREE.BoxGeometry(.56,.58,.52),skin);head.position.y=2.32;head.castShadow=true;body.add(head);
 const hairBox=new THREE.Mesh(new THREE.BoxGeometry(.58,.18,.54),hair);hairBox.position.y=2.66;body.add(hairBox);
 function limb(side,isArm){
   const joint=new THREE.Group();joint.position.set(side*(isArm?.47:.20),isArm?1.70:.69,0);
   const upper=new THREE.Mesh(new THREE.BoxGeometry(isArm?.17:.22,isArm?.50:.55,isArm?.18:.25),isArm?shirt:skin);upper.position.y=isArm?-.22:-.26;upper.castShadow=true;joint.add(upper);
   const lowerJoint=new THREE.Group();lowerJoint.position.y=isArm?-.46:-.50;
   const lower=new THREE.Mesh(new THREE.BoxGeometry(isArm?.15:.19,isArm?.46:.55,isArm?.17:.22),isArm?skin:sock);lower.position.y=isArm?-.21:-.25;lower.castShadow=true;lowerJoint.add(lower);
   const end=new THREE.Mesh(new THREE.BoxGeometry(isArm?.18:.22,isArm?.18:.16,isArm?.20:.42),isArm?skin:boot);end.position.set(0,isArm?-.48:-.57,isArm?0:.11);end.castShadow=true;lowerJoint.add(end);
   joint.add(lowerJoint);body.add(joint);return{joint,lowerJoint};
 }
 const la=limb(-1,true),ra=limb(1,true),ll=limb(-1,false),rl=limb(1,false);
 if(hero){const ring=new THREE.Mesh(new THREE.RingGeometry(.48,.66,40),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.95}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;root.add(ring);}
 root.userData={body,la,ra,ll,rl,prev:new THREE.Vector3(),init:false,phase:index*.6,speed:0};scene.add(root);return root;
}
const hero=makeMiniPlayer('home',true,false,0),mates=Array.from({length:9},(_,i)=>makeMiniPlayer('home',false,false,i+1)),foes=Array.from({length:10},(_,i)=>makeMiniPlayer('away',false,false,i+2)),homeGK=makeMiniPlayer('home',false,true,2),awayGK=makeMiniPlayer('away',false,true,3);
const ball=new THREE.Mesh(new THREE.SphereGeometry(.23,18,14),mat(0xffffff,.36));ball.castShadow=true;scene.add(ball);

function worldPos(p){return new THREE.Vector3((p.x/1100-.5)*FIELD_L,0,(p.y/620-.5)*FIELD_W)}
function damp(a,b,l,dt){return THREE.MathUtils.lerp(a,b,1-Math.exp(-l*dt));}
function angleLerp(a,b,t){let d=((b-a+Math.PI)%(Math.PI*2))-Math.PI;return a+d*t;}
function animatePlayer(obj,p,dt){
 if(!p)return;const u=obj.userData,t=worldPos(p);if(!u.init){obj.position.copy(t);u.prev.copy(t);u.init=true;}
 const dx=t.x-u.prev.x,dz=t.z-u.prev.z,inst=Math.hypot(dx,dz)/Math.max(.001,dt);u.speed=damp(u.speed,inst,8,dt);
 obj.position.x=damp(obj.position.x,t.x,12,dt);obj.position.z=damp(obj.position.z,t.z,12,dt);
 if(Math.hypot(dx,dz)>.002)obj.rotation.y=angleLerp(obj.rotation.y,Math.atan2(dx,dz),1-Math.exp(-9*dt));
 const run=Math.min(1,u.speed/6),walk=Math.min(1,u.speed/2.2);u.phase+=dt*(5.2+run*6.0);const stride=Math.sin(u.phase)*(.20+.45*run)*walk;
 u.ll.joint.rotation.x=damp(u.ll.joint.rotation.x,stride,13,dt);u.rl.joint.rotation.x=damp(u.rl.joint.rotation.x,-stride,13,dt);u.la.joint.rotation.x=damp(u.la.joint.rotation.x,-stride*.65,12,dt);u.ra.joint.rotation.x=damp(u.ra.joint.rotation.x,stride*.65,12,dt);
 u.ll.lowerJoint.rotation.x=damp(u.ll.lowerJoint.rotation.x,Math.max(0,-Math.sin(u.phase))*.45*run,12,dt);u.rl.lowerJoint.rotation.x=damp(u.rl.lowerJoint.rotation.x,Math.max(0,Math.sin(u.phase))*.45*run,12,dt);u.body.position.y=damp(u.body.position.y,Math.abs(Math.sin(u.phase))*.028*run,10,dt);
 if(obj===hero){const a=bridge().playerAction;if(a?.active&&performance.now()-a.start<(a.duration||500)){const k=Math.max(0,Math.min(1,(performance.now()-a.start)/(a.duration||500)));if(a.type==='shoot'||a.type==='pass'||a.type==='freeKick'){u.rl.joint.rotation.x=-Math.sin(Math.PI*k)*1.1;u.ra.joint.rotation.x=Math.sin(Math.PI*k)*.35;}}const s=bridge().skillAction;if(s?.active){const k=Math.max(0,Math.min(1,(performance.now()-s.start)/(s.duration||600)));if(s.type==='roulette')u.body.rotation.y=k*Math.PI*2;else if(s.type==='bodyFeint')u.body.rotation.z=Math.sin(Math.PI*k)*.18;else if(s.type==='stepover'){u.ll.joint.rotation.z=Math.sin(k*Math.PI*2)*.20;u.rl.joint.rotation.z=-Math.sin(k*Math.PI*2)*.20;}}else{u.body.rotation.y=damp(u.body.rotation.y,0,9,dt);u.body.rotation.z=damp(u.body.rotation.z,0,9,dt);u.ll.joint.rotation.z=damp(u.ll.joint.rotation.z,0,9,dt);u.rl.joint.rotation.z=damp(u.rl.joint.rotation.z,0,9,dt);}}
 u.prev.copy(t);
}
function cameraFollow(m,dt){
 const hp=worldPos(m.player),mode=document.getElementById('cameraSelect')?.value||'Player Follow';let desired,look;
 if(mode==='Broadcast Lock'){desired=new THREE.Vector3(hp.x-3,18.5,hp.z+23);look=new THREE.Vector3(hp.x+9,.6,hp.z);}else if(mode==='Shoulder'){desired=new THREE.Vector3(hp.x-5.6,3.8,hp.z+3.0);look=new THREE.Vector3(hp.x+9,1.0,hp.z);}else if(mode==='Pro Camera'){desired=new THREE.Vector3(hp.x-9.0,6.1,hp.z+6.5);look=new THREE.Vector3(hp.x+11,.8,hp.z);}else{desired=new THREE.Vector3(hp.x-11.5,8.0,hp.z+10.2);look=new THREE.Vector3(hp.x+9,.7,hp.z);}
 camera.position.lerp(desired,1-Math.exp(-5.5*dt));camera.lookAt(look);const d=new THREE.Vector3();camera.getWorldDirection(d);d.y=0;d.normalize();bridge().cameraBasis={fx:d.x,fz:d.z,rx:-d.z,rz:d.x};
}
function resize(){const r=wrap.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(wrap);resize();
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);const dt=Math.min(.04,clock.getDelta()),m=getMatch();if(m){animatePlayer(hero,m.player,dt);mates.forEach((o,i)=>animatePlayer(o,m.mates?.[i]||{x:180+(i%3)*120,y:90+Math.floor(i/3)*170},dt));foes.forEach((o,i)=>animatePlayer(o,m.foes?.[i]||{x:650+(i%4)*105,y:70+(i%5)*110},dt));animatePlayer(homeGK,m.homeKeeper||{x:54,y:310},dt);animatePlayer(awayGK,m.awayKeeper||m.keeper||{x:1046,y:310},dt);if(m.ball){const bp=worldPos(m.ball);ball.position.set(bp.x,.23,bp.z);ball.rotation.x+=(m.ball.vy||0)*dt*.2;ball.rotation.z+=(m.ball.vx||0)*dt*.2;}cameraFollow(m,dt);}else{camera.position.lerp(new THREE.Vector3(-29,18,28),.04);camera.lookAt(0,0,0);}renderer.render(scene,camera);}
frame();

const badge=document.createElement('div');badge.textContent='MINI STAR STYLE · BUILD 43';Object.assign(badge.style,{position:'absolute',left:'12px',top:'12px',zIndex:'6',padding:'6px 9px',borderRadius:'10px',background:'rgba(24,50,94,.84)',color:'#fff',font:'900 9px system-ui',letterSpacing:'.06em',pointerEvents:'none',boxShadow:'0 3px 10px rgba(0,0,0,.24)'});wrap.appendChild(badge);
bridge().rendererVersion='mini-star-inspired-v1';

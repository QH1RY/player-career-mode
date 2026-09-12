import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const wrap = document.querySelector('.pitch-wrap');
const legacyCanvas = document.getElementById('gameCanvas');
if (!wrap || !legacyCanvas) throw new Error('3D match container not found');

legacyCanvas.style.opacity = '0';
legacyCanvas.style.pointerEvents = 'none';
legacyCanvas.style.position = 'relative';
legacyCanvas.style.zIndex = '0';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9dc9e8);
scene.fog = new THREE.Fog(0x9dc9e8, 70, 150);

const camera = new THREE.PerspectiveCamera(52, 16/9, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'threeGameCanvas';
Object.assign(renderer.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'1',borderRadius:'15px',touchAction:'none'});
wrap.insertBefore(renderer.domElement, document.getElementById('touchControls'));
const touch = document.getElementById('touchControls');
if (touch) touch.style.zIndex='5';

const hemi = new THREE.HemisphereLight(0xffffff,0x4d6b35,2.2); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff,3.2); sun.position.set(-35,55,25); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-75; sun.shadow.camera.right=75; sun.shadow.camera.top=55; sun.shadow.camera.bottom=-55; scene.add(sun);

const FIELD_L=105, FIELD_W=68;
const pitchMat = new THREE.MeshStandardMaterial({color:0x2b8a45,roughness:0.92});
const pitch = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L,FIELD_W),pitchMat); pitch.rotation.x=-Math.PI/2; pitch.receiveShadow=true; scene.add(pitch);

// striped mowing pattern
for(let i=0;i<10;i++){
  if(i%2===0){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_L/10-0.05,FIELD_W),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.025,depthWrite:false}));stripe.rotation.x=-Math.PI/2;stripe.position.set(-FIELD_L/2+(i+.5)*FIELD_L/10,.012,0);scene.add(stripe);}
}

const lineMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.95});
function line(points){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],.035,p[1])));scene.add(new THREE.Line(g,lineMat));}
line([[-52.5,-34],[52.5,-34],[52.5,34],[-52.5,34],[-52.5,-34]]); line([[0,-34],[0,34]]);
function rectLine(x1,z1,x2,z2){line([[x1,z1],[x2,z1],[x2,z2],[x1,z2],[x1,z1]]);} rectLine(-52.5,-20.16,-36,20.16);rectLine(36,-20.16,52.5,20.16);rectLine(-52.5,-9.16,-47,9.16);rectLine(47,-9.16,52.5,9.16);
const cc=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;cc.push([Math.cos(a)*9.15,Math.sin(a)*9.15]);}line(cc);

// Stadium bowl and advertising boards
const standMat=new THREE.MeshStandardMaterial({color:0x253342,roughness:.8});
const crowdMat=new THREE.MeshStandardMaterial({color:0x51616e,roughness:.9});
function stand(x,z,w,d,rot=0){const base=new THREE.Mesh(new THREE.BoxGeometry(w,7,d),standMat);base.position.set(x,3.5,z);base.rotation.y=rot;base.receiveShadow=true;scene.add(base);const crowd=new THREE.Mesh(new THREE.BoxGeometry(w*.96,2.5,d*.75),crowdMat);crowd.position.set(x,7.1,z);crowd.rotation.y=rot;scene.add(crowd);} stand(0,-43,112,12);stand(0,43,112,12);stand(-61,0,12,74);stand(61,0,12,74);
const boardMat=new THREE.MeshStandardMaterial({color:0x101b22,emissive:0x07100b,emissiveIntensity:.4});
[[-54.5,0,.35,68], [54.5,0,.35,68],[0,-35.5,105,.35],[0,35.5,105,.35]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,1.1,d),boardMat);m.position.set(x,.55,z);scene.add(m)});

function buildGoal(x,dir){const group=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4});const postGeo=new THREE.CylinderGeometry(.07,.07,2.44,10);const barGeo=new THREE.CylinderGeometry(.07,.07,7.32,10);const p1=new THREE.Mesh(postGeo,white),p2=p1.clone(),bar=new THREE.Mesh(barGeo,white);p1.position.set(0,1.22,-3.66);p2.position.set(0,1.22,3.66);bar.rotation.x=Math.PI/2;bar.position.set(0,2.44,0);group.add(p1,p2,bar);const netMat=new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.18});const net=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.35,7.25,4,4,8),netMat);net.position.set(dir*1.05,1.15,0);group.add(net);group.position.x=x;scene.add(group);} buildGoal(-52.5,-1);buildGoal(52.5,1);

function limb(material,length=.9,r=.105){const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.05,length-r*2),5,9),material);m.castShadow=true;return m;}
function makeHuman(team='home',hero=false,gk=false){
  const kit = gk ? (team==='home'?0x25c4ff:0xffaa28) : team==='home' ? (hero?0xdfff4d:0x42b7e9) : 0xd83d4f;
  const shorts=team==='home'?0x102b3a:0x6f1727;
  const skin=new THREE.MeshStandardMaterial({color:0x9f6a48,roughness:.75});
  const shirt=new THREE.MeshStandardMaterial({color:kit,roughness:.65});
  const shortsMat=new THREE.MeshStandardMaterial({color:gk?kit:shorts,roughness:.7});
  const sockMat=new THREE.MeshStandardMaterial({color:kit,roughness:.7});
  const bootMat=new THREE.MeshStandardMaterial({color:0x151515,roughness:.5});
  const hairMat=new THREE.MeshStandardMaterial({color:0x17110e,roughness:1});
  const g=new THREE.Group();g.userData={parts:{},prev:new THREE.Vector3(),speed:0};
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,7,12),shirt);torso.scale.set(1.05,1,.72);torso.position.y=1.45;torso.castShadow=true;g.add(torso);
  const shortsMesh=new THREE.Mesh(new THREE.BoxGeometry(.72,.42,.48),shortsMat);shortsMesh.position.y=.88;shortsMesh.castShadow=true;g.add(shortsMesh);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.11,.12,.17,10),skin);neck.position.y=2.0;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,18,14),skin);head.scale.set(.88,1.05,.9);head.position.y=2.25;head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.255,18,10,0,Math.PI*2,0,Math.PI*.48),hairMat);hair.position.y=2.31;g.add(hair);
  function arm(side){const shoulder=new THREE.Group();shoulder.position.set(side*.46,1.72,0);const upper=limb(shirt,.56,.11);upper.position.y=-.25;shoulder.add(upper);const elbow=new THREE.Group();elbow.position.y=-.53;const lower=limb(skin,.55,.09);lower.position.y=-.25;elbow.add(lower);shoulder.add(elbow);g.add(shoulder);return {shoulder,elbow};}
  function leg(side){const hip=new THREE.Group();hip.position.set(side*.2,.78,0);const upper=limb(skin,.7,.13);upper.position.y=-.34;hip.add(upper);const knee=new THREE.Group();knee.position.y=-.68;const lower=limb(sockMat,.65,.105);lower.position.y=-.31;knee.add(lower);const boot=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.42),bootMat);boot.position.set(0,-.66,.12);boot.castShadow=true;knee.add(boot);hip.add(knee);g.add(hip);return {hip,knee};}
  const la=arm(-1),ra=arm(1),ll=leg(-1),rl=leg(1);g.userData.parts={la,ra,ll,rl,torso,head};
  if(hero){const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.72,36),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.92}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;g.add(ring);}
  if(gk){const gloveMat=new THREE.MeshStandardMaterial({color:0xffffff});[-1,1].forEach(s=>{const glove=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),gloveMat);glove.position.set(s*.46,1.06,0);g.add(glove);});}
  g.scale.setScalar(hero?1.06:1);scene.add(g);return g;
}

const hero3D=makeHuman('home',true,false); let mates3D=[],foes3D=[],homeGK=null,awayGK=null;
const ball=new THREE.Mesh(new THREE.SphereGeometry(.22,18,14),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45}));ball.castShadow=true;scene.add(ball);

function worldPos(p){return new THREE.Vector3((p.x/1100-.5)*FIELD_L,0,(p.y/620-.5)*FIELD_W);}
function syncHuman(obj,p,dt){if(!obj||!p)return;const target=worldPos(p);const prev=obj.userData.prev;const dx=target.x-prev.x,dz=target.z-prev.z;const speed=Math.hypot(dx,dz)/Math.max(dt,.001);obj.position.x=target.x;obj.position.z=target.z;if(Math.hypot(dx,dz)>.005)obj.rotation.y=Math.atan2(dx,dz);const parts=obj.userData.parts;const run=Math.min(1,speed/9);const phase=performance.now()*.012*(1+run*1.2);const swing=Math.sin(phase)*.72*run;parts.ll.hip.rotation.x=swing;parts.rl.hip.rotation.x=-swing;parts.la.shoulder.rotation.x=-swing*.7;parts.ra.shoulder.rotation.x=swing*.7;parts.ll.knee.rotation.x=Math.max(0,-Math.sin(phase))*.45*run;parts.rl.knee.rotation.x=Math.max(0,Math.sin(phase))*.45*run;parts.torso.rotation.z=Math.sin(phase*2)*.025*run;prev.copy(target);}
function ensureTeams(){if(!window.match)return;while(mates3D.length<match.mates.length)mates3D.push(makeHuman('home'));while(foes3D.length<match.foes.length)foes3D.push(makeHuman('away'));if(match.homeKeeper&&!homeGK)homeGK=makeHuman('home',false,true);if((match.awayKeeper||match.keeper)&&!awayGK)awayGK=makeHuman('away',false,true);}

const clock=new THREE.Clock();
function cameraFollow(){if(!window.match)return;const hp=worldPos(match.player);const mode=document.getElementById('cameraSelect')?.value||'Player Follow';let desired,look;
  if(mode==='Broadcast Lock'){desired=new THREE.Vector3(hp.x-2,27,hp.z+35);look=new THREE.Vector3(hp.x+10,0,hp.z);}
  else if(mode==='Shoulder'){desired=new THREE.Vector3(hp.x-5.5,3.1,hp.z+1.8);look=new THREE.Vector3(hp.x+8,1.2,hp.z);}
  else if(mode==='Pro Camera'){desired=new THREE.Vector3(hp.x-9,5.1,hp.z);look=new THREE.Vector3(hp.x+12,1.2,hp.z);}
  else {desired=new THREE.Vector3(hp.x-12,8.2,hp.z+1.5);look=new THREE.Vector3(hp.x+10,1,hp.z);}
  camera.position.lerp(desired,.095);camera.lookAt(look);
}

function resize(){const r=wrap.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(wrap);resize();

function animate(){requestAnimationFrame(animate);const dt=Math.min(.04,clock.getDelta());ensureTeams();if(window.match){syncHuman(hero3D,match.player,dt);match.mates.forEach((p,i)=>syncHuman(mates3D[i],p,dt));match.foes.forEach((p,i)=>syncHuman(foes3D[i],p,dt));if(homeGK&&match.homeKeeper)syncHuman(homeGK,match.homeKeeper,dt);if(awayGK&&(match.awayKeeper||match.keeper))syncHuman(awayGK,match.awayKeeper||match.keeper,dt);const bp=worldPos(match.ball);ball.position.set(bp.x,.22,bp.z);ball.rotation.z+=((match.ball.vx||0)*dt)*.35;ball.rotation.x+=((match.ball.vy||0)*dt)*.35;cameraFollow();}else{camera.position.lerp(new THREE.Vector3(-32,22,31),.03);camera.lookAt(0,0,0);}renderer.render(scene,camera);}animate();

// Small 3D badge so it is obvious the new renderer is active.
const badge=document.createElement('div');badge.textContent='3D MATCH';Object.assign(badge.style,{position:'absolute',left:'12px',top:'12px',zIndex:'6',padding:'6px 9px',borderRadius:'8px',background:'rgba(5,15,10,.7)',color:'#dfff4d',font:'800 10px system-ui',letterSpacing:'.12em',pointerEvents:'none'});wrap.appendChild(badge);

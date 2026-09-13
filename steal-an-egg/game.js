import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const root=document.getElementById('game'),message=document.getElementById('message'),eggsEl=document.getElementById('eggs'),coinsEl=document.getElementById('coins'),speedEl=document.getElementById('speed'),bagEl=document.getElementById('bag'),stealBtn=document.getElementById('stealBtn'),sprintBtn=document.getElementById('sprintBtn'),joystick=document.getElementById('joystick'),stick=document.getElementById('stick');
const SAVE_KEY='stealAnEgg_v2';
const state=Object.assign({coins:0,totalEggs:0,speed:10,bag:[],bagMax:4},JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'));
const save=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(state));
const fmt=n=>n>=1e9?(n/1e9).toFixed(n>=1e10?0:1).replace('.0','')+'B':n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace('.0','')+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1).replace('.0','')+'K':Math.floor(n).toString();
const flash=t=>{message.textContent=t;clearTimeout(flash.t);flash.t=setTimeout(()=>message.textContent='Train speed → steal eggs → escape → sell → unlock stronger bosses!',2800)};

const scene=new THREE.Scene();scene.background=new THREE.Color(0x8fd3ff);scene.fog=new THREE.Fog(0x8fd3ff,75,175);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,300),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x507040,1.8));const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(-35,55,30);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(260,180),new THREE.MeshStandardMaterial({color:0x72cf65,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
function box(x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function textSprite(text,color='#fff'){const c=document.createElement('canvas');c.width=768;c.height=128;const q=c.getContext('2d');q.fillStyle='rgba(10,20,30,.78)';q.roundRect(4,4,760,120,22);q.fill();q.font='900 36px system-ui';q.fillStyle=color;q.textAlign='center';q.textBaseline='middle';q.fillText(text,384,64);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true}));s.scale.set(11,1.85,1);scene.add(s);return s}
function eggMesh(color){const m=new THREE.Mesh(new THREE.SphereGeometry(.78,28,20),new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.08}));m.scale.set(.86,1.15,.86);m.castShadow=true;return m}
function bossMesh(color){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color,roughness:.58}),skin=new THREE.MeshStandardMaterial({color:0xf0b487,roughness:.74});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.65,1.35,8,14),mat);body.position.y=1.25;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.52,18,14),skin);head.position.y=2.55;head.castShadow=true;g.add(head);return g}

box(-96,.4,0,17,.8,19,0x4b9cff);box(-96,1.2,0,14,.8,16,0x78b7ff);const baseLabel=textSprite('YOUR BASE · SELL EGGS');baseLabel.position.set(-96,4.2,0);

const trainers=[
 {x:-76,z:-22,need:0,mult:1.010,name:'STARTER x1.01'},
 {x:-76,z:-11,need:100,mult:1.018,name:'FAST x1.018'},
 {x:-76,z:0,need:10000,mult:1.030,name:'ELITE x1.03'},
 {x:-76,z:11,need:1e6,mult:1.050,name:'MEGA x1.05'},
 {x:-76,z:22,need:1e8,mult:1.075,name:'BILLION x1.075'}
];
trainers.forEach(t=>{box(t.x,.25,t.z,10,.5,5,0x30343b);box(t.x,.55,t.z,8,.15,3.3,0x11151a);const l=textSprite(`${t.name} · NEED ${fmt(t.need)}`,'#f5ff72');l.position.set(t.x,3,t.z);});

const defs=[
 ['Farmer Fred',25,25,0xfff2b1,0xffffff],['Ninja Niko',100,60,0x5d6cff,0x78d9ff],['Lava Boss',500,150,0xff6a3d,0xff9b41],['Shadow King',2500,400,0x5a3a7e,0xd58cff],
 ['Cyber Chief',10000,1000,0x18c3d6,0x47f5ff],['Ice Emperor',50000,2500,0x87bfff,0xc9ecff],['Desert Titan',250000,6000,0xd49a42,0xffd36b],['Storm Queen',1e6,15000,0x7d75ff,0xb7b0ff],
 ['Galaxy Guard',5e6,40000,0x633bd1,0xee80ff],['Void Beast',25e6,100000,0x291f3e,0xb346ff],['Omega Bot',100e6,250000,0x87939d,0xff3a55],['Time Lord',500e6,600000,0xf6c434,0xffef7a],
 ['Cosmic Dragon',1e9,1200000,0xe75135,0xffd34d],['Infinity Knight',2.5e9,2500000,0x4139a8,0xa4a0ff],['Universe King',5e9,5000000,0x9f33c9,0xff8fe9],['7B SPEED GOD',7e9,10000000,0xff2d78,0xffd700]
];
const positions=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)positions.push({x:-42+c*30,z:-48+r*31});
const zones=defs.map((d,i)=>({name:d[0],need:d[1],reward:d[2],color:d[3],egg:d[4],...positions[i]}));
zones.forEach((z,i)=>{box(z.x,.16,z.z,18,.32,15,i<4?0xd8c58d:i<8?0x7da56a:i<12?0x6d5b87:0x65404d);const label=textSprite(`${z.name} · SPEED ${fmt(z.need)}+`);label.position.set(z.x,5,z.z-5.5);z.boss=bossMesh(z.color);z.boss.position.set(z.x+4,0,z.z);scene.add(z.boss);z.home=z.boss.position.clone();z.eggObj=eggMesh(z.egg);z.eggObj.position.set(z.x+1,1,z.z);scene.add(z.eggObj);z.stolen=false;z.alert=false;});

function makePlayer(){const g=new THREE.Group(),shirt=new THREE.MeshStandardMaterial({color:0x1f9dff,roughness:.55}),skin=new THREE.MeshStandardMaterial({color:0xb87953,roughness:.76}),dark=new THREE.MeshStandardMaterial({color:0x17202a,roughness:.72});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.78,8,16),shirt);body.position.y=1.25;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.31,20,16),skin);head.position.y=2.05;head.castShadow=true;g.add(head);const legs=[];[-1,1].forEach(s=>{const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.72,7,12),dark);leg.position.set(s*.17,.45,0);leg.castShadow=true;g.add(leg);legs.push(leg)});g.userData.legs=legs;scene.add(g);return g}
const player=makePlayer();player.position.set(-88,0,0);
const keys={};addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let joy={x:0,y:0,mag:0},activePointer=null,sprinting=false;
function joyMove(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,max=42,m=Math.hypot(dx,dy)||1,d=Math.min(max,m);joy={x:dx/m,y:dy/m,mag:Math.min(1,m/max)};stick.style.transform=`translate(${joy.x*d}px,${joy.y*d}px)`}
joystick.addEventListener('pointerdown',e=>{activePointer=e.pointerId;joystick.setPointerCapture?.(e.pointerId);joyMove(e);e.preventDefault()});joystick.addEventListener('pointermove',e=>{if(e.pointerId===activePointer)joyMove(e)});function joyEnd(e){if(activePointer!==null&&e.pointerId!==activePointer)return;activePointer=null;joy={x:0,y:0,mag:0};stick.style.transform='translate(0,0)'}joystick.addEventListener('pointerup',joyEnd);joystick.addEventListener('pointercancel',joyEnd);sprintBtn.addEventListener('pointerdown',e=>{sprinting=true;sprintBtn.setPointerCapture?.(e.pointerId);e.preventDefault()});['pointerup','pointercancel'].forEach(n=>sprintBtn.addEventListener(n,()=>sprinting=false));

function updateHUD(){eggsEl.textContent=fmt(state.totalEggs);coinsEl.textContent=fmt(state.coins);speedEl.textContent=fmt(state.speed);bagEl.textContent=`${state.bag.length}/${state.bagMax}`}
function nearestZone(){let best=null,d=999;zones.forEach(z=>{const q=Math.hypot(player.position.x-(z.x+1),player.position.z-z.z);if(q<d){d=q;best=z}});return d<3.3?best:null}
function trySteal(){const z=nearestZone();if(!z)return flash('Get closer to an egg first.');if(z.stolen)return flash('That egg is already stolen.');if(state.bag.length>=state.bagMax)return flash('Bag full! Return to your base and sell.');if(state.speed<z.need)return flash(`Too slow! Need SPEED ${fmt(z.need)}.`);z.stolen=true;z.alert=true;z.eggObj.visible=false;state.bag.push({name:z.name,value:z.reward});save();updateHUD();flash(`🥚 STOLEN! ${z.name} is chasing you!`)}
stealBtn.addEventListener('pointerdown',e=>{trySteal();e.preventDefault()});
function resetEgg(z){z.stolen=false;z.alert=false;z.eggObj.visible=true;z.boss.position.copy(z.home)}
function loseEgg(z){if(!state.bag.length)return;const lost=state.bag.pop();resetEgg(z);player.position.set(-88,0,0);save();updateHUD();flash(`Caught! You dropped ${lost.name}'s egg.`)}
function sellEggs(){if(!state.bag.length)return;const gain=state.bag.reduce((a,b)=>a+b.value,0);state.coins+=gain;state.totalEggs+=state.bag.length;state.bag=[];zones.filter(z=>z.stolen).forEach(resetEgg);save();updateHUD();flash(`Sold eggs for 🪙 ${fmt(gain)}!`)}

function interactions(dt){if(Math.hypot(player.position.x+96,player.position.z)<8)sellEggs();trainers.forEach(t=>{const d=Math.hypot(player.position.x-t.x,player.position.z-t.z);if(d<5){if(state.speed<t.need)return;const frames=dt*60;state.speed=Math.min(7e9,state.speed*Math.pow(t.mult,frames));if(Math.random()<.025)save();updateHUD();}});zones.forEach(z=>{if(!z.alert)return;const dx=player.position.x-z.boss.position.x,dz=player.position.z-z.boss.position.z,d=Math.hypot(dx,dz)||1;const rank=Math.log10(Math.max(10,z.need));const bs=.12+rank*.018;z.boss.position.x+=dx/d*bs*dt*60;z.boss.position.z+=dz/d*bs*dt*60;z.boss.rotation.y=Math.atan2(dx,dz);if(d<1.4)loseEgg(z);if(Math.hypot(player.position.x+96,player.position.z)<9)z.alert=false;});}

const clock=new THREE.Clock();let facing=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(.04,clock.getDelta());let x=0,z=0,mag=0;if(joy.mag>.03){x=joy.x;z=joy.y;mag=joy.mag}else{x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);mag=Math.min(1,Math.hypot(x,z));const m=Math.hypot(x,z)||1;x/=m;z/=m}const run=sprinting||keys.shift;const displayMove=1.45+Math.log10(Math.max(10,state.speed))*.55;const move=displayMove*(run?1.34:1)*mag;player.position.x=THREE.MathUtils.clamp(player.position.x+x*move*dt*5.4,-122,78);player.position.z=THREE.MathUtils.clamp(player.position.z+z*move*dt*5.4,-70,70);if(mag>.04){const target=Math.atan2(x,z),diff=Math.atan2(Math.sin(target-facing),Math.cos(target-facing));facing+=diff*.22;player.rotation.y=facing;const swing=Math.sin(performance.now()*.012*(run?1.6:1))*.48*mag;player.userData.legs[0].rotation.x=swing;player.userData.legs[1].rotation.x=-swing}else player.userData.legs.forEach(l=>l.rotation.x*=.82);interactions(dt);const desired=new THREE.Vector3(player.position.x-10,8,player.position.z+11);camera.position.lerp(desired,.08);camera.lookAt(player.position.x+3,1.1,player.position.z);renderer.render(scene,camera)}
updateHUD();animate();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const root=document.getElementById('game');
const message=document.getElementById('message');
const eggsEl=document.getElementById('eggs');
const coinsEl=document.getElementById('coins');
const speedEl=document.getElementById('speed');
const bagEl=document.getElementById('bag');
const stealBtn=document.getElementById('stealBtn');
const sprintBtn=document.getElementById('sprintBtn');
const joystick=document.getElementById('joystick');
const stick=document.getElementById('stick');

const SAVE_KEY='stealAnEgg_v1';
const state=Object.assign({coins:0,totalEggs:0,speed:10,bag:[],bagMax:3,unlocked:1},JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'));
const save=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(state));
const flash=t=>{message.textContent=t;clearTimeout(flash.t);flash.t=setTimeout(()=>message.textContent='Train speed → steal eggs → escape to your base → sell!',2600)};

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd3ff);
scene.fog=new THREE.Fog(0x8fd3ff,65,145);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,250);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x507040,1.8));
const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(-30,50,25);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);

const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,120),new THREE.MeshStandardMaterial({color:0x72cf65,roughness:.95}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

function box(x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.75}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function textSprite(text,color='#fff',bg='rgba(10,20,30,.75)'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=bg;x.roundRect(4,4,504,120,22);x.fill();x.font='900 38px system-ui';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64);const tex=new THREE.CanvasTexture(c);const mat=new THREE.SpriteMaterial({map:tex,transparent:true});const s=new THREE.Sprite(mat);s.scale.set(8,2,1);scene.add(s);return s;
}

// Base / sell area
box(-68,.4,0,16,.8,18,0x4b9cff);box(-68,1.2,0,13,.8,15,0x78b7ff);
const baseLabel=textSprite('YOUR BASE · SELL EGGS','#ffffff');baseLabel.position.set(-68,4.3,0);

// Training treadmills
const treadmills=[];
for(let i=0;i<3;i++){
 const x=-49,z=-10+i*10;const pad=box(x,.25,z,9,.5,5,0x30343b);box(x,.55,z,7,.15,3.3,0x11151a);
 const label=textSprite(i===0?'TREADMILL +SPEED':i===1?'FAST TRAINER':'TURBO TRAINER','#f5ff72');label.position.set(x,3,z);
 treadmills.push({x,z,r:5,rate:[.006,.010,.016][i],need:[0,18,35][i]});
}

// Roads and buses
box(-20,.04,0,34,.08,9,0x3f4348);box(20,.04,-29,55,.08,8,0x3f4348);box(20,.04,29,55,.08,8,0x3f4348);
const busStops=[{x:-31,z:0,to:{x:8,z:-29},name:'BUS → FARM'},{x:8,z:-29,to:{x:8,z:29},name:'BUS → VOLCANO'},{x:8,z:29,to:{x:-31,z:0},name:'BUS → BASE'}];
busStops.forEach((b,i)=>{box(b.x,.75,b.z,6,1.5,2.8,[0xffcf33,0x66e39c,0xff8066][i]);const l=textSprite(b.name,'#fff');l.position.set(b.x,3,b.z);b.label=l;});

function eggMesh(color=0xffffff){
 const g=new THREE.SphereGeometry(.78,28,20);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.36,metalness:.08}));m.scale.set(.86,1.15,.86);m.castShadow=true;return m;
}
function bossMesh(color){
 const g=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color,roughness:.6});const skin=new THREE.MeshStandardMaterial({color:0xf0b487,roughness:.75});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.65,1.35,8,14),mat);body.position.y=1.25;body.castShadow=true;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.52,18,14),skin);head.position.y=2.55;head.castShadow=true;g.add(head);
 const eyeMat=new THREE.MeshBasicMaterial({color:0x111111});[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),eyeMat);e.position.set(s*.18,2.64,.47);g.add(e)});
 return g;
}

const zones=[
 {name:'Farmer Fred',x:2,z:-29,need:12,reward:20,color:0xfff2b1,egg:0xffffff},
 {name:'Ninja Niko',x:26,z:-29,need:22,reward:45,color:0x5d6cff,egg:0x78d9ff},
 {name:'Lava Boss',x:2,z:29,need:34,reward:85,color:0xff6a3d,egg:0xff9b41},
 {name:'Shadow King',x:30,z:29,need:50,reward:150,color:0x5a3a7e,egg:0xd58cff}
];

zones.forEach((z,i)=>{
 box(z.x,.18,z.z,18,.36,16,i<2?0xd8c58d:0x6d4b3f);
 const gate=box(z.x-8.6,1.5,z.z,1.2,3,16,i<2?0x865f35:0x43261f);z.gate=gate;
 const label=textSprite(`${z.name} · SPEED ${z.need}+`,'#fff');label.position.set(z.x,5,z.z-6);z.label=label;
 z.boss=bossMesh(z.color);z.boss.position.set(z.x+4,0,z.z);scene.add(z.boss);z.home=z.boss.position.clone();
 z.eggObj=eggMesh(z.egg);z.eggObj.position.set(z.x+1,1,z.z);scene.add(z.eggObj);
 z.stolen=false;z.alert=false;
});

function makePlayer(){
 const g=new THREE.Group();const shirt=new THREE.MeshStandardMaterial({color:0x1f9dff,roughness:.55});const skin=new THREE.MeshStandardMaterial({color:0xb87953,roughness:.76});const dark=new THREE.MeshStandardMaterial({color:0x17202a,roughness:.72});
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.78,8,16),shirt);body.position.y=1.25;body.castShadow=true;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.31,20,16),skin);head.position.y=2.05;head.castShadow=true;g.add(head);
 const legs=[];[-1,1].forEach(s=>{const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.72,7,12),dark);leg.position.set(s*.17,.45,0);leg.castShadow=true;g.add(leg);legs.push(leg)});
 g.userData.legs=legs;scene.add(g);return g;
}
const player=makePlayer();player.position.set(-60,0,0);
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.75,30),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;player.add(shadow);

const keys={};addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
let joy={x:0,y:0,mag:0},activePointer=null,sprinting=false;
function joyMove(e){const r=joystick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,max=42,m=Math.hypot(dx,dy)||1,d=Math.min(max,m);joy={x:dx/m,y:dy/m,mag:Math.min(1,m/max)};stick.style.transform=`translate(${joy.x*d}px,${joy.y*d}px)`}
joystick.addEventListener('pointerdown',e=>{activePointer=e.pointerId;joystick.setPointerCapture?.(e.pointerId);joyMove(e);e.preventDefault()});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===activePointer)joyMove(e)});
function joyEnd(e){if(activePointer!==null&&e.pointerId!==activePointer)return;activePointer=null;joy={x:0,y:0,mag:0};stick.style.transform='translate(0,0)'}
joystick.addEventListener('pointerup',joyEnd);joystick.addEventListener('pointercancel',joyEnd);
sprintBtn.addEventListener('pointerdown',e=>{sprinting=true;sprintBtn.setPointerCapture?.(e.pointerId);e.preventDefault()});
['pointerup','pointercancel'].forEach(n=>sprintBtn.addEventListener(n,()=>sprinting=false));

function nearestZone(){let best=null,d=999;zones.forEach(z=>{const q=Math.hypot(player.position.x-(z.x+1),player.position.z-z.z);if(q<d){d=q;best=z}});return d<3.2?best:null}
function trySteal(){
 const z=nearestZone();if(!z){flash('Get closer to an egg first.');return}
 if(z.stolen){flash('That egg has already been taken.');return}
 if(state.bag.length>=state.bagMax){flash('Your bag is full. Return to your base and sell.');return}
 if(state.speed<z.need){flash(`Too slow! You need SPEED ${z.need}. Train on the treadmill.`);return}
 z.stolen=true;z.alert=true;z.eggObj.visible=false;state.bag.push({name:z.name,value:z.reward});save();flash(`🥚 STOLEN! ${z.name} is chasing you. ESCAPE!`);updateHUD();
}
stealBtn.addEventListener('pointerdown',e=>{trySteal();e.preventDefault()});

function resetEgg(z){z.stolen=false;z.alert=false;z.eggObj.visible=true;z.boss.position.copy(z.home)}
function loseEgg(z){
 if(!state.bag.length)return;const lost=state.bag.pop();resetEgg(z);player.position.set(-42,0,0);save();updateHUD();flash(`Caught by ${z.name}! You dropped ${lost.name}'s egg.`)
}
function sellEggs(){
 if(!state.bag.length)return;
 const gain=state.bag.reduce((a,b)=>a+b.value,0);state.coins+=gain;state.totalEggs+=state.bag.length;state.bag=[];zones.filter(z=>z.stolen).forEach(resetEgg);save();updateHUD();flash(`Sold your eggs for 🪙 ${gain}!`)
}
function updateHUD(){eggsEl.textContent=state.totalEggs;coinsEl.textContent=state.coins;speedEl.textContent=state.speed.toFixed(1);bagEl.textContent=`${state.bag.length}/${state.bagMax}`}
updateHUD();

let busCooldown=0;
function interactions(dt){
 // Sell zone
 if(Math.hypot(player.position.x+68,player.position.z)<8)sellEggs();
 // Treadmills
 treadmills.forEach(t=>{const d=Math.hypot(player.position.x-t.x,player.position.z-t.z);if(d<t.r){if(state.speed<t.need){flash(`Need SPEED ${t.need} to use this treadmill.`);return}state.speed=Math.min(70,state.speed+t.rate*dt*60);if(Math.random()<.02)save();updateHUD();}});
 // Buses teleport when standing by them briefly
 busCooldown=Math.max(0,busCooldown-dt);
 if(busCooldown<=0){for(const b of busStops){if(Math.hypot(player.position.x-b.x,player.position.z-b.z)<2.7){player.position.set(b.to.x,0,b.to.z);busCooldown=2;flash('🚌 Bus ride!');break}}}
 // Boss chase
 zones.forEach(z=>{
   if(!z.alert)return;
   const dx=player.position.x-z.boss.position.x,dz=player.position.z-z.boss.position.z,d=Math.hypot(dx,dz)||1;
   const bossSpeed=.095+z.need*.0026;
   z.boss.position.x+=dx/d*bossSpeed*dt*60;z.boss.position.z+=dz/d*bossSpeed*dt*60;z.boss.rotation.y=Math.atan2(dx,dz);
   if(d<1.35)loseEgg(z);
   if(Math.hypot(player.position.x+68,player.position.z)<9)z.alert=false;
 });
}

const clock=new THREE.Clock();let facing=0;
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(.04,clock.getDelta());
 let x=0,z=0,mag=0;
 if(joy.mag>.03){x=joy.x;z=joy.y;mag=joy.mag}else{x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);mag=Math.min(1,Math.hypot(x,z));const m=Math.hypot(x,z)||1;x/=m;z/=m}
 const run=sprinting||keys.shift;const speed=(state.speed*.075+1.25)*(run?1.34:1)*mag;
 player.position.x=THREE.MathUtils.clamp(player.position.x+x*speed*dt*10,-84,84);player.position.z=THREE.MathUtils.clamp(player.position.z+z*speed*dt*10,-54,54);
 if(mag>.04){const target=Math.atan2(x,z),diff=Math.atan2(Math.sin(target-facing),Math.cos(target-facing));facing+=diff*.22;player.rotation.y=facing;const swing=Math.sin(performance.now()*.012*(run?1.6:1))*.48*Math.min(1,mag);player.userData.legs[0].rotation.x=swing;player.userData.legs[1].rotation.x=-swing}else{player.userData.legs.forEach(l=>l.rotation.x*=.82)}
 interactions(dt);
 const desired=new THREE.Vector3(player.position.x-9,7.2,player.position.z+10);camera.position.lerp(desired,.08);camera.lookAt(player.position.x+3,1.1,player.position.z);
 renderer.render(scene,camera)
}
animate();

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

"use strict";
/* Fondo: puntos que forman obras icónicas de la arquitectura y van cambiando */
(function(){
  const cv=document.getElementById("bg"),ctx=cv.getContext("2d"),hero=cv.parentElement;
  const still=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const S=220,N=1100,STEP=7;
  const off=document.createElement("canvas");off.width=S;off.height=S;
  const o=off.getContext("2d",{willReadFrequently:true});
  const poly=pts=>{o.beginPath();pts.forEach(([x,y],i)=>i?o.lineTo(x*S,y*S):o.moveTo(x*S,y*S));o.closePath();o.fill();};
  const rect=(x,y,w,h)=>o.fillRect(x*S,y*S,w*S,h*S);
  const ell=(x,y,rx,ry)=>{o.beginPath();o.ellipse(x*S,y*S,rx*S,ry*S,0,0,Math.PI*2);o.fill();};
  const arch=(x,y,w,h)=>{o.beginPath();o.moveTo(x*S,(y+h)*S);o.lineTo(x*S,(y+w/2)*S);o.arc((x+w/2)*S,(y+w/2)*S,w/2*S,Math.PI,0);o.lineTo((x+w)*S,(y+h)*S);o.closePath();o.fill();};
  const cut=f=>{o.globalCompositeOperation="destination-out";f();o.globalCompositeOperation="source-over";};
  const OBRAS=[
    {n:"Obelisco · Buenos Aires · Alberto Prebisch, 1936",d(){rect(.36,.96,.28,.04);poly([[.44,.97],[.46,.1],[.5,.02],[.54,.1],[.56,.97]]);cut(()=>rect(.488,.2,.024,.03));}},
    {n:"Torre Eiffel · París · 1889",d(){o.beginPath();o.moveTo(.12*S,S);o.lineTo(.40*S,.62*S);o.lineTo(.46*S,.30*S);o.lineTo(.49*S,.06*S);o.lineTo(.5*S,0);o.lineTo(.51*S,.06*S);o.lineTo(.54*S,.30*S);o.lineTo(.60*S,.62*S);o.lineTo(.88*S,S);o.lineTo(.68*S,S);o.quadraticCurveTo(.5*S,.70*S,.32*S,S);o.closePath();o.fill();rect(.33,.6,.34,.035);rect(.43,.29,.14,.03);cut(()=>poly([[.485,.34],[.515,.34],[.54,.58],[.46,.58]]));}},
    {n:"Coliseo · Roma · año 80",d(){poly([[0,1],[0,.3],[.5,.28],[.62,.33],[.72,.45],[.85,.5],[1,.56],[1,1]]);cut(()=>{[.36,.57,.78].forEach(r=>{for(let i=0;i<10;i++)arch(.025+i*.098,r,.056,.14);rect(0,r-.02,1,.008);});});}},
    {n:"Taj Mahal · Agra · 1653",d(){rect(.2,.6,.6,.4);ell(.5,.44,.17,.2);rect(.36,.44,.28,.17);rect(.494,.15,.012,.1);ell(.3,.56,.06,.06);ell(.7,.56,.06,.06);rect(.04,.36,.04,.64);rect(.92,.36,.04,.64);ell(.06,.35,.035,.035);ell(.94,.35,.035,.035);cut(()=>{arch(.43,.67,.14,.33);arch(.25,.72,.08,.15);arch(.67,.72,.08,.15);});}},
    {n:"Ópera de Sídney · Jørn Utzon, 1973",d(){rect(.04,.8,.92,.2);[[.1,.4,.32,.4],[.28,.56,.48,.28],[.46,.7,.6,.42],[.62,.9,.8,.54]].forEach(([a,b,px,py])=>{o.beginPath();o.moveTo(a*S,.81*S);o.quadraticCurveTo((a+(px-a)*.15)*S,py*S,px*S,py*S);o.lineTo(b*S,.81*S);o.closePath();o.fill();});}},
    {n:"Torre de Pisa · 1372",d(){rect(.3,.97,.4,.03);o.save();o.translate(.5*S,.97*S);o.rotate(.08);o.fillRect(-.1*S,-.8*S,.2*S,.8*S);o.fillRect(-.075*S,-.93*S,.15*S,.14*S);
      o.globalCompositeOperation="destination-out";for(let k=1;k<=7;k++){const y=-k*.11*S;o.fillRect(-.1*S,y,.2*S,.008*S);for(let j=0;j<5;j++)o.fillRect((-.088+j*.04)*S,y+.02*S,.016*S,.065*S);}o.globalCompositeOperation="source-over";o.restore();}}
  ];
  function sample(ob){
    o.clearRect(0,0,S,S);o.fillStyle="#000";ob.d();
    const data=o.getImageData(0,0,S,S).data,pts=[];
    for(let y=0;y<S;y+=2)for(let x=0;x<S;x+=2)if(data[(y*S+x)*4+3]>120)pts.push([x/S,y/S]);
    for(let i=pts.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[pts[i],pts[j]]=[pts[j],pts[i]];}
    return pts;
  }
  const shapes=OBRAS.map(sample);
  let W=0,H=0,F=0,cx=0,top=0,idx=0,label=OBRAS[0].n,labelA=0;
  const parts=Array.from({length:N},()=>({x:Math.random(),y:Math.random(),tx:0,ty:0,y2:Math.random()<.12,ph:Math.random()*6.28}));
  function size(){const d=Math.min(devicePixelRatio||1,2),r=hero.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
    F=Math.min(H*.86,W>860?W*.46:W*.85);cx=W>860?W*.3:W/2;top=H-F-H*.08;}
  function target(i){const pts=shapes[i];parts.forEach((p,k)=>{const q=pts[k%pts.length];p.tx=q[0]+(Math.random()-.5)*.006;p.ty=q[1]+(Math.random()-.5)*.006;});label=OBRAS[i].n;labelA=0;}
  function paint(t){
    ctx.clearRect(0,0,W,H);
    for(const p of parts){
      const x=cx-F/2+p.x*F,y=top+p.y*F,tw=still?0:.08*Math.sin(t*2+p.ph);
      ctx.globalAlpha=(p.y2?.5:.28)+tw;ctx.fillStyle=p.y2?"#e0c400":"#1e4982";
      ctx.fillRect(x,y,p.y2?2.2:1.8,p.y2?2.2:1.8);
    }
    ctx.globalAlpha=.6*labelA;ctx.fillStyle="#1e4982";ctx.font="500 12px 'IBM Plex Mono',monospace";ctx.textAlign="center";
    ctx.fillText(label,cx,Math.min(H-10,top+F+22));ctx.globalAlpha=1;
  }
  size();target(0);
  if(still){parts.forEach(p=>{p.x=p.tx;p.y=p.ty;});labelA=1;paint(0);addEventListener("resize",()=>{size();paint(0);});return;}
  addEventListener("resize",size);
  let last=performance.now(),clock=0;
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
    if(clock>STEP){clock=0;idx=(idx+1)%OBRAS.length;target(idx);}
    const k=1-Math.pow(.03,dt);
    for(const p of parts){p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;}
    labelA=Math.min(1,labelA+dt*.6);
    paint(now/1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();



// AFFFAIR 360° Gercek 3D Kumas Fizigi + Chiaroscuro Golgeleme (0 harici kutuphane, 60fps)
var cv=document.getElementById("stage"), ctx=cv.getContext("2d");
var W=0, H=0, DPR=Math.min(window.devicePixelRatio||1,2);
function resize(){W=window.innerWidth;H=window.innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);}
window.addEventListener("resize",resize); resize();

var fabrics=[
  {code:"PANTONE 19-5420 TCX · ZÜMRÜT İPEK", rgb:[14,104,84], spec:0.95, rough:0.22, wave:1.15},
  {code:"PANTONE 18-1442 TCX · YANIK TOPRAK KETEN", rgb:[182,91,58], spec:0.35, rough:0.65, wave:0.85},
  {code:"PANTONE 11-0604 TCX · KAYMAKTAŞI MERİNOS", rgb:[232,223,209], spec:0.55, rough:0.48, wave:0.95},
  {code:"PANTONE 19-4024 TCX · GECE ÇİVİTİ KAŞMİR", rgb:[26,42,74], spec:0.62, rough:0.42, wave:1.05}
];
var curFab=0, yaw=0.38, pitch=0.22, autoOrbit=false, mode8D=true;
var drag=false, lx=0, ly=0, mx=0, my=0, windPushX=0, windPushY=0, t=0;

function setFabric(i,el){
  curFab=i;
  document.querySelectorAll(".sw").forEach(function(b){b.classList.remove("active");});
  if(el) el.classList.add("active");
  document.getElementById("fabricLabel").textContent=fabrics[i].code;
  syncState();
}
function toggle8D(){mode8D=!mode8D;document.getElementById("btn8d").classList.toggle("on",mode8D);syncState();}
function toggleAuto(){autoOrbit=!autoOrbit;document.getElementById("btnAuto").classList.toggle("on",autoOrbit);syncState();}
function syncState(){
  window.__AFFFAIR_STATE__={
    schema:"afffair.360-cloth.v1", zaman:"2026-11-25T04:39:30",
    fabric:fabrics[curFab].code, yawDeg:Math.round((yaw*180/Math.PI)%360),
    wind:+document.getElementById("windRng").value, lightDeg:+document.getElementById("lightRng").value,
    surreal8D:mode8D, autoOrbit:autoOrbit
  };
}

cv.addEventListener("pointerdown",function(e){drag=true;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);});
cv.addEventListener("pointerup",function(){drag=false;});
cv.addEventListener("pointermove",function(e){
  var nx=(e.clientX/W)*2-1, ny=(e.clientY/H)*2-1;
  windPushX+=(nx-mx)*2.6; windPushY+=(ny-my)*2.6; mx=nx; my=ny;
  if(drag){yaw+=(e.clientX-lx)*0.008; pitch=Math.max(-1.05,Math.min(1.05,pitch+(e.clientY-ly)*0.007)); lx=e.clientX; ly=e.clientY; syncState();}
});

var COLS=34, ROWS=22, pts=[];
function buildMesh(){
  pts=[];
  var f=fabrics[curFab];
  var wind=(+document.getElementById("windRng").value)/10;
  for(var r=0;r<=ROWS;r++){
    var row=[];
    var v=r/ROWS; // 0 ust kenar -> 1 alt etek
    for(var c=0;c<=COLS;c++){
      var u=c/COLS;
      var x=(u-0.5)*3.4;
      var y=(v-0.5)*2.35;
      // Gercekci ruzgar dalgasi + etek serbestligi + surreail 8D burgu
      var free=Math.pow(v,0.85)*0.85+0.15;
      var z=Math.sin(u*5.4-t*2.4+v*2.1)*0.24*wind*f.wave*free
           +Math.cos(u*9.2+v*4.3-t*3.1)*0.09*wind*free
           +windPushX*0.28*Math.sin(u*Math.PI)*free
           +windPushY*0.18*Math.sin(v*Math.PI);
      var sx=x, sy=y;
      if(mode8D){
        var twist=Math.sin(t*0.9+v*3.2)*0.14*v;
        sx=x*Math.cos(twist)-z*Math.sin(twist);
        z=x*Math.sin(twist)+z*Math.cos(twist)+Math.sin(u*3.14+t)*0.12;
      }
      row.push([sx,sy,z]);
    }
    pts.push(row);
  }
}

function rot3(p,cy,sy,cp,sp){
  var x1=p[0]*cy-p[2]*sy, z1=p[0]*sy+p[2]*cy;
  var y2=p[1]*cp-z1*sp, z2=p[1]*sp+z1*cp;
  return [x1,y2,z2];
}

function draw(){
  t+=0.018;
  windPushX*=0.93; windPushY*=0.93;
  if(autoOrbit&&!drag) yaw+=0.0065;
  buildMesh();

  // Los ortam arka plani + hafif surreail 8D aura
  var bg=ctx.createRadialGradient(W*0.52,H*0.48,30,W*0.5,H*0.5,Math.max(W,H)*0.68);
  var base=fabrics[curFab].rgb;
  bg.addColorStop(0,"rgba("+Math.round(base[0]*0.32)+","+Math.round(base[1]*0.32)+","+Math.round(base[2]*0.36)+",1)");
  bg.addColorStop(0.55,"#09090f");
  bg.addColorStop(1,"#040407");
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Surreal 8D isik halkasi (arka planda loş atmosfer)
  if(mode8D){
    ctx.save(); ctx.translate(W*0.5,H*0.5);
    ctx.strokeStyle="rgba(213,180,118,0.14)"; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.ellipse(0,0,Math.min(W,H)*0.36,Math.min(W,H)*0.16,Math.sin(t*0.4)*0.3,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  var cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
  var fov=Math.min(W,H)*0.82, camZ=4.35;
  var lang=(+document.getElementById("lightRng").value)*Math.PI/180;
  var lx3=Math.cos(lang)*0.8, ly3=-0.45, lz3=Math.sin(lang)*0.8+0.6;
  var llen=Math.hypot(lx3,ly3,lz3); lx3/=llen; ly3/=llen; lz3/=llen;

  // Tum 3D noktalarini dondur ve 2D projeksiyon al
  var proj=[];
  for(var r=0;r<=ROWS;r++){
    var prow=[];
    for(var c=0;c<=COLS;c++){
      var q=rot3(pts[r][c],cy,sy,cp,sp);
      var s=fov/(camZ-q[2]);
      prow.push([W*0.5+q[0]*s, H*0.5+q[1]*s, q[2], q[0], q[1]]);
    }
    proj.push(prow);
  }

  // Ressam algoritmasi (Z-sirali gercek 360° derinlik & chiaroscuro golge)
  var quads=[];
  for(var r=0;r<ROWS;r++){
    for(var c=0;c<COLS;c++){
      var a=proj[r][c], b=proj[r][c+1], d=proj[r+1][c], e=proj[r+1][c+1];
      var zAvg=(a[2]+b[2]+d[2]+e[2])*0.25;
      // Yuzey normali
      var ux=b[3]-a[3], uy=b[4]-a[4], uz=b[2]-a[2];
      var vx=d[3]-a[3], vy=d[4]-a[4], vz=d[2]-a[2];
      var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      var nl=Math.hypot(nx,ny,nz)||1; nx/=nl; ny/=nl; nz/=nl;
      if(nz<0){nx=-nx;ny=-ny;nz=-nz;}
      quads.push([zAvg,a,b,e,d,nx,ny,nz,r,c]);
    }
  }
  quads.sort(function(p,q){return p[0]-q[0];});

  var f=fabrics[curFab];
  for(var i=0;i<quads.length;i++){
    var q=quads[i];
    var ndl=Math.max(0,q[5]*lx3+q[6]*ly3+q[7]*lz3);
    // Chiaroscuro los isik + ipek specular parlamasi + ince dokuma mikro-tanesi
    var spec=Math.pow(Math.max(0,q[7]*0.7+ndl*0.5),14)*f.spec*95;
    var weave=((q[8]+q[9])%2===0)?1.03:0.95;
    var amb=0.14, diff=ndl*0.92;
    var lum=(amb+diff)*weave;
    var rr=Math.min(255,Math.round(base[0]*lum+spec*1.05));
    var gg=Math.min(255,Math.round(base[1]*lum+spec*0.96));
    var bb=Math.min(255,Math.round(base[2]*lum+spec*0.82));
    ctx.fillStyle="rgb("+rr+","+gg+","+bb+")";
    ctx.beginPath();
    ctx.moveTo(q[1][0],q[1][1]); ctx.lineTo(q[2][0],q[2][1]);
    ctx.lineTo(q[3][0],q[3][1]); ctx.lineTo(q[4][0],q[4][1]);
    ctx.closePath(); ctx.fill();
  }
  requestAnimationFrame(draw);
}
syncState(); draw();

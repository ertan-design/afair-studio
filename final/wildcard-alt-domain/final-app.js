
function hash12(s){
  var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return ("00000000"+(h>>>0).toString(16)).slice(-8);
}
function sec(h){document.getElementById("hostIn").value=h;coz();}
function coz(){
  var raw=(document.getElementById("hostIn").value||"rufat.afair.studio").trim().toLowerCase();
  var parts=raw.split(".");
  var sub=parts.length>=3?parts[0]:"merkez";
  var root=parts.length>=3?parts.slice(1).join("."):raw;
  var t0=performance.now();
  var tip="GENEL", baslik=sub.toUpperCase()+" · "+root, aciklama="Tek wildcard motoruyla anında çözümlenen alt domain.", renk="PANTONE 19-5420 TCX";
  if(root.indexOf("afair.studio")>=0){
    tip="TASARIMCI ATÖLYE & SERGİ";
    baslik=sub.toUpperCase()+" · AFFFAIR STUDIO";
    aciklama="Tasarımcının aynı anda üretim yapıp 360° rüzgârlı kumaş sahnesinde sergilediği özel alt domain.";
    renk=sub==="rufat"?"PANTONE 19-4024 TCX (Gece Çiviti)":"PANTONE 19-5420 TCX (Zümrüt İpek)";
  } else if(root.indexOf("modernatasehir")>=0){
    tip="1.000 KONUT MİSAFİR AI KAPISI";
    baslik=sub.toUpperCase()+" · ATAŞEHİR MODERN";
    aciklama="Daire misafirine özel online terzi (afair.live), tarım danışmanı (tarim.online), toplantı odası ve stüdyo erişimi.";
    renk="PANTONE 11-0604 TCX (Kaymaktaşı)";
  } else if(root.indexOf("atasehirmodern")>=0){
    tip="AIOS 3D CITY · SOKAK / UFUK DÜĞÜMÜ";
    baslik=sub.toUpperCase()+" · 3D CITY PİLOT";
    aciklama="Ataşehir 3D City pilotunda sıfır Google Maps ile anında açılan sokak/bölge uçuş düğümü.";
    renk="PANTONE 18-1442 TCX (Yanık Toprak)";
  } else if(root.indexOf("afair.live")>=0){
    tip="CANLI DEFİLE & YAYIN SAHNESİ";
    baslik=sub.toUpperCase()+" · AFFFAIR LIVE";
    aciklama="Dünya moda haftaları, canlı defile akışı, iki mezura evde randevu ve anlık koleksiyon bağlantısı.";
    renk="PANTONE 19-0303 TCX (Loş Sahne)";
  }
  var ms=(performance.now()-t0).toFixed(2);
  var kimlik="WC-"+hash12(raw).toUpperCase();
  document.getElementById("pTag").textContent=tip+" · "+kimlik;
  document.getElementById("pTitle").textContent=baslik;
  document.getElementById("pDesc").textContent=aciklama;
  document.getElementById("pMeta").innerHTML=
    '<div class="mbox"><div class="k">Alt Domain</div><div class="v">'+sub+'</div></div>'+
    '<div class="mbox"><div class="k">Kök Domain</div><div class="v">'+root+'</div></div>'+
    '<div class="mbox"><div class="k">Çözümleme</div><div class="v">'+ms+' ms (0 klasör)</div></div>'+
    '<div class="mbox"><div class="k">İmza Pantone</div><div class="v">'+renk+'</div></div>';
  var obj={schema:"gaia.wildcard.tenant.v1",host:raw,tenant:sub,root:root,id:kimlik,foldersCreatedOnDisk:0,pantone:renk};
  document.getElementById("pJson").textContent=JSON.stringify(obj,null,2);
}
var qp=new URLSearchParams(window.location.search).get("host");
if(qp) document.getElementById("hostIn").value=qp;
coz();

;
document.querySelectorAll('[data-kf-ev="kf_ev_0"]').forEach(el => el.addEventListener("click", function(event) { coz(); }));
document.querySelectorAll('[data-kf-ev="kf_ev_1"]').forEach(el => el.addEventListener("click", function(event) { sec('rufat.afair.studio'); }));
document.querySelectorAll('[data-kf-ev="kf_ev_2"]').forEach(el => el.addEventListener("click", function(event) { sec('dila.afair.studio'); }));
document.querySelectorAll('[data-kf-ev="kf_ev_3"]').forEach(el => el.addEventListener("click", function(event) { sec('blok-a-104.modernatasehir.com'); }));
document.querySelectorAll('[data-kf-ev="kf_ev_4"]').forEach(el => el.addEventListener("click", function(event) { sec('blok-c-312.modernatasehir.com'); }));
document.querySelectorAll('[data-kf-ev="kf_ev_5"]').forEach(el => el.addEventListener("click", function(event) { sec('watergarden.atasehirmodern.com'); }));
document.querySelectorAll('[data-kf-ev="kf_ev_6"]').forEach(el => el.addEventListener("click", function(event) { sec('finanskent.atasehirmodern.com'); }));
document.querySelectorAll('[data-kf-ev="kf_ev_7"]').forEach(el => el.addEventListener("click", function(event) { sec('runway.afair.live'); }));

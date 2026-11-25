'use strict';
// Recovered from KarbonZip: CRC32 table, central-directory reader and STORE layout.
// All metadata is validated before bounded decompression or rendering.
const PaketAtolyesi = (() => {
  const limits = Object.freeze({entries:256, entry:32*1024*1024, total:128*1024*1024, archive:64*1024*1024});
  const table = new Uint32Array(256);
  for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;table[i]=c>>>0;}
  function crc32(bytes){let c=0xFFFFFFFF;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
  function safeName(name){
    if(typeof name!=='string'||!name||name.length>1024||/[\\:\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(name)||name.startsWith('/')||name.normalize('NFC')!==name)throw Error('Güvensiz dosya yolu.');
    const pieces=name.replace(/\/$/,'').split('/');
    if(pieces.some(p=>!p||p==='.'||p==='..'||/[. ]$/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))throw Error('Güvensiz dosya yolu.');
    return name;
  }
  async function parseZip(buffer){
    const u=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
    if(u.length>limits.archive)throw Error('ZIP 64 MiB sınırını aşıyor.');
    const v=new DataView(u.buffer,u.byteOffset,u.byteLength);
    const range=(p,n)=>{if(!Number.isSafeInteger(p)||p<0||n<0||p+n>u.length)throw Error('Kesik veya bozuk ZIP.');};
    let end=-1;
    for(let p=u.length-22;p>=Math.max(0,u.length-65557);p--)if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===u.length){end=p;break;}
    if(end<0)throw Error('ZIP son kaydı bulunamadı.');
    const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),start=v.getUint32(end+16,true);
    if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count||count===65535||start===0xffffffff||size===0xffffffff)throw Error('Çok parçalı ZIP / ZIP64 desteklenmiyor.');
    if(count>limits.entries||start+size!==end)throw Error('Girdi sınırı veya merkezi dizin hatası.');
    range(start,size);let p=start,total=0;const entries=[],names=new Set(),spans=[];
    for(let i=0;i<count;i++){
      range(p,46);if(v.getUint32(p,true)!==0x02014b50)throw Error('Merkezi dizin imzası bozuk.');
      const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),crc=v.getUint32(p+16,true),compSize=v.getUint32(p+20,true),uncompSize=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),el=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),off=v.getUint32(p+42,true);
      range(p,46+nl+el+cl);
      if(flags&~0x080e||method===99)throw Error('Şifreli veya desteklenmeyen ZIP bayrakları.');
      if(method!==0&&method!==8)throw Error('Yalnızca STORE ve DEFLATE desteklenir.');
      if(v.getUint16(p+34,true)||((v.getUint32(p+38,true)>>>16)&0xf000)===0xa000)throw Error('Bağlantı veya disk girdisi reddedildi.');
      const nb=u.subarray(p+46,p+46+nl);
      if(!(flags&2048)&&nb.some(b=>b>127))throw Error('UTF-8 olmayan dosya adı desteklenmiyor.');
      const name=safeName(new TextDecoder('utf-8',{fatal:true}).decode(nb)),key=name.toLowerCase();
      if(names.has(key))throw Error('Yinelenen dosya yolu.');names.add(key);
      total+=uncompSize;if(uncompSize>limits.entry||total>limits.total||compSize>limits.archive)throw Error('Açılmış boyut sınırı aşıldı.');
      range(off,30);if(v.getUint32(off,true)!==0x04034b50||v.getUint16(off+6,true)!==flags||v.getUint16(off+8,true)!==method)throw Error('Yerel başlık uyuşmazlığı.');
      const ln=v.getUint16(off+26,true),le=v.getUint16(off+28,true),data=off+30+ln+le;range(off,30+ln+le);range(data,compSize);
      if(ln!==nl||!nb.every((b,j)=>b===u[off+30+j])||data+compSize>start)throw Error('Yerel yol veya veri sınırı hatası.');
      if(!(flags&8)&&(v.getUint32(off+14,true)!==crc||v.getUint32(off+18,true)!==compSize||v.getUint32(off+22,true)!==uncompSize))throw Error('Yerel boyut / CRC uyuşmazlığı.');
      if(method===0&&compSize!==uncompSize)throw Error('STORE boyutu uyuşmuyor.');
      if(name.endsWith('/')&&uncompSize!==0)throw Error('Dizin verisi reddedildi.');
      spans.push([off,data+compSize]);entries.push(Object.freeze({name,flags,method,crc,compSize,uncompSize,rawSlice:u.slice(data,data+compSize)}));p+=46+nl+el+cl;
    }
    if(p!==end)throw Error('Merkezi dizin uzunluğu uyuşmuyor.');
    spans.sort((a,b)=>a[0]-b[0]);for(let i=1;i<spans.length;i++)if(spans[i][0]<spans[i-1][1])throw Error('Çakışan ZIP girdileri.');
    return {count,entries};
  }
  async function extractEntry(e){
    safeName(e.name);if(e.uncompSize>limits.entry||e.rawSlice.length>limits.archive)throw Error('Boyut sınırı.');
    let out;
    if(e.method===0)out=e.rawSlice.slice();
    else if(e.method===8){
      const reader=new Blob([e.rawSlice]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();const chunks=[];let length=0;
      try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>e.uncompSize||length>limits.entry){await reader.cancel();throw Error('Açma boyutu sınırı aşıldı.');}chunks.push(value);}}finally{reader.releaseLock();}
      out=new Uint8Array(length);let p=0;for(const c of chunks){out.set(c,p);p+=c.length;}
    }else throw Error('Yöntem desteklenmiyor.');
    if(out.length!==e.uncompSize||crc32(out)!==e.crc)throw Error('CRC32 veya dosya boyutu uyuşmuyor.');
    return {bytes:out,sha256:await sha256(out)};
  }
  async function sha256(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
  function buildStoreZip(files){
    if(!Array.isArray(files)||files.length>limits.entries)throw Error('Girdi sınırı.');
    const parts=[],cds=[],names=new Set();let offset=0,total=0;
    for(const f of files){const name=safeName(f.name),key=name.toLowerCase(),nb=new TextEncoder().encode(name),db=f.bytes instanceof Uint8Array?f.bytes:new TextEncoder().encode(String(f.bytes));
      if(names.has(key))throw Error('Yinelenen yol.');names.add(key);total+=db.length;
      if(db.length>limits.entry||total>limits.total||nb.length>65535||(name.endsWith('/')&&db.length))throw Error('Boyut sınırı.');
      const crc=crc32(db),lh=new Uint8Array(30),lv=new DataView(lh.buffer),ch=new Uint8Array(46),cv=new DataView(ch.buffer);
      lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,2048,true);lv.setUint16(12,33,true);lv.setUint32(14,crc,true);lv.setUint32(18,db.length,true);lv.setUint32(22,db.length,true);lv.setUint16(26,nb.length,true);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,2048,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,db.length,true);cv.setUint32(24,db.length,true);cv.setUint16(28,nb.length,true);cv.setUint32(42,offset,true);
      parts.push(lh,nb,db);cds.push(ch,nb);offset+=30+nb.length+db.length;
    }
    const cdSize=cds.reduce((s,c)=>s+c.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer),length=offset+cdSize+22;
    if(length>limits.archive)throw Error('Üretilen ZIP 64 MiB sınırını aşıyor.');
    ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cdSize,true);ev.setUint32(16,offset,true);
    const out=new Uint8Array(length);let p=0;for(const c of [...parts,...cds,end]){out.set(c,p);p+=c.length;}return out;
  }
  return Object.freeze({parseZip,parse:parseZip,extractEntry,buildStoreZip,build:buildStoreZip,crc32,sha256,limits});
})();
window.PaketAtolyesi=PaketAtolyesi;
const $=id=>document.getElementById(id);
let state=null,previewURL=null,busy=false;
const urls=new Set();
function revokePreview(){if(previewURL){URL.revokeObjectURL(previewURL);urls.delete(previewURL);previewURL=null;}}
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function download(bytes,name,type){const url=URL.createObjectURL(new Blob([bytes],{type}));urls.add(url);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);},30000);}
function controls(disabled){$('zipInput').disabled=disabled;$('manifest').disabled=disabled||!state;$('exportZip').disabled=disabled||!state;for(const b of $('entries').querySelectorAll('button'))b.disabled=disabled;}
async function task(fn){if(busy)return;busy=true;controls(true);try{await fn();}catch(e){status(e.message||'İşlem başarısız.',true);}finally{busy=false;controls(false);}}
async function preview(entry){await task(async()=>{revokePreview();const host=$('preview');host.replaceChildren();const {bytes,sha256}=await PaketAtolyesi.extractEntry(entry);const info=document.createElement('p');info.textContent=`${entry.name} · ${bytes.length} bayt · CRC32 doğru · SHA-256: ${sha256}`;host.append(info);
  const ext=entry.name.split('.').pop().toLowerCase();const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'};
  if(types[ext]){if(types[ext].startsWith('image/')){previewURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Görsel okunamadı.'));reader.readAsDataURL(new Blob([bytes],{type:types[ext]}));});}else{previewURL=URL.createObjectURL(new Blob([bytes],{type:types[ext]}));urls.add(previewURL);}const media=document.createElement(types[ext].startsWith('image/')?'img':'video');if(media.tagName==='IMG')media.alt=entry.name;else{media.controls=true;media.preload='metadata';}media.src=previewURL;host.append(media);}
  else if(ext==='pdf'){const b=document.createElement('button');b.textContent='PDF indir';b.addEventListener('click',()=>download(bytes,entry.name.split('/').pop(),'application/octet-stream'));host.append(b);}
  else{const pre=document.createElement('pre');pre.textContent=new TextDecoder().decode(bytes.subarray(0,65536))+(bytes.length>65536?'\n[İlk 64 KiB gösteriliyor.]':'');host.append(pre);}
});}
$('zipInput').addEventListener('change',()=>task(async()=>{state=null;revokePreview();$('entries').replaceChildren();$('preview').textContent='Listeden bir dosya seç.';const file=$('zipInput').files[0];if(!file)return;if(file.size>PaketAtolyesi.limits.archive)throw Error('ZIP 64 MiB sınırını aşıyor.');status('Arşiv doğrulanıyor…');const buffer=await file.arrayBuffer(),parsed=await PaketAtolyesi.parseZip(buffer);for(const e of parsed.entries)await PaketAtolyesi.extractEntry(e);state={name:file.name,sha256:await PaketAtolyesi.sha256(buffer),entries:parsed.entries};for(const e of parsed.entries){const li=document.createElement('li'),b=document.createElement('button');b.textContent=`${e.name} · ${e.uncompSize.toLocaleString('tr-TR')} bayt`;b.addEventListener('click',()=>preview(e));li.append(b);$('entries').append(li);}status(`${parsed.count} girdi doğrulandı. SHA-256: ${state.sha256}`);}));
$('manifest').addEventListener('click',()=>task(async()=>{const entries=[];for(const e of state.entries){const r=await PaketAtolyesi.extractEntry(e);entries.push({name:e.name,bytes:r.bytes.length,crc32:e.crc.toString(16).padStart(8,'0'),sha256:r.sha256});}download(JSON.stringify({schema:'paket-atolyesi.v1',archive:state.name,sha256:state.sha256,entries},null,2),'manifest.json','application/json');status('Manifest hazır.');}));
$('exportZip').addEventListener('click',()=>task(async()=>{const files=[];for(const e of state.entries)files.push({name:e.name,bytes:(await PaketAtolyesi.extractEntry(e)).bytes});download(PaketAtolyesi.buildStoreZip(files),'paket-store.zip','application/zip');status('CRC32 doğrulanmış STORE ZIP hazır.');}));
window.addEventListener('pagehide',()=>{for(const url of urls)URL.revokeObjectURL(url);urls.clear();});


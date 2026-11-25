
'use strict';
const $ = id => document.getElementById(id);
const KEY = 'afffair-studio-v1';
const HEX = /^#[a-f0-9]{6}$/i;
const SLUG = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,39}$/;
const IMAGE = /^data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/;
const makeId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const sample = () => ({
  id: makeId(), designer:'Örnek stüdyo', slug:'ornek', title:'Doku Etüdü',
  note:'Keten, yün ve kadifeden oluşan bir renk ve yüzey çalışması.',
  looks:[
    {id:makeId(),name:'Kum ışığı',material:'Keten',color:'#b78e6b',image:''},
    {id:makeId(),name:'Gece katı',material:'Yün',color:'#3f4b61',image:''},
    {id:makeId(),name:'Sedir yeşili',material:'Kadife',color:'#596255',image:''}
  ]
});
function sanitizeLook(raw){
  if(!raw || typeof raw !== 'object') throw Error('Parça kaydı geçersiz.');
  const image=raw.image||'';
  if(typeof image !== 'string' || image.length>140000 || (image && !IMAGE.test(image))) throw Error('Parça görseli geçersiz veya fazla büyük.');
  const name=clean(raw.name,80);
  if(!name || !HEX.test(raw.color)) throw Error('Parça adı ve rengi gerekli.');
  return {id:clean(raw.id,80)||makeId(),name,material:clean(raw.material,70),color:raw.color,image};
}
function sanitizeDraft(raw){
  if(!raw || typeof raw !== 'object' || !Array.isArray(raw.looks) || raw.looks.length>12) throw Error('Taslak biçimi geçersiz.');
  const designer=clean(raw.designer,70), slug=clean(raw.slug,40), title=clean(raw.title,85);
  if(!designer || !title || !SLUG.test(slug)) throw Error('Tasarımcı, adres etiketi ve koleksiyon adı gerekli.');
  const looks=raw.looks.map(sanitizeLook);
  if(new Set(looks.map(look=>look.id)).size!==looks.length) throw Error('Parça kimlikleri tekrar ediyor.');
  return {id:clean(raw.id,80)||makeId(),designer,slug,title,note:clean(raw.note,500),looks};
}
function readState(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved && Array.isArray(saved.items) && saved.items.length && saved.items.length<=8){
      const items=saved.items.map(sanitizeDraft);
      if(new Set(items.map(item=>item.id)).size===items.length)
        return {active:items.some(item=>item.id===saved.active)?saved.active:items[0].id,items};
    }
  }catch{}
  const draft=sample();
  return {active:draft.id,items:[draft]};
}
let state=readState(), editing=null, busy=false;
const active=()=>state.items.find(item=>item.id===state.active);
function status(message,error=false){
  $('status').textContent=message;
  $('status').classList.toggle('error',error);
}
function save(message){
  try{
    localStorage.setItem(KEY,JSON.stringify(state));
    status(message);
  }catch{
    status('Bu tarayıcı yeni kaydı saklayamadı. Çalışmayı korumak için taslağı dışa aktar.',true);
  }
}
function getProfile(){
  return {designer:$('designer').value.trim(),slug:$('slug').value.trim(),title:$('title').value.trim(),note:$('note').value.trim()};
}
function renderOptions(){
  const options=state.items.map(item=>{
    const option=document.createElement('option');option.value=item.id;option.textContent=item.title + ' · ' + item.designer;return option;
  });
  $('drafts').replaceChildren(...options);
  $('drafts').value=state.active;
  $('newDraft').disabled=busy || state.items.length>=8;
}
function fillProfile(){
  const draft=active();
  for(const key of ['designer','slug','title','note']) $(''+key).value=draft[key];
  renderOptions();resetLook();render();
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
}
function swatchNode(look){
  const visual=document.createElement('div');visual.className='visual';visual.style.setProperty('--swatch',look.color);
  if(look.image){const img=document.createElement('img');img.src=look.image;img.alt=look.name;visual.append(img);}
  return visual;
}
function render(){
  const draft=active(), fields=getProfile();
  $('previewDesigner').textContent=fields.designer || 'Tasarımcı';
  $('previewTitle').textContent=fields.title || 'Yeni koleksiyon';
  $('previewNote').textContent=fields.note;
  $('tenant').textContent=SLUG.test(fields.slug) ? fields.slug+'.afair.studio · Önizleme' : 'Stüdyo adres etiketi bekleniyor';
  const cover=$('cover'), first=draft.looks[0];cover.style.setProperty('--swatch',first ? first.color : '#596255');
  cover.querySelector('.coverimg')?.remove();
  if(first?.image){const img=document.createElement('img');img.className='coverimg';img.alt='';img.src=first.image;cover.prepend(img);}
  $('empty').hidden=draft.looks.length>0;
  $('looks').replaceChildren(...draft.looks.map(look=>{
    const item=document.createElement('li');item.className='look-card';item.append(swatchNode(look));
    const info=document.createElement('div');info.className='look-info';
    const name=document.createElement('strong');name.textContent=look.name;
    const material=document.createElement('small');material.textContent=look.material||look.color.toUpperCase();
    const actions=document.createElement('div');actions.className='cardactions';
    const edit=document.createElement('button');edit.type='button';edit.textContent='Düzenle';edit.setAttribute('aria-label',look.name+' düzenle');edit.disabled=busy;
    edit.addEventListener('click',()=>editLook(look.id));
    const del=document.createElement('button');del.type='button';del.textContent='Kaldır';del.setAttribute('aria-label',look.name+' kaldır');del.disabled=busy;
    del.addEventListener('click',()=>{
      if(!confirm('“'+look.name+'” parçası bu taslaktan kaldırılsın mı?'))return;
      if(editing===look.id) resetLook();
      draft.looks=draft.looks.filter(item=>item.id!==look.id);save('Parça kaldırıldı.');render();
    });
    actions.append(edit,del);info.append(name,material,actions);item.append(info);return item;
  }));
  $('saveLook').disabled=busy || (!editing && draft.looks.length>=12);
}
function resetLook(){
  editing=null;$('lookForm').reset();$('saveLook').textContent='Parça ekle';$('cancelEdit').hidden=true;
}
function editLook(id){
  const look=active().looks.find(item=>item.id===id); if(!look)return;
  editing=id;$('lookName').value=look.name;$('material').value=look.material;
  $('swatch').value=look.color;$('image').value='';$('cancelEdit').hidden=false;$('saveLook').textContent='Değişikliği kaydet';
  render();$('lookName').focus();
}
function preserveProfile(){
  if(!$('profileForm').reportValidity())return false;
  const profile=getProfile();
  if(!profile.designer || !profile.title || !SLUG.test(profile.slug)){
    status('Geçerli bir tasarımcı, stüdyo etiketi ve koleksiyon adı gir.',true);return false;
  }
  if(state.items.some(item=>item.id!==state.active && item.slug===profile.slug)){
    status('Bu stüdyo etiketi başka bir yerel taslakta kullanılıyor.',true);return false;
  }
  Object.assign(active(),profile);renderOptions();return true;
}
async function imageData(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024) throw Error('PNG, JPEG veya WebP biçiminde 12 MB altında bir görsel seç.');
  const object=URL.createObjectURL(file);
  try{
    const img=new Image();
    img.src=object;
    await img.decode();
    if(!img.naturalWidth||!img.naturalHeight)throw Error('Görsel açılamadı.');
    const canvas=document.createElement('canvas');
    for(const scale of [860,640,460,320,240]){
      const ratio=Math.min(1,scale/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      for(const format of ['image/webp','image/jpeg']){
        const result=canvas.toDataURL(format,.68);
        if(result.length<=140000 && IMAGE.test(result))return result;
      }
    }
    throw Error('Görsel tarayıcı taslağına sığmadı. Daha küçük bir görsel seç.');
  }finally{URL.revokeObjectURL(object);}
}
function download(content,mime,name){
  const href=URL.createObjectURL(new Blob([content],{type:mime}));
  const link=document.createElement('a');link.href=href;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(href),30000);
}
function gallery(draft){
  const cover=draft.looks[0];
  const cards=draft.looks.map(look=>'<article><div class="swatch" style="background:'+look.color+'">'+(look.image?'<img alt="'+escapeHtml(look.name)+'" src="'+look.image+'">':'')+'</div><h2>'+escapeHtml(look.name)+'</h2><p>'+escapeHtml(look.material||look.color)+'</p></article>').join('');
  return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'"><title>'+escapeHtml(draft.title)+'</title><link rel="stylesheet" href="./style-2.css"></head><body><main><header>'+(cover?.image?'<img alt="" src="'+cover.image+'">':'')+'<div><p>'+escapeHtml(draft.designer)+'</p><h1>'+escapeHtml(draft.title)+'</h1><p>'+escapeHtml(draft.note)+'</p></div></header><section aria-label="Koleksiyon parçaları">'+cards+'</section></main></body></html>';
}
$('profileForm').addEventListener('input',render);
$('profileForm').addEventListener('submit',event=>{
  event.preventDefault();if (preserveProfile()){save('Taslak kaydedildi.');render();}
});
$('drafts').addEventListener('change',()=>{
  if(busy)return;
  state.active=$('drafts').value;fillProfile();save('Taslak açıldı.');
});
$('newDraft').addEventListener('click',()=>{
  if(busy || state.items.length>=8)return;
  let slot=1;while(state.items.some(item=>item.slug==='taslak-'+slot))slot++;
  const draft={id:makeId(),designer:'Yeni tasarımcı',slug:'taslak-'+slot,title:'Yeni koleksiyon',note:'',looks:[]};
  state.items.push(draft);state.active=draft.id;fillProfile();save('Yeni çalışma alanı açıldı.');$('designer').focus();
});
$('lookForm').addEventListener('submit',async event=>{
  event.preventDefault();
  if(busy || !preserveProfile())return;
  const draft=active(), id=editing, source=$('image').files[0];
  const name=$('lookName').value.trim(),material=$('material').value.trim(),color=$('swatch').value;
  if(!name || (!id && draft.looks.length>=12))return;
  busy=true;$('drafts').disabled=true;renderOptions();render();
  try{
    const original=draft.looks.find(item=>item.id===id);
    const image=source ? await imageData(source) : (original?.image||'');
    const look=sanitizeLook({id:id||makeId(),name,material,color,image});
    draft.looks=original?draft.looks.map(item=>item.id===id?look:item):[...draft.looks,look];
    resetLook();save(original?'Parça güncellendi.':'Parça sergiye eklendi.');
  }catch(error){status(error.message,true);}finally{busy=false;$('drafts').disabled=false;renderOptions();render();}
});
$('cancelEdit').addEventListener('click',()=>{if(!busy){resetLook();render();}});
$('exportHtml').addEventListener('click',()=>{
  if(busy || !preserveProfile())return;const d=active();download(gallery(d),'text/html;charset=utf-8',d.slug+'-sergi.html');save('Çevrimdışı sergi dosyası hazır.');
});
$('exportJson').addEventListener('click',()=>{
  if(busy || !preserveProfile())return;const d=active();download(JSON.stringify({format:'afffair-studio',version:1,draft:d},null,2),'application/json',d.slug+'-taslak.json');save('Taşınabilir taslak dosyası hazır.');
});
$('importBtn').addEventListener('click',()=>{if(!busy)$('importFile').click();});
$('importFile').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';
  if(!file||busy)return;
  try{
    if(file.size>2400000)throw Error('Taslak dosyası çok büyük.');
    const content=JSON.parse(await file.text());
    if(content?.format!=='afffair-studio'||content.version!==1)throw Error('Bu dosya AFFFAIR Studio taslağı değil.');
    const draft=sanitizeDraft(content.draft);
    const same=state.items.findIndex(item=>item.id===draft.id);
    if(state.items.some(item=>item.id!==draft.id&&item.slug===draft.slug))throw Error('Bu adres etiketi başka bir taslakta kullanılıyor.');
    if(same<0 && state.items.length>=8)throw Error('En fazla sekiz yerel taslak saklanabilir.');
    if(same>=0){if(!confirm('Aynı taslağın mevcut sürümü güncellensin mi?'))return;state.items[same]=draft;}else state.items.push(draft);
    state.active=draft.id;fillProfile();save('Taslak içe aktarıldı.');
  }catch(error){status(error.message,true);}
});
fillProfile();

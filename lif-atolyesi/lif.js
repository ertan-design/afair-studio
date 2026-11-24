'use strict';
(() => {
  const fibers = Object.freeze({pamuk:'Pamuk',keten:'Keten',yun:'Yün',ipek:'İpek'});
  const weaves = Object.freeze({bezayagi:'Bezayağı · 1/1',dimi:'Dimi · 2/2',saten:'Saten · 5 uçlu şema'});
  const colors = Object.freeze({aqua:{name:'Akuamarin',rgb:[127,255,212]},apricot:{name:'Kayısı',rgb:[255,182,115]},coral:{name:'Mercan',rgb:[255,111,97]},blue:{name:'Mavi',rgb:[47,95,163]}});
  const lights = Object.freeze({notr:{name:'Nötr stüdyo',rgb:[1,1,1]},sicak:{name:'Sıcak iç mekân',rgb:[1.08,0.94,0.78]},serin:{name:'Serin gün ışığı',rgb:[0.82,0.98,1.1]}});
  const form = document.getElementById('ayarlar');
  const comparisonStatus = document.getElementById('karsilastirma-durum');
  const transferStatus = document.getElementById('aktarim-durum');
  function field(id) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLSelectElement)) throw new Error('Malzeme kontrolü bulunamadı: '+id);
    return element;
  }
  function readState() {
    const sample = suffix => {
      const fiber = field('lif-'+suffix).value;
      const weave = field('orgu-'+suffix).value;
      const color = field('renk-'+suffix).value;
      if (!Object.hasOwn(fibers,fiber) || !Object.hasOwn(weaves,weave) || !Object.hasOwn(colors,color)) throw new Error('Geçersiz malzeme seçimi.');
      return {fiber,weave,color};
    };
    const light = field('isik').value;
    const scale = field('olcek').value;
    if (!Object.hasOwn(lights,light) || !['yakin','genel'].includes(scale)) throw new Error('Geçersiz görünüm seçimi.');
    return {a:sample('a'),b:sample('b'),light,scale};
  }
  function threadOnTop(weave,x,y) {
    if (weave === 'bezayagi') return (x+y)%2 === 0;
    if (weave === 'dimi') return (x+y)%4 < 2;
    return (x+2*y)%5 !== 0;
  }
  function shade(rgb,multiplier) {
    return 'rgb('+rgb.map(n=>Math.max(0,Math.min(255,Math.round(n*multiplier)))).join(',')+')';
  }
  function draw(canvas,sample,light,scale) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Dokuma tuvali bulunamadı.');
    const ctx=canvas.getContext('2d',{alpha:false});
    if (!ctx) throw new Error('Bu tarayıcı çizim önizlemesini desteklemiyor. Seçim kartını yine indirebilirsin.');
    const width=canvas.width,height=canvas.height;
    const rgb=colors[sample.color].rgb.map((n,i)=>Math.min(255,n*lights[light].rgb[i]));
    ctx.fillStyle=shade(rgb,.22);ctx.fillRect(0,0,width,height);
    const unit=scale==='yakin'?42:20;
    const thickness=sample.fiber==='yun'?.91:sample.fiber==='keten'?.71:sample.fiber==='ipek'?.82:.78;
    const gleam=sample.fiber==='ipek'?.30:sample.fiber==='keten'?.12:sample.fiber==='yun'?.05:.15;
    const cols=Math.ceil(width/unit),rows=Math.ceil(height/unit);
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
      const warpTop=threadOnTop(sample.weave,x,y);
      const variation=1+Math.sin(x*17+y*29)*.035;
      const pad=unit*(1-thickness)*.5;
      const gradient=warpTop?ctx.createLinearGradient(x*unit,0,(x+1)*unit,0):ctx.createLinearGradient(0,y*unit,0,(y+1)*unit);
      gradient.addColorStop(0,shade(rgb,.42*variation));gradient.addColorStop(.4,shade(rgb,(.78+gleam)*variation));gradient.addColorStop(.62,shade(rgb,(.91+gleam)*variation));gradient.addColorStop(1,shade(rgb,.48*variation));
      ctx.fillStyle=gradient;
      ctx.fillRect(x*unit+(warpTop?pad:0),y*unit+(warpTop?0:pad),unit-(warpTop?pad*2:0),unit-(warpTop?0:pad*2));
      ctx.strokeStyle=shade(rgb,.52);ctx.lineWidth=.8;
      ctx.beginPath();
      for(let strand=1;strand<5;strand++) {
        if(warpTop){const px=x*unit+pad+strand*(unit-pad*2)/5;ctx.moveTo(px,y*unit);ctx.lineTo(px,(y+1)*unit);}
        else {const py=y*unit+pad+strand*(unit-pad*2)/5;ctx.moveTo(x*unit,py);ctx.lineTo((x+1)*unit,py);}
      }
      ctx.stroke();
    }
    const fold=ctx.createLinearGradient(0,0,width,height);
    fold.addColorStop(0,'rgba(0,0,0,.35)');fold.addColorStop(.35,'rgba(255,255,255,.04)');fold.addColorStop(.55,'rgba(0,0,0,.20)');fold.addColorStop(.8,'rgba(255,255,255,.10)');fold.addColorStop(1,'rgba(0,0,0,.25)');
    ctx.fillStyle=fold;ctx.fillRect(0,0,width,height);
  }
  function render() {
    try {
      const state=readState();
      for(const suffix of ['a','b']) {
        const sample=state[suffix];
        document.getElementById('ad-'+suffix).textContent=fibers[sample.fiber]+' · '+weaves[sample.weave];
        const caption=colors[sample.color].name+' renk niyeti · '+lights[state.light].name+'. Tedarikçi numunesi ve fiziksel ölçüm bekleniyor.';
        document.getElementById('ozet-'+suffix).textContent=caption;
        const canvas=document.getElementById('tuval-'+suffix);
        canvas.setAttribute('aria-label',suffix.toUpperCase()+' adayı: '+fibers[sample.fiber]+', '+weaves[sample.weave]+', '+caption+' Temsili çizim.');
        draw(canvas,sample,state.light,state.scale);
      }
      comparisonStatus.textContent='A: '+fibers[state.a.fiber]+' / B: '+fibers[state.b.fiber]+'. İkisi de '+lights[state.light].name.toLocaleLowerCase('tr-TR')+' denemesinde. Fiziksel uygunluk ölçülmedi.';
    } catch(error) {
      comparisonStatus.textContent=error instanceof Error?error.message:'Önizleme açılamadı. Sayfayı yenileyebilirsin.';
    }
  }
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('change',render);
  document.getElementById('yer-degistir').addEventListener('click',()=>{
    for(const name of ['lif','orgu','renk']) {const a=field(name+'-a'),b=field(name+'-b');const value=a.value;a.value=b.value;b.value=value;}
    render();
  });
  document.getElementById('kart-indir').addEventListener('click',()=>{
    try {
      const state=readState();
      const pack={schema:'afair.material-intent.v1',created_at:new Date().toISOString(),purpose:'physical-swatch-discussion',samples:{a:state.a,b:state.b},illustrative_light:state.light,illustrative_scale:state.scale,physical_sample_verified:false,supplier:null,batch:null,composition_verified:null,weight_gsm:null,yarn_count:null,pantone_reference:null,delta_e:null,stock_verified:false,certification_verified:false,notice:'Illustrative design intent only. Not a measured fabric specification, inventory claim or color match.'};
      const url=URL.createObjectURL(new Blob([JSON.stringify(pack,null,2)],{type:'application/json;charset=utf-8'}));
      const anchor=document.createElement('a');anchor.href=url;anchor.download='afair-lif-karsilastirma.json';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
      transferStatus.textContent='Karşılaştırma kartı indirildi. İçinde kişisel ölçü veya iletişim bilgisi yok; hiçbir sunucuya gönderilmedi.';
    } catch(error) {transferStatus.textContent=error instanceof Error?error.message:'Kart indirilemedi.';}
  });
  render();
})();

(function () {
  "use strict";

  var U = window.PRIZMA_UTILS;

  var VIDEOS = [
    {
      id: "master_reel",
      file: "DILA_04_MARKA_FILMI_MASTER_REEL.mp4",
      poster: "DILA_04_MARKA_FILMI_MASTER_REEL.jpg",
      title: "Dila × AFAIR — 3 Sahne Birleşik Marka Filmi (Master Reel)",
      dur: 15,
      kb: 3912,
      ms: 1376,
      fps: 327.0,
      codec: "h264_nvenc / aac",
      sha16: "123ae1af03e1cdd0",
      not: "3 sahne xfade geçişi + 3 akorlu K7 akustik gitar (10,9× gerçek zamanlı)"
    },
    {
      id: "scene1",
      file: "DILA_01_IKI_MEZURA_TERZI.mp4",
      poster: "DILA_01_IKI_MEZURA_TERZI.jpg",
      title: "Sahne 1 · İki Mezura Evde Terzi Ritüeli (K1)",
      dur: 6,
      kb: 1477,
      ms: 771,
      fps: 233.5,
      codec: "h264_nvenc / aac",
      sha16: "d55b0ff26e2485ff",
      not: "İstanbul gün ışığı, iki pirinç-keten mezura, oksitlenmiş zümrüt & espresso kumaş"
    },
    {
      id: "scene2",
      file: "DILA_02_AFAIR_STUDIO_AI_GALERI.mp4",
      poster: "DILA_02_AFAIR_STUDIO_AI_GALERI.jpg",
      title: "Sahne 2 · AFAIR Studio AI Sanat Galerisi & K5 Sanart",
      dur: 6,
      kb: 1588,
      ms: 728,
      fps: 247.3,
      codec: "h264_nvenc / aac",
      sha16: "8677875daf93c03d",
      not: "3600K müze spotu, traverten duvar, zümrüt-altın tablo ve uyumlu ipek manto"
    },
    {
      id: "scene3",
      file: "DILA_03_YENI_SIYAH_AKUSTIK.mp4",
      poster: "DILA_03_YENI_SIYAH_AKUSTIK.jpg",
      title: "Sahne 3 · Yeni Siyah, Doğal Lif & K7 Akustik Atmosfer",
      dur: 6,
      kb: 1396,
      ms: 666,
      fps: 270.3,
      codec: "h264_nvenc / aac",
      sha16: "a0e225357133f6bd",
      not: "Derin patlıcan ipek, ay ışığı antrasit kaşmir, ham keten ve klasik akustik gitar"
    },
    {
      id: "hf_galeri",
      file: "HF_01_GALERIDE_IPEK_FASTSTART.mp4",
      poster: "HF_01_GALERIDE_IPEK_FASTSTART.jpg",
      title: "Higgsfield Seedance 2.5 · Galeride İpek (+faststart)",
      dur: 5.05,
      kb: 1138,
      ms: 45,
      fps: 30.0,
      codec: "higgsfield / +faststart",
      sha16: "a3ffca3a1c008b73",
      not: "Gerçek Higgsfield Seedance 2.5 üretimi — moov@36 web +faststart onarımlı"
    },
    {
      id: "hf_terzi",
      file: "HF_02_TERZININ_DOKUNUSU_FASTSTART.mp4",
      poster: "HF_02_TERZININ_DOKUNUSU_FASTSTART.jpg",
      title: "Higgsfield Seedance 2.5 · Terzinin Dokunuşu (+faststart)",
      dur: 5.05,
      kb: 1146,
      ms: 42,
      fps: 30.0,
      codec: "higgsfield / +faststart",
      sha16: "003a90b236854b5f",
      not: "Gerçek Higgsfield Seedance 2.5 üretimi — moov@36 web +faststart onarımlı"
    }
  ];

  var BENCH_ROWS = [
    ["DILA_01 (RTX 3090 h264_nvenc)", "6,0 sn", "771 ms", "233,5 FPS", "1.477 KB", "d55b0ff26e2485ff"],
    ["DILA_01 (Ryzen 9600X libx264 CPU)", "6,0 sn", "1.398 ms", "128,8 FPS", "631 KB", "cpu-bench"],
    ["DILA_02 (RTX 3090 h264_nvenc)", "6,0 sn", "728 ms", "247,3 FPS", "1.588 KB", "8677875daf93c03d"],
    ["DILA_03 (RTX 3090 h264_nvenc)", "6,0 sn", "666 ms", "270,3 FPS", "1.396 KB", "a0e225357133f6bd"],
    ["DILA_04 Master Reel (RTX 3090 NVENC)", "15,0 sn", "1.376 ms", "327,0 FPS", "3.912 KB", "123ae1af03e1cdd0"],
    ["HF_01 Galeride İpek (Seedance 2.5 +faststart)", "5,05 sn", "kayıpsız remux", "moov@36", "1.138 KB", "a3ffca3a1c008b73"],
    ["HF_02 Terzinin Dokunuşu (Seedance 2.5 +faststart)", "5,05 sn", "kayıpsız remux", "moov@36", "1.146 KB", "003a90b236854b5f"]
  ];

  var HF_JOBS = [
    {
      id: "HF-01",
      title: "Higgsfield Image-to-Video · Sahne 1 (İki Mezura)",
      model: "bytedance/seedance-2.0/image-to-video",
      payload: {
        prompt: "Slow 35mm anamorphic dolly-in across a sunlit Istanbul travertine tailoring table; two brass-tipped linen measuring tapes beside folded oxidized emerald raw silk (#132E2A) and warm night espresso wool (#2A1E1B); soft 3800K morning light, zero pure black.",
        resolution: "720p",
        duration: 6,
        aspect_ratio: "16:9",
        generate_audio: true
      }
    },
    {
      id: "HF-02",
      title: "Higgsfield Image-to-Video · Sahne 2 (AFAIR Studio Galeri)",
      model: "bytedance/seedance-2.0/image-to-video",
      payload: {
        prompt: "Smooth museum crane pan across a travertine art gallery lit by 3600K spotlights; abstract emerald, deep plum, and gold-leaf canvas harmonizing beside a tailored oxidized-emerald silk coat on a wooden form; zero pure black.",
        resolution: "720p",
        duration: 6,
        aspect_ratio: "16:9",
        generate_audio: true
      }
    },
    {
      id: "HF-03",
      title: "Higgsfield Image-to-Video · Sahne 3 (Yeni Siyah & Gitar)",
      model: "higgsfield/dop-turbo/image-to-video",
      payload: {
        prompt: "Macro slow-motion ripple of translucent deep eggplant plum silk (#2D1C2B), moonlight slate cashmere (#1B2230), and raw linen beside a rosewood classical guitar and brass shears in golden dust-mote sunbeams; zero pure black.",
        resolution: "720p",
        duration: 6,
        aspect_ratio: "16:9",
        generate_audio: true
      }
    },
    {
      id: "HF-04",
      title: "Higgsfield Sunucu cURL Şablonu (Authorization: Key)",
      model: "POST https://api.higgsfield.ai/{model}",
      payload: {
        curl: "curl -X POST https://api.higgsfield.ai/bytedance/seedance-2.0/text-to-video -H \"Authorization: Key $HF_API_KEY\" -H \"Content-Type: application/json\" -d '{\"prompt\":\"Dila x AFAIR travertine gallery, oxidized emerald silk, no pure black\",\"resolution\":\"720p\",\"duration\":5,\"aspect_ratio\":\"16:9\",\"generate_audio\":true}'"
      }
    }
  ];

  var activeId = "master_reel";
  var blobUrl = null;

  function selectVideo(vid) {
    activeId = vid.id;
    var player = document.getElementById("vid-main-player");
    var heading = document.getElementById("master-film-baslik");
    var meta = document.getElementById("vid-active-meta");
    if (heading) heading.textContent = vid.title + " (" + vid.dur + " sn)";
    if (player) {
      player.poster = "./video/" + vid.poster;
      player.src = "./video/" + vid.file;
      player.load();
    }
    if (meta) {
      U.clearEl(meta);
      meta.appendChild(U.el("span", "dna-pill dna-pill-ok", vid.codec));
      meta.appendChild(U.el("span", "dna-pill", "1280×720 · 30 fps · " + vid.dur + " sn"));
      meta.appendChild(U.el("span", "dna-pill", vid.kb.toLocaleString("tr-TR") + " KB"));
      meta.appendChild(U.el("span", "dna-pill", "Render: " + vid.ms + " ms (" + vid.fps + " FPS)"));
      meta.appendChild(U.el("span", "dna-pill", "SHA-16: " + vid.sha16));
    }
    renderPlaylist();
  }

  function renderPlaylist() {
    var box = document.getElementById("vid-playlist");
    if (!box) return;
    U.clearEl(box);
    for (var i = 0; i < VIDEOS.length; i++) {
      (function (v) {
        var card = U.el("article", "concept-card" + (v.id === activeId ? " card-gold" : ""));
        var img = document.createElement("img");
        img.className = "poster-thumb";
        img.src = "./video/" + v.poster;
        img.alt = v.title;
        card.appendChild(img);
        card.appendChild(U.el("strong", "", v.title));
        card.appendChild(U.el("p", "", v.not));
        card.appendChild(U.el("p", "status-note", v.dur + " sn · " + v.kb + " KB · " + v.ms + " ms"));
        var row = U.el("div", "btn-row");
        var b = U.el("button", "btn" + (v.id === activeId ? " btn-gold" : ""), v.id === activeId ? "Seçili" : "Oynat");
        b.type = "button";
        b.addEventListener("click", function () { selectVideo(v); });
        var dl = U.el("a", "btn", "MP4 ↓");
        dl.href = "./video/" + v.file;
        dl.download = v.file;
        row.appendChild(b);
        row.appendChild(dl);
        card.appendChild(row);
        box.appendChild(card);
      })(VIDEOS[i]);
    }
  }

  function renderBench() {
    var tb = document.getElementById("vid-bench-tbody");
    if (!tb) return;
    U.clearEl(tb);
    for (var i = 0; i < BENCH_ROWS.length; i++) {
      var tr = document.createElement("tr");
      for (var j = 0; j < BENCH_ROWS[i].length; j++) {
        var td = document.createElement("td");
        if (j === 5) td.appendChild(U.el("code", "", BENCH_ROWS[i][j]));
        else td.textContent = BENCH_ROWS[i][j];
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
  }

  function renderHfCards() {
    var grid = document.getElementById("vid-hf-grid");
    var st = document.getElementById("vid-hf-status");
    if (!grid) return;
    U.clearEl(grid);
    for (var i = 0; i < HF_JOBS.length; i++) {
      (function (j) {
        var card = U.el("article", "prompt-card");
        var head = U.el("div", "prompt-head");
        head.appendChild(U.el("strong", "", j.id + " · " + j.title));
        var txt = j.payload.curl ? j.payload.curl : JSON.stringify({ endpoint: j.model, body: j.payload }, null, 2);
        var cp = U.el("button", "btn", "Kopyala");
        cp.type = "button";
        cp.addEventListener("click", function () {
          U.copyText(txt, st, j.id + " Higgsfield API isteği kopyalandı.");
        });
        head.appendChild(cp);
        card.appendChild(head);
        card.appendChild(U.el("pre", "mono-box", txt));
        grid.appendChild(card);
      })(HF_JOBS[i]);
    }
  }

  function renderDnaStrip() {
    var strip = document.getElementById("vid-dna-strip");
    if (!strip) return;
    U.clearEl(strip);
    var dna = U.readStore("prizma_dila_dna_v1");
    if (dna) {
      strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Aktif Dila DNA: " + dna.arketip_ad + " · Yeni Siyah: " + dna.yeni_siyah));
    } else {
      strip.appendChild(U.el("span", "dna-pill dna-pill-ok", "Aktif Film Paleti: Oksitlenmiş Zümrüt + Gece Espressosu + Derin Patlıcan (0 Saf Siyah)"));
    }
    strip.appendChild(U.el("span", "dna-pill dna-pill-warn", "Higgsfield Cloud API: HF_API_KEY bekleniyor -> RTX 3090 Yerel Motor Aktif"));
  }

  function wireLocalDrop() {
    var inp = document.getElementById("vid-local-file");
    var prev = document.getElementById("vid-local-preview");
    var st = document.getElementById("vid-local-status");
    if (!inp || !prev) return;
    inp.addEventListener("change", function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(f);
      prev.src = blobUrl;
      prev.classList.remove("is-hidden");
      if (st) st.textContent = "Yüklendi (yalnız bu cihazda): " + f.name + " (" + Math.round(f.size / 1024) + " KB)";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderDnaStrip();
    selectVideo(VIDEOS[0]);
    renderBench();
    renderHfCards();
    wireLocalDrop();
  });
})();

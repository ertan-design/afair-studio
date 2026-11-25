(function () {
  "use strict";

  var ARCHETYPES = {
    sicak_altin: {
      id: "sicak_altin",
      ad: "Sıcak Altın Toprak",
      alt_ton: "Sıcak / Kehribar",
      yeni_siyah: { ad: "Gece Espressosu", hex: "#2A1E1B" },
      yasak_renkler: [
        { ad: "Saf Siyah (VETO)", hex: "#000000" },
        { ad: "Buzul Fuşya", hex: "#FF1E90" },
        { ad: "Neon Buz Mavisi", hex: "#35D6FF" }
      ],
      altin_palet: [
        { ad: "Antik Kehribar", hex: "#C88A3B" },
        { ad: "Yanık Terrakota", hex: "#A44A34" },
        { ad: "Zeytin Kadife", hex: "#4D5D3B" },
        { ad: "Ham Keten Kremi", hex: "#E8DCC5" },
        { ad: "Gece Espressosu", hex: "#2A1E1B" }
      ],
      neden_siyah_yasak: "Saf #000000 siyah, sıcak altın alt-tonun ciltteki kehribar yansımasını bastırıp göz altını sertleştirir. Gece Espressosu (#2A1E1B) aynı ciddiyeti sıcak derinlikle korur.",
      galeri_tarzi: "Oda 01 · Gece Espressosu & Ham Toprak",
      oda_id: "oda_01",
      kumas_oneri: "Organik Ham Keten + Fırçalanmış Sıcak Yün",
      akustik_mod: "D Maj9 · 74 BPM · Sıcak Akustik",
      akor_hz: [293.66, 369.99, 440.0, 554.37, 659.25]
    },
    derin_zeytin: {
      id: "derin_zeytin",
      ad: "Derin Zeytin Kadife",
      alt_ton: "Zeytin / Nötr-Derin",
      yeni_siyah: { ad: "Oksitlenmiş Zümrüt", hex: "#132E2A" },
      yasak_renkler: [
        { ad: "Saf Siyah (VETO)", hex: "#000000" },
        { ad: "Tebeşir Pastel Pembe", hex: "#F7CFE1" },
        { ad: "Kireç Beyazı", hex: "#FFFFFF" }
      ],
      altin_palet: [
        { ad: "Oksitlenmiş Zümrüt", hex: "#132E2A" },
        { ad: "Bronz Pirinç", hex: "#B08A48" },
        { ad: "Derin İncir", hex: "#4F273A" },
        { ad: "Taş Kumu", hex: "#CFC2AC" },
        { ad: "Gece Petrolü", hex: "#1D444E" }
      ],
      neden_siyah_yasak: "Saf #000000 siyah, zeytin-nötr alt-tondaki doğal ipek ışıltıyı söndürür ve yüz hattında keskin gölge kopması yaratır. Oksitlenmiş Zümrüt (#132E2A) cildi anında aydınlatır.",
      galeri_tarzi: "Oda 02 · Oksitlenmiş Zümrüt & Bronz",
      oda_id: "oda_02",
      kumas_oneri: "Ham İpek Krep + Doğal Kökboya Gabardin",
      akustik_mod: "E Min9 · 68 BPM · Derin Akustik",
      akor_hz: [329.63, 392.0, 493.88, 587.33, 739.99]
    },
    yumusak_safak: {
      id: "yumusak_safak",
      ad: "Yumuşak Şafak İpeği",
      alt_ton: "Yumuşak Nötr / Gül-Gümüş",
      yeni_siyah: { ad: "Derin Patlıcan Mürdüm", hex: "#2D1C2B" },
      yasak_renkler: [
        { ad: "Saf Siyah (VETO)", hex: "#000000" },
        { ad: "Sinyal Turuncusu", hex: "#FF5500" },
        { ad: "Asit Sarısı", hex: "#E8FF00" }
      ],
      altin_palet: [
        { ad: "Derin Patlıcan Mürdüm", hex: "#2D1C2B" },
        { ad: "Tozlu Gül Kurusu", hex: "#B37A84" },
        { ad: "Adaçayı Sis", hex: "#7C9286" },
        { ad: "Fildişi İpek", hex: "#EAE3D7" },
        { ad: "Dumanlı Kakao", hex: "#5C474B" }
      ],
      neden_siyah_yasak: "Düşük-orta kontrastlı yumuşak alt-tonda saf siyah kişinin önüne geçer; kıyafet görünür, yüz geri çekilir. Derin Patlıcan Mürdüm (#2D1C2B) yüzü merkezde tutar.",
      galeri_tarzi: "Oda 03 · Mürdüm & Ham Keten Galerisi",
      oda_id: "oda_03",
      kumas_oneri: "Yıkanmış Doğal İpek + Organik Pamuk Vual",
      akustik_mod: "A Maj7 · 70 BPM · Şafak Arpej",
      akor_hz: [220.0, 277.18, 329.63, 415.3, 493.88]
    },
    serin_kristal: {
      id: "serin_kristal",
      ad: "Serin Porselen Kristal",
      alt_ton: "Serin / Ay Işığı",
      yeni_siyah: { ad: "Ay Işığı Antrasit", hex: "#1B2230" },
      yasak_renkler: [
        { ad: "Saf Siyah (VETO)", hex: "#000000" },
        { ad: "Hardal Sarısı", hex: "#C79A1E" },
        { ad: "Pas Turuncusu", hex: "#B84C24" }
      ],
      altin_palet: [
        { ad: "Ay Işığı Antrasit", hex: "#1B2230" },
        { ad: "Gece Çiviti", hex: "#213659" },
        { ad: "Buzlu Gümüş", hex: "#B8C4D4" },
        { ad: "Kuzey Safiri", hex: "#386890" },
        { ad: "Kış Mürdümü", hex: "#5A3656" }
      ],
      neden_siyah_yasak: "Saf #000000 düz siyah serin porselen tonda sert yapay kontrast üretir; Ay Işığı Antrasit (#1B2230) ve Gece Çiviti derinliği keskinleştirmeden soylulaştırır.",
      galeri_tarzi: "Oda 04 · Ay Işığı Antrasit Salonu",
      oda_id: "oda_04",
      kumas_oneri: "İnce Soğuk Yün + Saten-Mat İpek Karışımı",
      akustik_mod: "C# Min9 · 78 BPM · Kristal Akustik",
      akor_hz: [277.18, 329.63, 415.3, 493.88, 622.25]
    }
  };

  var CONCEPTS = [
    { id: "K1", rol: "ANA", ad: "AFAIR LIVE — İki Mezura & Dila AI Terzi", hedef: "afair.live", sicrama: "Evde iki mezura + renk teşhisi ile dila_dna_v1 profilini üretip K2..K8'i tetikler." },
    { id: "K2", rol: "YAN 1", ad: "AFAIR STUDIO — AI Galeri Art", hedef: "afair.studio", sicrama: "K1 DNA paletiyle kişisel AI sanat sergisi odaları ve ışık kürasyonu kurar." },
    { id: "K3", rol: "YAN 2", ad: "ESTETİK — Renk Bilimi & Yasak Renk", hedef: "estetik", sicrama: "Alt-ton/kontrast bilimiyle saf siyah vetosunu ve Yeni Siyah paletini kanıtlar." },
    { id: "K4", rol: "YAN 3", ad: "KIYAFET — Mezura Kalıbı & Kapsül", hedef: "kıyafet", sicrama: "Mezura-A/B ölçüleriyle yasak rengi engelleyip 12 parçalık dikim matrisi üretir." },
    { id: "K5", rol: "YAN 4", ad: "SANART — Mekân, Moda & Eser Harmonisi", hedef: "sanart", sicrama: "Üstündeki ceketle salondaki tabloyu aynı renk ve doku dilinde eşleştirir." },
    { id: "K6", rol: "YAN 5", ad: "PERMAKÜLTÜR — Doğal Lif & Pigment", hedef: "permakültür", sicrama: "Keten, ham ipek ve bitkisel pigment kökenini hasat.online / tarim.online ile bağlar." },
    { id: "K7", rol: "YAN 6", ad: "GİTAR — Akustik Sergi & Prova Atmosferi", hedef: "gitar", sicrama: "Her DNA arketipine ve sergi odasına özel çevrimdışı WebAudio armonik imza verir." },
    { id: "K8", rol: "YAN 7", ad: "DRONE + DİJİTAL PASAPORT & 50K KAPI", hedef: "selinahbap.com", sicrama: "Mekân drone çekimi + SHA-256 özgünlük pasaportu + 50.000 kapı vitrini mühürler." }
  ];

  var PROMPTS = [
    {
      id: "D01",
      baslik: "AFAIR LIVE · İki Mezura & Renk Teşhis Motoru",
      metin: "Rol: D01 (AFAIR LIVE Çekirdek). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: afair.live için iki mezura evde terzi gelişi ve 'AFAIR'dan Dila ben' renk analizi akışını tasarla. Cilt alt-tonu, kontrast ve ışık güven skoru üret; ışık zayıfsa 'emin değilim, pencere kenarında 10 sn tekrar bakalım' uyarısı ver. Saf #000000 siyahı veto edip Yeni Siyah alternatifini gerekçele. 0 dış CDN, SHA-16 mühür ve k='eksik' satırı zorunlu."
    },
    {
      id: "D02",
      baslik: "AFAIR STUDIO · AI-Based Galeri Art Kürasyonu",
      metin: "Rol: D02 (AFAIR STUDIO Galeri). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: dila_dna_v1 profilini girdi alan AI sanat galerisi odaları kur. Kullanıcının altın paletine göre 4 sergi odası, Kelvin ışık sıcaklığı (2700K-5600K) ve kürasyon anlatısı üret. Her eser kartı K1 terzi kumaşına geri bağlansın. 0 dış CDN, 0 sahte satış iddiası."
    },
    {
      id: "D03",
      baslik: "ESTETİK · Renk Bilimi & Siyah Veto Tablosu",
      metin: "Rol: D03 (Estetik & Renk Bilimi). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: 12 mevsim renk teorisini makine-okunur JSONL kural tablosuna dök. Saf siyahın neden bazı alt-tonları söndürdüğünü kontrast ve yansıma bilimiyle açıkla; her arketip için 5 altın renk + 3 yasak renk + 2 Yeni Siyah (HEX+HSL) üret. 2 koşuda birebir SHA-256 determinizmi kanıtla."
    },
    {
      id: "D04",
      baslik: "KIYAFET · İki Mezura Kalıbı & 12 Parça Kapsül",
      metin: "Rol: D04 (Kıyafet & Kapsül). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: Evde alınan Mezura-A (omuz/göğüs/bel/basen/kol) ve Mezura-B (hareket/nefes payı) ölçülerinden 12 parçalık sıfır-uyumsuzluk kapsül gardırop ve terzi dikim fişi üret. Yasak renk seçilirse otomatik Dila uyarısı verip K3'ten alternatif öner."
    },
    {
      id: "D05",
      baslik: "SANART · Moda + Mekân + Sanat Harmoni Köprüsü",
      metin: "Rol: D05 (Sanart & Mekân). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: K2 AFAIR Studio sanat eserlerini gerçek ev/duvar ışığı ve mimari paletlerle (modernataşehir / zehracevik.studio uyumlu) eşleştiren Mekân-Moda-Sanat Harmoni Matrisi kur. Temsili mekân verilerini açıkça 'temsili' etiketle."
    },
    {
      id: "D06",
      baslik: "PERMAKÜLTÜR · Doğal Lif & Ekolojik Pigment",
      metin: "Rol: D06 (Permakültür & Materyal). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: K1/K4 özel dikim kumaşları ve K2/K5 sanat tuvallerinde organik keten, ham ipek, soğuk yün ve bitkisel pigment seçim matrisi kur. Her altın renk için sentetik yerine doğal pigment karşılığını ve tarim.online / hasat.online temasını JSONL olarak kaydet."
    },
    {
      id: "D07",
      baslik: "GİTAR · Çok-Duyusal Akustik Atmosfer Motoru",
      metin: "Rol: D07 (Gitar & Akustik Atmosfer). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl kontratını oku. Görev: Evde mezura provası (K1) ve AI galeri gezisi (K2) için her DNA arketipine özel BPM, armonik mod ve dış MP3/CDN gerektirmeyen saf WebAudio akustik gitar profili tasarla."
    },
    {
      id: "D08",
      baslik: "DRONE + PASAPORT & 8-KONSEPT HAKEMİ",
      metin: "Rol: D08 (Senkron Hakem — Üreten Ölçmez). Önce https://ertanaraz.com/prizma/dila_8_konsept_senkron.jsonl ve https://ertanaraz.com/prizma/manifest.json dosyalarını oku. Görev: D01..D07 çıktılarının hepsini salt-okunur denetle: dila_dna_v1 şeması, SHA-256 pasaport bütünlüğü, 0 dış CDN, <24 KB rapor ve k='eksik' şeffaflığını ölç; başka ajanın dosyasını ezmeden hakem makbuzu yaz."
    }
  ];

  var CREATIVE_QUESTIONS = [
    "Yasak Renk Paradoksu: 'Siyah asla giymemen gerekiyor' dediğin anda siyahı kimliği sanan bir misafiri kaybetmeden büyülemek için Dila AI ona hangi Yeni Siyah'ı hangi sanat eseri üzerinden göstersin?",
    "İki Mezura Ritüeli: Terziler eve gittiğinde ilk 90 saniyede ne yaşansın ki misafir o anı kendi isteğiyle videoya çekip paylaşsın?",
    "Sıçrama Hafızası: Misafir bugün afair.live'da ceket diktirip 3 ay sonra afair.studio'da sergiye girdiğinde sistemin hatırlamasını en çok istediğin tek gizli detay nedir?",
    "Belirsizlik Estetiği: Işık kötüyse 'emin değilim, pencere kenarında 10 sn bakalım' diyen dürüst lüks bir Dila mı, yoksa her karede kesin hüküm veren iddialı bir Dila mı?",
    "İlk Pilot Sıçrama: Tek bir Dila DNA taramasıyla gardırobun + salon tablosunun + akşam akustik listesinin aynı anda doğmasını ilk hangi koleksiyonda sahneleyelim?"
  ];

  var GALLERY_ROOMS = [
    {
      id: "oda_01",
      no: "ODA 01",
      ad: "Gece Espressosu Atölyesi",
      arketip: "sicak_altin",
      onerilen_kelvin: 3200,
      duvar_baz: "#261E1B",
      cerceve: "#C88A3B",
      eser_ad: "Sıcak Toprakta Altın Drape #01",
      sanart_eslesme: "Doğal meşe duvar + ham keten perde + 3200K sıcak spot",
      kumas_eslesme: "Organik Ham Keten Ceket (Gece Espressosu #2A1E1B)"
    },
    {
      id: "oda_02",
      no: "ODA 02",
      ad: "Oksitlenmiş Zümrüt Salonu",
      arketip: "derin_zeytin",
      onerilen_kelvin: 3800,
      duvar_baz: "#132422",
      cerceve: "#B08A48",
      eser_ad: "Zümrüt Işık ve Bronz Kesit #02",
      sanart_eslesme: "Traverten taş yüzey + eskitilmiş pirinç aplik + 3800K galeri ışığı",
      kumas_eslesme: "Ham İpek Krep Takım (Oksitlenmiş Zümrüt #132E2A)"
    },
    {
      id: "oda_03",
      no: "ODA 03",
      ad: "Mürdüm & Ham Keten Galerisi",
      arketip: "yumusak_safak",
      onerilen_kelvin: 3600,
      duvar_baz: "#251B24",
      cerceve: "#D2A8AE",
      eser_ad: "Şafak Sisinde İpek Silüet #03",
      sanart_eslesme: "Kireç sıva fildişi duvar + adaçayı tekstil pano + 3600K yumuşak gün",
      kumas_eslesme: "Yıkanmış Doğal İpek Pardösü (Derin Patlıcan #2D1C2B)"
    },
    {
      id: "oda_04",
      no: "ODA 04",
      ad: "Ay Işığı Antrasit Odası",
      arketip: "serin_kristal",
      onerilen_kelvin: 4600,
      duvar_baz: "#181E2B",
      cerceve: "#B8C4D4",
      eser_ad: "Kuzey Safirinde Mimari Geometri #04",
      sanart_eslesme: "Brüt beton / buzlu cam niş + 4600K nötr müze ışığı",
      kumas_eslesme: "İnce Soğuk Yün Manto (Ay Işığı Antrasit #1B2230)"
    }
  ];

  var RCOMBO_SITES = [
    { id: "S1", site: "selinahbap.com", rol: "50.000 Kapı Ana Vitrini & Gaia Omurga", slot_bas: 1, slot_son: 12500, canli: "https://www.selinahbap.com/" },
    { id: "S2", site: "afair.live", rol: "İki Mezura, Terzi & Canlı Sahne", slot_bas: 12501, slot_son: 25000, canli: "https://www.afair.live/prizma/" },
    { id: "S3", site: "afair.studio", rol: "AI Sanat Galerisi & Dila Kürasyon", slot_bas: 25001, slot_son: 37500, canli: "https://www.afair.studio/prizma/" },
    { id: "S4", site: "ertanaraz.com", rol: "PRIZMA Komuta Merkezi & Gerçek İşler", slot_bas: 37501, slot_son: 50000, canli: "https://ertanaraz.com/prizma/" }
  ];

  var FLEET_44 = [
    { d: "afair.live", st: 200, ms: 7325, b: 16512, sha16: "6d4b505329d32ecc", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "afair.studio", st: 200, ms: 7074, b: 1690, sha16: "f299579c53b68689", p: "EXACT_MATCH" },
    { d: "xn--ataehirmodern-ktc.com", st: 200, ms: 7121, b: 1704, sha16: "789c0155dde324e4", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "xn--modernataehir-qtc.com", st: 200, ms: 7214, b: 1700, sha16: "4b0d1b475361eff4", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "atasehirmodern.com", st: 200, ms: 2606, b: 122185, sha16: "3ad5dbc7a771bafa", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "modernatasehir.com", st: 0, ms: 30, b: 0, sha16: "-", p: "LOCAL_READY_NOT_LIVE" },
    { d: "selinahbap.com", st: 200, ms: 7299, b: 16512, sha16: "6d4b505329d32ecc", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "ertanaraz.com", st: 200, ms: 3150, b: 47077, sha16: "d9cc793d010d8a88", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "pazar.live", st: 200, ms: 10335, b: 2625, sha16: "03909936c347277f", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "tarim.online", st: 200, ms: 7745, b: 68518, sha16: "f736a7d969303cea", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "hasat.online", st: 200, ms: 8058, b: 135299, sha16: "fa5f253c2be10c2d", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "ggmes.com", st: 503, ms: 3744, b: 302, sha16: "52f9a90fe3549817", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "gospor.com", st: 200, ms: 8085, b: 153331, sha16: "a997722fff1ea756", p: "EXACT_MATCH" },
    { d: "files.gospor.com", st: 503, ms: 4108, b: 302, sha16: "52f9a90fe3549817", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "prxs.gospor.com", st: 0, ms: 4503, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "vav.gospor.com", st: 503, ms: 4021, b: 302, sha16: "52f9a90fe3549817", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "prxs.com", st: 200, ms: 6720, b: 205452, sha16: "9c55479b68bba497", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "desreklam.com", st: 0, ms: 1, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "auroraluxury.co.uk", st: 0, ms: 16, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "baskaistanbulyok.com", st: 0, ms: 6565, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "macrotein.com", st: 0, ms: 16, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "pureaker.com", st: 0, ms: 3524, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "sarahvictorialtd.com", st: 0, ms: 16, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "siagmbh.com", st: 200, ms: 5732, b: 7768, sha16: "c6f275c38c0abe71", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "toiji.com", st: 200, ms: 5426, b: 4402, sha16: "c112568ec6a974fe", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "usludur.com", st: 530, ms: 4764, b: 7637, sha16: "3a4377b56ee66655", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "victoriahomeuk.com", st: 0, ms: 18, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "wallsbutik.com", st: 0, ms: 2, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "yayanteks.com", st: 200, ms: 7504, b: 2999, sha16: "f12218e3bebbad7b", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "zehrac.com", st: 530, ms: 4794, b: 7634, sha16: "e023efb72c2d78b0", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "zehracevik.com", st: 530, ms: 5076, b: 7646, sha16: "9a2480baa48524b3", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "zehra-cevik.com", st: 530, ms: 5024, b: 7649, sha16: "c75e7476fecc7019", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "zehracevik.live", st: 530, ms: 5118, b: 7649, sha16: "6914e7ed6c4c06f2", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "zehracevik.net", st: 530, ms: 5117, b: 7646, sha16: "dbfc1cd67151745c", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "zehracevik.online", st: 530, ms: 5004, b: 7655, sha16: "3d97c13def8687ac", p: "LOCAL_READY_NOT_LIVE" },
    { d: "zehracevik.org", st: 530, ms: 5256, b: 7646, sha16: "1c7f67d216054b29", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "zehracevik.studio", st: 530, ms: 5229, b: 7655, sha16: "875a1b5c0b560e9d", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "ortak.live", st: 200, ms: 3491, b: 9316, sha16: "789ae35d83939bee", p: "LIVE_DIFFERS_FROM_LOCAL" },
    { d: "emre.ertanaraz.com", st: 200, ms: 4891, b: 94517, sha16: "44e6ee1b98c27b13", p: "EXACT_MATCH" },
    { d: "codekafa.com", st: 200, ms: 8689, b: 15270, sha16: "c54197298628ddde", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "afffair.com", st: 200, ms: 5480, b: 44827, sha16: "6f35a844aa828890", p: "LIVE_ONLY_OR_NO_LOCAL_HTML" },
    { d: "ito.prxs.com", st: 0, ms: 2, b: 0, sha16: "-", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "app.tarim.online", st: 503, ms: 4493, b: 99, sha16: "7fd2048b5b467f7b", p: "NOT_LIVE_NO_LOCAL_HTML" },
    { d: "app.pazar.live", st: 0, ms: 4884, b: 0, sha16: "-", p: "LOCAL_READY_NOT_LIVE" }
  ];

  function fnv64Hex(str) {
    var h1 = 0x811c9dc5;
    var h2 = 0x9e3779b9;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= (c + i);
      h2 = Math.imul(h2, 0x85ebca6b);
    }
    var p1 = (h1 >>> 0).toString(16).padStart(8, "0");
    var p2 = (h2 >>> 0).toString(16).padStart(8, "0");
    return p1 + p2;
  }

  function sha16Async(str, cb) {
    var fallback = fnv64Hex(str);
    try {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        var bytes = new TextEncoder().encode(str);
        window.crypto.subtle.digest("SHA-256", bytes).then(function (buf) {
          var arr = new Uint8Array(buf);
          var hex = "";
          for (var i = 0; i < 8; i++) {
            hex += arr[i].toString(16).padStart(2, "0");
          }
          cb(hex);
        }).catch(function () { cb(fallback); });
        return;
      }
    } catch (_e) {}
    cb(fallback);
  }

  function readStore(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function writeStore(key, obj) {
    try {
      window.localStorage.setItem(key, JSON.stringify(obj));
      return true;
    } catch (_e) {
      return false;
    }
  }

  var audioCtx = null;
  function playChord(freqs) {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime;
      for (var i = 0; i < freqs.length; i++) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freqs[i], now + i * 0.09);
        gain.gain.setValueAtTime(0.0001, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.085, now + i * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 1.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 1.4);
      }
      return true;
    } catch (_e) {
      return false;
    }
  }

  function copyText(str, statusEl, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).then(function () {
        if (statusEl) statusEl.textContent = okMsg || "Panoya kopyalandı.";
      }).catch(function () {
        if (statusEl) statusEl.textContent = "Pano izni kapalı — aşağıdaki metni elle seçip kopyalayabilirsiniz.";
      });
    } else if (statusEl) {
      statusEl.textContent = "Otomatik pano yok — metni elle seçip kopyalayabilirsiniz.";
    }
  }

  function downloadText(filename, text, statusEl) {
    try {
      var blob = new Blob([text], { type: "application/x-ndjson;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      if (statusEl) statusEl.textContent = filename + " indirildi (" + text.length + " karakter).";
    } catch (_e) {
      copyText(text, statusEl, "İndirme kısıtlı — içerik panoya kopyalandı.");
    }
  }

  function clearEl(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function el(tag, cls, txt) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (txt !== undefined && txt !== null) node.textContent = String(txt);
    return node;
  }

  window.PRIZMA_DATA = {
    ARCHETYPES: ARCHETYPES,
    CONCEPTS: CONCEPTS,
    PROMPTS: PROMPTS,
    CREATIVE_QUESTIONS: CREATIVE_QUESTIONS,
    GALLERY_ROOMS: GALLERY_ROOMS,
    RCOMBO_SITES: RCOMBO_SITES,
    FLEET_44: FLEET_44
  };

  window.PRIZMA_UTILS = {
    fnv64Hex: fnv64Hex,
    sha16Async: sha16Async,
    readStore: readStore,
    writeStore: writeStore,
    playChord: playChord,
    copyText: copyText,
    downloadText: downloadText,
    clearEl: clearEl,
    el: el
  };
})();

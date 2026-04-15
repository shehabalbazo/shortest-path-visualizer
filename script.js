// ===== GRAF (AĞ) TANIMLAMALARI =====
// vis.js kullanılarak düğümler ve kenarlar tanımlanıyor
let dugumler = new vis.DataSet([
  { id: 1, label: "A" },
  { id: 2, label: "B" },
  { id: 3, label: "C" },
  { id: 4, label: "D" },
  { id: 5, label: "E" }
]);

let kenarlar = new vis.DataSet([
  { id: 1, from: 1, to: 2, label: "4" },
  { id: 2, from: 1, to: 3, label: "2" },
  { id: 3, from: 2, to: 3, label: "1" },
  { id: 4, from: 2, to: 4, label: "5" },
  { id: 5, from: 3, to: 4, label: "8" },
  { id: 6, from: 3, to: 5, label: "10" },
  { id: 7, from: 4, to: 5, label: "2" }
]);

// Grafı HTML içindeki 'ag' id'li div'e çizdiriyoruz
let ag = new vis.Network(
  document.getElementById("ag"),
  { nodes: dugumler, edges: kenarlar },
  { edges: { arrows: "to" }, physics: false } // physics: false düğümlerin sabit durmasını sağlar
);

// ===== DURUM YÖNETİMİ VE ANİMASYON =====
let adimlar = []; // Algoritmanın her bir adımını (ekran görüntüsü gibi) kaydedeceğimiz dizi
let guncelAdim = -1; // Şu an ekranda gösterilen adımın indeksi
let oynatmaZamanlayici = null; // Otomatik oynatma için zamanlayıcı (timer)
let oynuyorMu = false; // Animasyonun oynayıp oynamadığını kontrol eden bayrak

// Adım geçiş hızını milisaniye cinsinden belirler
function hizAl() {
  return 1500; 
}

// O anki grafın renklerini, tabloyu ve log kayıtlarını bir 'adım' olarak diziye kaydeder
function adimKaydet() {
  adimlar.push({
    nodes: JSON.parse(JSON.stringify(dugumler.get())),
    edges: JSON.parse(JSON.stringify(kenarlar.get())),
    tabloHTML: document.querySelector("#tablo tbody").innerHTML,
    logHTML: document.getElementById("log-listesi").innerHTML
  });
}

// İstenilen indeksli adımı ekrana yansıtır (Geri/İleri sarma mantığı)
function adimGoster(index) {
  if (index < 0 || index >= adimlar.length) return;
  guncelAdim = index;
  
  let snap = adimlar[guncelAdim];
  
  dugumler.update(snap.nodes);
  kenarlar.update(snap.edges);
  document.querySelector("#tablo tbody").innerHTML = snap.tabloHTML;
  document.getElementById("log-listesi").innerHTML = snap.logHTML;
  
  // Log listesinin otomatik olarak en aşağıya kaydırılmasını sağlar
  let ul = document.getElementById("log-listesi");
  ul.scrollTop = ul.scrollHeight;

  // Butonların aktif/pasif durumlarını kontrol eder
  document.getElementById("btnGeri").disabled = (guncelAdim === 0);
  document.getElementById("btnIleri").disabled = (guncelAdim === adimlar.length - 1);
  
  let btnOynat = document.getElementById("btnOynat");
  if (btnOynat) {
    btnOynat.disabled = (guncelAdim === adimlar.length - 1);
    if (guncelAdim === adimlar.length - 1) {
      durdur(); // Son adıma geldiyse otomatik oynatmayı durdur
    }
  }
}

// Oynat/Duraklat butonunun mantığı
function oynatDuraklat() {
  if (oynuyorMu) {
    durdur();
  } else {
    baslatOynatma();
  }
}

// Animasyonu başlatır
function baslatOynatma() {
  if (guncelAdim < adimlar.length - 1) {
    oynuyorMu = true;
    document.getElementById("btnOynat").innerText = "⏸️ Duraklat";
    clearTimeout(oynatmaZamanlayici);
    oynatmaZamanlayici = setTimeout(otomatikAdim, hizAl());
  }
}

// Zamanlayıcı ile otomatik olarak bir sonraki adıma geçer
function otomatikAdim() {
  if (guncelAdim < adimlar.length - 1) {
    adimGoster(guncelAdim + 1);
    if (oynuyorMu) oynatmaZamanlayici = setTimeout(otomatikAdim, hizAl());
  } else {
    durdur();
  }
}

// Oynatmayı durdurur
function durdur() {
  oynuyorMu = false;
  clearTimeout(oynatmaZamanlayici);
  let btn = document.getElementById("btnOynat");
  if (btn) btn.innerText = "▶️ Oynat";
}

function ileri() {
  durdur(); 
  if (guncelAdim < adimlar.length - 1) adimGoster(guncelAdim + 1);
}

function geri() {
  durdur(); 
  if (guncelAdim > 0) adimGoster(guncelAdim - 1);
}

// ===== YARDIMCI FONKSİYONLAR =====
// Düğüm ID'sini harfe (Label) çevirir (Örn: 1 -> "A")
function idToLabel(id) {
  let node = dugumler.get(id);
  return node ? node.label : "-";
}

// ===== TABLO İŞLEMLERİ =====
// HTML'deki mesafe tablosunun başlangıç değerlerini (Sonsuz) oluşturur
function tabloyuOlustur() {
  let tbody = document.querySelector("#tablo tbody");
  tbody.innerHTML = "";
  dugumler.forEach(d => {
    tbody.innerHTML += `<tr><td>${d.label}</td><td id="mesafe-${d.id}">∞</td><td id="onceki-${d.id}">-</td></tr>`;
  });
}

tabloyuOlustur();

// Tablodaki belirli bir düğümün mesafesini ve ondan önceki düğümü günceller
function tabloyuGuncelle(id, mesafe, onceki) {
  document.getElementById("mesafe-" + id).innerText = mesafe;
  document.getElementById("onceki-" + id).innerText = onceki ? idToLabel(onceki) : "-";
}

// Tabloyu gizler veya gösterir (Örneğin Kruskal/Prim için tabloya gerek yok)
function tabloGoster(goster) {
  let tablo = document.querySelector(".table-box");
  tablo.style.display = goster ? "block" : "none";
}

// Başlangıç noktası seçimini gizler veya gösterir
function baslangicGoster(goster) {
  let secim = document.getElementById("baslangic");
  secim.style.display = goster ? "inline-block" : "none";
}

// ===== AÇILIR MENÜ (DROPDOWN) KONTROLLERİ =====
// Seçilen algoritmaya göre arayüzü ve grafın ağırlıklarını değiştirir
document.getElementById("algoritma").addEventListener("change", function () {
  let algo = this.value;
  let baslangic = document.getElementById("baslangic");
  let tablo = document.querySelector(".table-box");

  // Algoritmaya göre UI elementlerinin görünürlüğünü ayarla
  if (algo === "kruskal") { baslangic.style.display = "none"; tablo.style.display = "none"; }
  else if (algo === "prim") { baslangic.style.display = "inline-block"; tablo.style.display = "none"; }
  else { baslangic.style.display = "inline-block"; tablo.style.display = "block"; }

  // Bellman-Ford algoritması negatif ağırlıklarla çalışabildiği için kenar ağırlıklarını değiştir
  if (algo === "bellman") {
    kenarlar.update([ { id: 4, label: "-2" }, { id: 5, label: "-3" } ]);
  } else {
    kenarlar.update([ { id: 4, label: "5" }, { id: 5, label: "8" } ]);
  }
  grafigiSifirla();
});

// ===== SIFIRLAMA İŞLEMLERİ =====
// Grafı, logları, adımları ve tabloyu en baştaki haline getirir
function grafigiSifirla() {
  durdur();
  adimlar = [];
  guncelAdim = -1;
  
  if(document.getElementById("btnGeri")) document.getElementById("btnGeri").disabled = true;
  if(document.getElementById("btnIleri")) document.getElementById("btnIleri").disabled = true;
  if(document.getElementById("btnOynat")) document.getElementById("btnOynat").disabled = true;

  // Tüm renkleri sıfırla
  dugumler.forEach(d => { dugumler.update({ id: d.id, color: null, font: {color: "#1D3949"} }); });
  kenarlar.forEach(e => { kenarlar.update({ id: e.id, color: null, width: 1 }); });

  tabloyuOlustur();
  loglariTemizle();
}

// ===== YÖNLÜ/YÖNSÜZ GRAF KONTROLÜ =====
// Prim ve Kruskal yönsüz graf üzerinde, diğerleri yönlü graf üzerinde çalışır
function ayarDegistir(algo) {
  if (algo === "prim" || algo === "kruskal") ag.setOptions({ edges: { arrows: "" } }); // Yönsüz (oksuz)
  else ag.setOptions({ edges: { arrows: "to" } }); // Yönlü (oklu)
}

// ===== LOG YAZDIRMA İŞLEMLERİ =====
function loglariTemizle() { document.getElementById("log-listesi").innerHTML = ""; }
function logMesaji(mesaj, isSuccess = false) {
  let ul = document.getElementById("log-listesi");
  let li = document.createElement("li");
  li.innerText = mesaj;
  if (isSuccess) li.className = "success-log"; // Başarılı loglar için özel CSS sınıfı
  ul.appendChild(li);
}

// Algoritma bitiminde bulunan nihai en kısa yolları loglara yazdırır
function yollariYazdir(algoAdi, start, dist, prev) {
  logMesaji("✅ " + algoAdi + " Tamamlandı!", true);
  logMesaji("🎯 En Kısa Yollar:", true);
  dugumler.forEach(d => {
    if (d.id !== start) {
      if (dist[d.id] === Infinity) {
        logMesaji(d.label + " : Yol Yok");
      } else {
        let yol = []; let curr = d.id;
        // Geriye doğru giderek yolu oluştur (Örn: C -> B -> A)
        while(curr !== undefined) { yol.unshift(idToLabel(curr)); curr = prev[curr]; }
        logMesaji(d.label + " : " + yol.join(" ➔ ") + " (Mesafe: " + dist[d.id] + ")", true);
      }
    }
  });
}

// ===== BAŞLATMA =====
// Başlat butonuna tıklandığında ilgili algoritmayı çalıştırır
function algoritmayiBaslat() {
  grafigiSifirla();
  let algo = document.getElementById("algoritma").value;
  let start = Number(document.getElementById("baslangic").value);
  ayarDegistir(algo);

  // Seçilen algoritmaya göre ilgili fonksiyonu tetikle
  if (algo === "dijkstra") { tabloGoster(true); baslangicGoster(true); dijkstra(start); } 
  else if (algo === "bellman") { tabloGoster(true); baslangicGoster(true); bellmanFord(start); } 
  else if (algo === "prim") { tabloGoster(false); baslangicGoster(true); prim(start); } 
  else if (algo === "kruskal") { tabloGoster(false); baslangicGoster(false); kruskal(); }
}

// ===== DIJKSTRA ALGORİTMASI =====
function dijkstra(start) {
  // Dijkstra negatif ağırlıklı kenarlarla doğru çalışmaz, bunu kontrol ediyoruz
  let negatif = false;
  kenarlar.forEach(e => { if (Number(e.label) < 0) negatif = true; });
  if (negatif) { alert("Negatif ağırlık var! Dijkstra çalışamaz."); return; }

  logMesaji("🚀 Dijkstra Başladı. Başlangıç: " + idToLabel(start));
  
  // dist: Başlangıçtan her bir düğüme olan en kısa mesafeler
  // prev: En kısa yolu çizerken hangi düğümden gelindiğini tutar
  let dist = {}, prev = {}, visited = [];
  dugumler.forEach(d => dist[d.id] = Infinity); // Başlangıçta tüm mesafeler sonsuz
  dist[start] = 0; // Kendi kendine uzaklık 0
  
  tabloyuGuncelle(start, 0, "-");
  dugumler.update({ id: start, color: "#1D3949", font: { color: "white" } });

  adimlar = [];
  adimKaydet(); 

  let neighbors = []; let edgeIndex = 0; let current = null; let lastEdge = null; 

  // Adım adım işlemesi için öz yinelemeli (recursive) mantıkta bir step fonksiyonu
  function step() {
    if (lastEdge) kenarlar.update({ id: lastEdge, color: null, width: 1 });

    // Eğer o anki düğüm boşsa veya tüm komşuları incelendiyse, yeni bir en kısa düğüm seç
    if (current === null || edgeIndex >= neighbors.length) {
      if (current !== null) visited.push(current); // İşlenen düğümü ziyaret edilenlere ekle
      current = null;
      let minBoard = Infinity;
      
      // Ziyaret edilmemiş düğümler arasından en küçük mesafeye sahip olanı seç
      for (let id in dist) {
        let nodeId = Number(id);
        if (!visited.includes(nodeId) && dist[nodeId] < minBoard) { minBoard = dist[nodeId]; current = nodeId; }
      }

      // Gidilecek düğüm kalmadıysa algoritmayı bitir
      if (current === null || dist[current] === Infinity) {
        yollariYazdir("Dijkstra", start, dist, prev);
        
        // Sadece en kısa yola ait kenarları yeşil yapıp vurgula
        let allEdges = kenarlar.get();
        allEdges.forEach(e => {
          if (prev[e.to] === e.from) kenarlar.update({ id: e.id, color: { color: "#00A6AE" }, width: 3 });
          else kenarlar.update({ id: e.id, color: null, width: 1 }); 
        });
        adimKaydet();
        return;
      }

      logMesaji("🔍 Yeni düğüm: " + idToLabel(current));
      neighbors = kenarlar.get().filter(e => e.from === current); // Seçilen düğümden çıkan yolları bul
      edgeIndex = 0;
    }

    // Seçilen düğümün komşularını kontrol et
    if (neighbors.length > 0) {
      let e = neighbors[edgeIndex];
      lastEdge = e.id;
      kenarlar.update({ id: e.id, color: { color: "orange" }, width: 4 }); // İncelenen yolu turuncu yap
      logMesaji("  🔍 Yol inceleniyor: " + idToLabel(e.from) + " ➔ " + idToLabel(e.to));

      let u = e.from; let v = e.to; let weight = Number(e.label);
      // Eğer mevcut düğüm üzerinden geçmek, doğrudan gitmekten daha kısaysa mesafeyi güncelle
      if (dist[u] + weight < dist[v]) {
        dist[v] = dist[u] + weight; prev[v] = u;
        tabloyuGuncelle(v, dist[v], u);
        logMesaji("    ✔️ Daha kısa! Güncellendi: " + dist[v], true);
      } else { logMesaji("    ❌ Güncelleme yok."); }
      edgeIndex++;
    }

    adimKaydet(); 
    step(); // Animasyon adımlarını kaydetmek için döngü devam ediyor
  }

  step(); // Fonksiyonu başlat
  adimGoster(0); // İlk adımı ekranda göster
  baslatOynatma(); // Otomatik oynatmayı başlat
}

// ===== BELLMAN-FORD ALGORİTMASI =====
function bellmanFord(start) {
  logMesaji("🚀 Bellman-Ford Başladı. Başlangıç: " + idToLabel(start));
  let dist = {}, prev = {};
  dugumler.forEach(d => dist[d.id] = Infinity);
  dist[start] = 0;
  tabloyuGuncelle(start, 0, "-");
  dugumler.update({ id: start, color: "#1D3949", font: { color: "white" } });

  adimlar = [];
  adimKaydet();

  let edgesArr = kenarlar.get();
  let i = 0; let j = 0; let lastEdge = null; let degisimOldu = false; 

  // Algoritmanın (V-1) kez tüm kenarları kontrol etmesini sağlayan step fonksiyonu
  function step() {
    if (lastEdge) {
      let oldEdge = kenarlar.get(lastEdge);
      if (oldEdge && oldEdge.color && oldEdge.color.color === "orange") kenarlar.update({ id: lastEdge, color: null, width: 1 });
    }

    // Eğer düğüm sayısının eksiği kadar (V-1) tur atıldıysa bitir
    if (i >= dugumler.length - 1) {
      yollariYazdir("Bellman-Ford", start, dist, prev);
      edgesArr.forEach(e => {
        if (prev[e.to] === e.from) kenarlar.update({ id: e.id, color: { color: "#00A6AE" }, width: 3 });
        else kenarlar.update({ id: e.id, color: null, width: 1 }); 
      });
      adimKaydet();
      return;
    }

    // Bir turdaki tüm kenarlar kontrol edildiyse
    if (j >= edgesArr.length) {
      // Eğer bu turda hiçbir mesafe kısalmadıysa, algoritmayı erken bitirebiliriz (Optimizasyon)
      if (!degisimOldu) {
        logMesaji("🛑 Bu adımda hiçbir değer değişmedi. Erken sonlandırılıyor!", true);
        i = dugumler.length; 
      } else {
        i++; j = 0; // Sonraki tura geç
        if (i < dugumler.length - 1) { logMesaji("🔄 Adım " + (i + 1) + " başlıyor..."); degisimOldu = false; }
      }
      adimKaydet();
      step();
      return;
    }

    // Sıradaki kenarı kontrol et
    let e = edgesArr[j]; lastEdge = e.id;
    kenarlar.update({ id: e.id, color: { color: "orange" }, width: 4 });
    logMesaji("🔍 İnceleniyor: " + idToLabel(e.from) + " ➔ " + idToLabel(e.to));

    let u = e.from; let v = e.to; let weight = Number(e.label);
    
    // Relaxation işlemi
    if (dist[u] === Infinity) { logMesaji(" ⏭️ Atlanıyor: " + idToLabel(u) + " düğümüne henüz ulaşılamıyor (∞)."); } 
    else if (dist[u] + weight < dist[v]) {
      dist[v] = dist[u] + weight; prev[v] = u; degisimOldu = true; // Değişim yapıldı bayrağı kalktı
      tabloyuGuncelle(v, dist[v], u);
      logMesaji(" ✔️ Daha kısa yol bulundu! Güncellendi (Yeni Mesafe: " + dist[v] + ")", true);
    } 
    else { logMesaji(" ❌ Güncellemeye gerek yok (Mevcut mesafe daha kısa veya eşit)."); }

    j++;
    adimKaydet();
    step();
  }
  
  logMesaji("🔄 Adım 1 başlıyor...");
  degisimOldu = false;
  step();
  adimGoster(0);
  baslatOynatma();
}

// ===== PRIM ALGORİTMASI (Minimum Spanning Tree) =====
function prim(start) {
  logMesaji("🚀 Prim Algoritması Başladı. Başlangıç: " + idToLabel(start));
  let visited = new Set(); visited.add(start); // Başlangıç düğümünü ziyaret edildi olarak işaretle
  let toplamAgirlik = 0;
  let edgePool = []; // Değerlendirilecek kenarlar havuzu
  let havuzaEklenenler = new Set(); 

  // Ziyaret edilen düğüme bağlı olan yeni kenarları havuza ekler
  function addEdgesOf(nodeId) {
    kenarlar.forEach(e => {
      if ((e.from === nodeId || e.to === nodeId) && !havuzaEklenenler.has(e.id)) { 
        edgePool.push(e); 
        havuzaEklenenler.add(e.id); 
      }
    });
  }

  addEdgesOf(start);
  adimlar = []; adimKaydet();

  function step() {
    // Havuzda kenar kalmadıysa veya tüm düğümler ziyaret edildiyse işlemi bitir
    if (edgePool.length === 0 || visited.size === dugumler.length) {
      logMesaji("✅ Prim Tamamlandı!", true); logMesaji("🎯 Minimum Ağaç Ağırlığı: " + toplamAgirlik, true);
      adimKaydet(); return;
    }

    // Havuzdaki kenarları ağırlıklarına göre küçükten büyüğe sırala (Greedy - Açgözlü yaklaşım)
    edgePool.sort((a, b) => Number(a.label) - Number(b.label));
    let mevcutYolSayisi = edgePool.length; 
    let e = edgePool.shift(); // En düşük ağırlıklı kenarı al ve havuzdan çıkar

    logMesaji("👀 Mevcut " + mevcutYolSayisi + " yol değerlendirildi ve en kısası seçildi!");
    logMesaji("🔍 İncelenen Yol: " + idToLabel(e.from) + " - " + idToLabel(e.to) + " (Ağırlık: " + e.label + ")");

    // Eğer kenarın her iki ucu da zaten ziyaret edildiyse, bu kenarı eklemek DÖNGÜ oluşturur. Reddet.
    if (visited.has(e.from) && visited.has(e.to)) {
      logMesaji(" ❌ Döngü oluşturduğu için reddedildi.");
      adimKaydet(); step();
    } 
    else {
      // Döngü oluşturmuyorsa yeni ulaşılan düğümü bul, ziyaret edilenlere ekle ve ağacın rengini kırmızı yap
      let nextNode = visited.has(e.from) ? e.to : e.from;
      visited.add(nextNode); 
      toplamAgirlik += Number(e.label);
      logMesaji(" ✔️ Döngü oluşturmuyor, eklendi! (Yeni Düğüm: " + idToLabel(nextNode) + ")", true);
      kenarlar.update({ id: e.id, color: { color: "red" }, width: 4 });
      
      // Yeni düğümün komşularını da havuza ekle
      addEdgesOf(nextNode);
      adimKaydet(); step();
    }
  }
  
  step(); adimGoster(0); baslatOynatma();
}

// ===== KRUSKAL ALGORİTMASI (Minimum Spanning Tree) =====
function kruskal() {
  logMesaji("🚀 Kruskal Algoritması Başladı.");
  let parent = {}; // Disjoint Set (Ayrık Kümeler) için ebeveyn dizisi
  let toplamAgirlik = 0;
  
  // Find fonksiyonu: Bir düğümün ait olduğu kümenin kökünü (root) bulur
  function find(x) { 
    if (parent[x] !== x) parent[x] = find(parent[x]); 
    return parent[x]; 
  }
  
  // Union fonksiyonu: İki farklı kümeyi birleştirir
  function union(a, b) { 
    parent[find(a)] = find(b); 
  }

  // Başlangıçta her düğüm kendi kümesinin köküdür (Ebeveyni kendisidir)
  dugumler.forEach(d => parent[d.id] = d.id);
  
  // Tüm kenarları ağırlıklarına göre küçükten büyüğe sıralar
  let edgesArr = kenarlar.get().sort((a, b) => Number(a.label) - Number(b.label));
  let i = 0;

  adimlar = []; adimKaydet();

  function step() {
    // Tüm kenarlar kontrol edildiyse işlemi bitir
    if (i >= edgesArr.length) {
      logMesaji("✅ Kruskal Tamamlandı!", true); logMesaji("🎯 Minimum Ağaç Ağırlığı: " + toplamAgirlik, true);
      adimKaydet(); return;
    }

    let e = edgesArr[i];
    logMesaji("🔍 " + idToLabel(e.from) + " - " + idToLabel(e.to) + " kenarı inceleniyor...");

    // Eğer kenarın iki ucundaki düğümler farklı kümelerdeyse (Kökleri farklıysa), döngü oluşturmaz
    if (find(e.from) !== find(e.to)) {
      union(e.from, e.to); // Kümeleri birleştir
      toplamAgirlik += Number(e.label);
      logMesaji(" ✔️ Döngü oluşturmuyor, eklendi! (Ağırlık: " + e.label + ")", true);
      kenarlar.update({ id: e.id, color: { color: "red" }, width: 4 }); // Ağa eklenen kenarı vurgula
    } else { 
      // Kökleri aynıysa, bu düğümler zaten birbirine bağlıdır. Yeni kenar eklemek döngü yaratır.
      logMesaji(" ❌ Döngü oluşturduğu için reddedildi."); 
    }

    i++; adimKaydet(); step();
  }
  
  step(); adimGoster(0); baslatOynatma();
}
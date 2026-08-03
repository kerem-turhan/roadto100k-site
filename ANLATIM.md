# ANLATIM — sitenin el kitabı

> Bu dosya siteyi Kerem'e anlatır: ne var, neden var, nasıl güncellenir.
> Teknik bilgi gerektirmez; her terim kullanıldığı yerde açıklanır (bkz. §7 sözlük).
>
> **KALICI KURAL:** Sitede önemli bir değişiklik olduğunda (yeni bölüm, yeni sayfa türü,
> ritüel adımı değişimi) bu dosya **aynı commit'te** güncellenir. Dosya eskiyorsa yalan
> söylüyor demektir.
>
> **Son güncelleme: 3 Ağustos 2026.** Üç haftalık ledger canlı; gelir $0, MRR $0, kümülatif
> harcama $2 ve e-posta abonesi 0. Site 406 otomatik testten geçiyor; çerezsiz ziyaret sayacı,
> kayıt sayfaları, paylaşım kartları ve haftalık silent-green vaadi canlı. Şu an tek öncelik,
> 4 Ağustos'taki Show HN lansmanında gelen trafiği dürüstçe karşılamak.

---

## 1. Bu site ne ve neden var

**Ne:** `https://kerem-turhan.github.io/roadto100k-site/` adresinde yayında olan tek sayfalık
bir **halka açık defter**. 19 Temmuz 2026'da $0'dan başlayıp 31 Aralık 2026'ya kadar
$100.000'a gitme iddiasının haftalık kaydı: gelir, MRR, harcama, e-posta abonesi. Sıfırlar
dahil, kozmetik yok.

**Neden — asıl varlık tezi:** Bu sitenin işi seni "havalı" göstermek değil, **e-posta listesi
büyütmek**. Neden liste:

- **X takipçisi kiralıktır.** Algoritma değişir, hesap askıya alınır, erişim düşer; takipçiye
  ulaşma hakkın platformun keyfine bağlı.
- **E-posta listesi mülkiyettir.** Adresler senin; platform ne yaparsa yapsın liste seninle
  kalır ve doğrudan ulaşırsın.
- Bir ürünü/hizmeti satacağın gün, "kaç takipçim var" değil **"kaç kişiye doğrudan
  yazabiliyorum"** sorusunun cevabı para eder.

**Sitenin işleyiş mantığı (huni):**

```
X'te dikkat  →  siteye tıklama  →  gerçek rakamlar (güven)  →  e-posta kaydı  →  müşteri / kullanıcı
```

Güveni üreten şey tasarım değil, **her Pazar aynı yerde duran gerçek sayılar**. $0 haftasını
saklamayan bir defter, iyi haftayı da inandırıcı yapar. Site bu yüzden sessiz, hızlı ve
abartısız: iddiayı metin değil, tekrar eden kayıt taşıyor.

**Neden bu kadar sade / bedava:** Bütçe tavanı $100/ay ve reklam $0. Site tamamen **statik**
(sunucu yok, veritabanı yok, **çerez yok**, kişisel veri toplanmıyor) ve GitHub Pages'te
**ücretsiz** duruyor. Yazı tipleri bile kendi sunucumuzdan geliyor; runtime dış yüzeyi
**iki** tane: (1) sayaç açıksa GoatCounter script'i ve count endpoint'i, (2) e-posta formunu
gönderdiğinde Buttondown form action'ı (§2.2b). Başka hiçbir şey.

---

## 2. Sitede ne var — bölüm bölüm

### 2.1 Gördüğün bölümler (yukarıdan aşağı)

| Bölüm | Ne yapar |
|---|---|
| **Üst şerit + gün damgası** | "DAY … · … DAYS LEFT" — 19 Tem 2026'dan bu yana geçen gün ve hedefe kalan süre. Tarayıcının saatinden **canlı hesaplanır**, elle güncellenmez. |
| **Hero (giriş)** | Tek cümlelik iddia: $0 → $100k, 31 Aralık 2026. Yanında ne yaptığın ve bunun neden halka açık olduğu. |
| **The rules (kurallar)** | Bahsin kuralları: $100/ay tavan, $0 reklam, her sayı public, haftalık kayıt, yıl sonunda ne olursa olsun dürüst post-mortem. Bu bölüm senin kendine koyduğun kısıt — okuyucunun sana güvenmesinin sebebi. |
| **The ledger (defter)** | Sitenin kalbi. Haftalık tablo (hafta bitişi, gelir, MRR, harcama, abone, not) + üstünde **sparkline**: yeşil çizgi gerçekleşen kümülatif gelir, kesikli çizgi $100k'nın gerektirdiği tempo. Rakamların tamamı tek bir dosyadan gelir: `src/data/ledger.json`. |
| **What I'm building (ne inşa ediyorum)** | Ne üzerinde çalıştığın — kategori dilinde, ürün adı vermeden. Altında iletişim satırı. |
| **The work / proof (kanıt)** | Yayımlanmış işlerin listesi + "What I do" kartı (audit / eval-harness kurulumu / ongoing operations). Ana sayfada fiyat yok; fiyat `/work/` sayfasında. **22 Temmuz'da açıldı** (ilk teardown reposu public). `src/config.ts` içindeki bir öğe, linki gerçek ve rakam veriyorsa kaynak commit'i dolu olmadıkça HTML'e basılmaz; hiçbiri canlı değilse bölüm tamamen kaybolur. |
| **Email signup (kayıt)** | Asıl hedef. Buttondown formu. **28 Temmuz'da vaat netleşti:** formun hemen üstünde tek cümlelik söz duruyor — *"One silent-green finding a week — a check that couldn't look and said yes anyway."* Altında sıklık/spam/çıkış satırı. Buttondown adresi config'te boş bırakılırsa form yerine X'i takip bağlantısı gösterilir. |
| **Footer** | Work with me, Silent green, X, GitHub, RSS (+ Türkçe) bağlantıları + tema (açık/koyu) düğmesi. "Work with me" bağlantısı yalnız kanıt kapısı açıkken görünür — olmayan sayfaya link verilmez. Alt satır: *"No cookies, no personal data, $0/mo hosting."* Sayaç açıksa altında tek cümlelik sayaç açıklaması durur (§2.2b). |

### 2.1b Ana sayfanın dışındaki iki sayfa (28 Temmuz'da eklendi, 30 Temmuz'da tamamlandı)

Show HN postu inerse siteye birkaç bin kişi gelir ve bu tazelik **bir kez** harcanır. O
trafiğin "peki bu adam benim için ne yapabilir?" ve "neye abone oluyorum?" sorularının cevabı
artık kendi kalıcı adreslerinde duruyor.

| Sayfa | Adres | Ne var, ne yok |
|---|---|---|
| **Work with me** | `/work/` | Hizmet yolu. Başlıkta konumlandırma cümlesi (*"I make AI agents fail closed. When a check can't look, it has to say no."*), altında üç somut iş (reliability audit / eval harness + CI regression gate / ongoing operations), sonra **paketlenmiş teklif** (aşağıda), yanında **kanıt**: public teardown reposu, rakamları ve commit pini ile. Tek tık iletişim: e-posta. |
| **Silent green** | `/silent-green/` | İmza serinin kalıcı evi: haftada bir "bakamadığı hâlde evet diyen kontrol" bulgusu. **30 Temmuz'dan beri iskelet değil:** № 001 yayında — *"The harness that counted silence as success"* (`/silent-green/counting-silence-as-success/`). İndeks girişleri yeniden-eskiye listeler; her giriş sayfasının altında aynı vaat ve aynı form var. |

**`/work/` sayfasındaki teklif (30 Temmuz, 29 Tem karar paketi K5+K6).** Sayfa artık fiyat
söylüyor, ama yalnız fiyat değil — çünkü fiyatı tek başına yazmak pazarlık daveti, "ne kadar
sürer / kaç şey gelir / benden ne istiyorsun" diye sormak zorunda kalan alıcı çoğunlukla hiç
sormuyor. Dördü birden sayfada:

| Parça | Sayfadaki hâli |
|---|---|
| **Fiyat** | **$1,500** — "Agent reliability audit". Sitedeki **tek** fiyat (bir test bunu sayıyor). |
| **Süre kutusu** | *"One week, from the day access lands to the report in your inbox."* — sayaç konuşmanın başladığı gün değil, erişimin geldiği gün başlar. |
| **Sayılı çıktı listesi** | 5 numaralı madde: failure-mode haritası · **en az 3** tekrar-üretilebilir hata · başlangıç eval seti + tek komut · öncelikli aksiyon planı · yazılı kapanış (çağrı isteğe bağlı — varsayılan yazılı). |
| **Ön koşul / erişim checklist'i** | Gün birden önce ne gerektiği: **read-not-write** erişim (salt-okunur davet veya fork; PR açılır, dala push edilmez) · uçtan uca çalıştırma yolu (env şablonu / fixture / sandbox anahtarı, **asla prod kimlik bilgisi**) · yazılı yanıt verebilen tek muhatap · "yanlış"ın tanımı. |
| **Sonraki basamak** | Tek satır, fiyatsız: *"Ongoing operations: after first delivery, priced per engagement."* |

**Sayfaya GİRMEYEN iki şey** (karar verildi, yayımlanmadı): **para-iade garantisi** — ödeme
rayı (Polar) canlı olmadan iade sözü verilemez; ve **$500 giriş teklifi (teardown)** — HN
postundan sonra açılacak. Kalkan iki fiyat da ($990 founding, $1.490 retainer) sayfada yok.
Beşi de teste bağlı: hem `offer.test.tsx` hem `workPage.test.ts` bu kalıpları arıyor, biri
sayfaya sızarsa build kırmızı olur.

İkisinin de altında aynı vaat ve aynı form var. Vaat metni, konumlandırma cümlesi ve üç
hizmetin tarifi tek dosyada yaşıyor (`src/lib/offer.ts`): ana sayfa React ile, bu iki sayfa
düz HTML ile üretiliyor — metin üç yere elle yazılsaydı okuyucuya üç farklı söz verilirdi.

**`/work/` bir kapıya bağlı.** Kanıt bölümüyle **aynı** kapı: `config.PROOF_ITEMS` içinde
canlı (gerçek link + rakam veriyorsa commit pini) bir öğe yoksa sayfa hiç yazılmaz — sitemap'e
de girmez, footer'da bağlantısı da çıkmaz. Kanıtı olmayan bir yetkinlik iddiasını satmak,
zaten bu sitenin karşı çıktığı şey. `/silent-green/` bu kapıya bağlı değil: adresi başka
yerlerde anılacağı için bir hafta 404 vermektense "ilk giriş yolda" demesi doğru.

### 2.1c Bir silent-green girişi neyden oluşur

Bir giriş üç tür bloktan kuruluyor — Markdown yok, ayrıştırıcı yok:

| Blok | JSON'daki hâli | Neden var |
|---|---|---|
| **Paragraf** | düz metin | Anlatının kendisi. |
| **Kural** | `{ "callout": "…" }` | Bulgunun ürettiği kural, kırmızı marj çizgisine yaslanmış olarak ayrı durur. Okuyucu hikâyeyi unutur, kuralı hatırlar. |
| **Prob** | `{ "list": ["…"] }` | Numaralı adımlar: okuyucunun **kendi** hattında aynı hatayı bulmasının yolu. Tekrar üretilemeyen bulgu anekdottur. |

№ 001 bu üçünü de taşıyor ve bir test bunu şart koşuyor: yayımlanmış ilk giriş var, kuralı
var, en az 3 adımlık probu var.

### 2.2 Görünmeyen ama işi olan şeyler

Bunlar sayfada göze görünmez; arama motorları, sosyal medya önizlemeleri ve okuyucu
uygulamaları için üretilir. Hepsi **build sırasında** (yani her push'ta, otomatik) gerçek
defter verisinden yazılır — elle bakım gerektirmez.

| Şey | Nerede | Tek cümleyle ne işe yarar |
|---|---|---|
| **JSON-LD** (yapısal veri) | ana sayfanın ve her hafta sayfasının içinde | Google'a "bu bir kişi, bu bir site, bu da haftalık gerçek sayılardan oluşan bir veri kümesi" diye **makine diliyle** anlatır; arama sonucunda daha zengin görünme ihtimalini artırır. |
| **sitemap.xml** | `/sitemap.xml` | Sitedeki tüm sayfaların listesi — arama motoru hiçbirini kaçırmasın diye. |
| **robots.txt** | `/robots.txt` | Tarayıcı botlarına "her yeri gezebilirsin, haritam da şurada" der. |
| **canonical** | her sayfanın başında | "Bu içeriğin gerçek adresi budur" — aynı içerik farklı adreslerden görünürse Google'ın kafası karışmasın diye. |
| **RSS feed** | `/feed.xml` | Okuyucu uygulamalarının (Feedly, NetNewsWire…) yeni haftaları otomatik almasını sağlar; e-posta istemeyen okur için ikinci abonelik kanalı. |
| **Haftalık journal sayfaları** | `/w/2026-07-19/` gibi + arşiv `/w/` | Her defter haftasının **kendi kalıcı ve indekslenebilir adresi**. Tek sayfalık sitede tek bir URL varken, artık her hafta ayrı paylaşılabilir/aranabilir bir sayfa. Bunlar sade HTML'dir (JavaScript beklemez, anında açılır). |
| **Türkçe özet sayfaları** | `/tr/` + `/tr/w/2026-07-19/` | Türkçe okuyucu için haftanın kısa özeti. **Yalnız** o hafta için `trNote` yazdıysan var olur; yazmadıysan o hafta Türkçe tarafta hiç görünmez ("özet yakında" gibi doldurma metin yok). Hiç `trNote` yoksa `/tr/` sayfası hiç üretilmez. |
| **hreflang** | EN ve TR sayfalarının başında | Google'a "bu iki sayfa aynı içeriğin İngilizcesi ve Türkçesi" der; yanlış dili yanlış kişiye göstermesin diye. |
| **OG kartı (paylaşım görseli)** | `/og.png` (site geneli) · `/og/w/<hafta>.png` (İngilizce hafta kartı) · `/og/w/tr/<hafta>.png` (Türkçe hafta kartı) | Linki X/WhatsApp/LinkedIn'e attığında çıkan büyük görsel. Site geneli kart zamansızdır; **hafta sayfalarının kendi kartı** o haftanın gerçek rakamlarını taşır. Türkçe sayfa Türkçe kartı kullanır (yoksa genel karta düşer — asla İngilizce kartı göstermez). |
| **Türkçe harf desteği** | tüm sayfalar | Yazı tiplerinin "latin" seti İ, Ş, Ğ harflerini içermiyor; bu yüzden her aileye ikinci bir "latin-ext" dosyası eklendi ve `unicode-range` ile sınırlandı. Türkçe harf içermeyen sayfalar bu ek dosyayı hiç indirmez. |
| **Yazı tipi lisansları** | `/fonts/OFL-*.txt` | Üç yazı tipi de OFL-1.1; bu lisans "dağıtacaksan telif notunu ve lisansı yanında taşı" diyor. Font dosyalarının yanına üç lisans metni kondu. Bir aile eklenip lisansı unutulursa test kırmızıya döner. |
| **Tema + erişilebilirlik** | her yerde | Açık/koyu mod (sistem tercihi + düğme) — **22 Temmuz'dan beri hafta ve Türkçe sayfalarında da düğme var**. Klavye odak halkaları, ekran okuyucu etiketleri, `prefers-reduced-motion` (animasyon istemeyen kullanıcıda animasyon yok). İçerik hiçbir zaman animasyona **veya JavaScript'e** bağlı değildir: 22 Temmuz'dan beri ana sayfa da build sırasında hazır HTML olarak yazılıyor (aşağıya bak), hafta ve Türkçe sayfaları zaten öyleydi. |

### 2.2b Ziyaret sayacı (30 Temmuz'da eklendi, canlı)

Site, lansman trafiğinden öğrenebilmek için çerezsiz bir sayaç kullanıyor. Sayaç canlıdır:
yükleme isteğinin ve sayım isteğinin başarılı döndüğü doğrulandı. Ölçüm, kişiyi tanımak için
değil, hangi sayfaların gerçekten görüldüğünü anlamak içindir.

- **Kim:** [GoatCounter](https://www.goatcounter.com/). Sayaç sayfası `roadto100k.goatcounter.com`
  adresinde herkese açık görünürlüktedir. Çerez koymaz ve kişisel veri toplamaz.
- **Nerede yazıyor:** her sayfanın altında tek cümle — *"Visits are counted without cookies,
  fingerprints, or anything that identifies you — because not measuring isn't privacy, it's
  blindness."* (Türkçe sayfalarda Türkçesi.)
- **Açma/kapama:** `src/config.ts` → `ANALYTICS_CODE`. Boşken sayaç yüzeyi **yok**; kayıt formu
  ayrı çalışır ve yalnız form gönderildiğinde istekte bulunur.
- **Bozuk ayarda build patlar.** Kod dolu ama biçimi yanlışsa (tam URL, host adı, büyük harf,
  yer tutucu) build `Invalid ANALYTICS_CODE` diyerek durur. Ölü bir beacon sıfır rapor eder ve
  "sıfır ziyaret" ile "sıfır ölçüm" panoda birbirinden ayırt edilemez.
- Her build sayacın durumunu yazdırır: `visit counter: on (…)` veya `OFF`.
- Sayaç `async` yüklenir ve localhost'u atlar; JavaScript'i kapalı okur sayılmaz — yani rakam
  bir **taban**, manşet değil.

Hesabı açma adımları: README, *"Turning the visit counter on"*.

### 2.3 Rakamlar nereden geliyor

**Tek kaynak:** `src/data/ledger.json`. Sitedeki her sayı — tablo, sparkline, hafta sayfaları,
RSS, JSON-LD, haftalık OG kartları — bu dosyadan türetilir. Başka hiçbir yerde elle yazılmış
sayı yoktur. Dosya bozuksa (eksik alan, yanlış tarih biçimi, aynı haftadan iki kayıt) **build
gürültülü şekilde patlar** ve site eski hâliyle yayında kalır; yanlış sayı asla yayına çıkmaz.

Benzer şekilde tüm dış bağlantılar ve tarihler `src/config.ts` içindedir: X adresi, GitHub,
e-posta, Buttondown, başlangıç tarihi, hedef tarihi, hedef tutar, kanıt öğeleri.

---

## 3. Nasıl güncellenir — Pazar rutini

Bu ritüel haftada yaklaşık 30 dakika sürer. Amaç güzel bir rapor yazmak değil, o haftanın
gerçeğini değiştirilemez biçimde kayda almaktır. Her Pazar aynı sırayı izle; gelir yoksa da
aynı kayıt yapılır.

### 3.1 Önce kaynakları topla (10 dakika)

1. **Ledger:** o Pazar biten hafta için gelir, harcama, MRR ve toplam e-posta abonesini not et.
   Gelir ve harcama USD tam dolar; MRR ve abone sayısı hafta sonundaki toplamdır.
2. **Kayıt:** `src/data/ledger.json` dosyasını aç; `weeks` dizisinin son kaydını ve tarih
   sırasını kontrol et. Yeni tarih bir Pazar olmalı ve önceki kayıttan sonra gelmelidir.
3. **E-posta:** Buttondown panelindeki toplam abone sayısını al. Kendi test kaydın da gerçek
   abonedir; silinmişse ancak o zaman toplamdan çıkar.
4. **Ziyaret:** GoatCounter'da önceki haftanın sayfa görüntüleme yönünü not et. Bu sayı
   ledger'a yazılmaz; içerik ve dağıtım kararına yardımcı bir bağlamdır.
5. **İçerik:** o hafta yayımlanan silent-green girişi, yayınlanan kanıt ve önemli dış
   konuşmaları bir cümlelik not için gözden geçir. Not, vaat veya başarı hikâyesi değildir;
   doğrulanabilir haftalık kayıttır.

Yeni kayıt kalıbı:

```json
{
  "weekEnding": "2026-08-09",
  "revenue": 0,
  "mrr": 0,
  "spend": 0,
  "emailSubs": 0,
  "note": "One honest English sentence about the week.",
  "trNote": "Haftanın tek cümlelik Türkçe özeti (opsiyonel)."
}
```

`note` İngilizce ve tek cümledir; RSS, arama sonucu ve hafta sayfasında görünür. `trNote`
opsiyoneldir: boş bırakırsan Türkçe haftası üretilmez. Rakam veya tarih belirsizse tahmin
etme: kaynağa dön, sonuç netleşene kadar değişikliği gönderme.

### 3.2 Kartı üret ve yerelde kontrol et (5 dakika)

```sh
cd site
npm run og
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run og`, her hafta için 1200×630 paylaşım kartı üretir; Türkçe not varsa Türkçe kart da
üretir. Kart üretimi başarısız olursa genel kart kullanılabilir, ama nedenini kayda geçir.
Lint, tip denetimi, test ve build'in dördü de sıfır çıkış koduyla bitmelidir. Build sonrası
yerelde `/`, yeni `/w/<tarih>/`, varsa `/tr/w/<tarih>/`, `/silent-green/` ve `/work/`
sayfalarını aç: yeni tarih, rakam, kart etiketi ve kayıt formu görünmelidir.

### 3.3 KIRMIZI kararı

Aşağıdakilerden biri olursa yayınlama; önce KIRMIZI nedenini yaz:

- ledger tarihi, sırası veya sayı kaynağı belirsiz;
- lint, typecheck, test ya da build başarısız;
- yeni hafta sayfası ve ana sayfa farklı rakam gösteriyor;
- kayıt formu veya sayaç beklenen yüzeyde görünmüyor;
- paylaşım kartı yanlış tarih/rakam taşıyor;
- başkasına ait hiçbir ad, adres veya ayrıntı buradan çıkmaz ilkesiyle çelişme şüphesi var.

KIRMIZI, “kötü hafta” demek değildir. $0 gelir yeşil bir kayıttır; doğrulanamayan veya
bozuk bir kayıt KIRMIZI'dır.

### 3.4 Commit, deploy ve kanıt (5 dakika)

```sh
git add src/data/ledger.json public/og
git commit -m "chore(ledger): week of 2026-08-09"
git push
```

Push sonrasında GitHub Actions sırasıyla kalite kontrollerini, testleri ve build'i çalıştırır;
başarılı çalıştırma Pages deploy'u tetikler. Deploy kanıtı üç parçadır:

1. Actions çalıştırması yeşil.
2. Canlı ana sayfa ve yeni hafta URL'si HTTP 200 döndürüyor.
3. Canlı sayfada yeni ledger rakamı ve güncel OG kartı var.

Birinci madde yoksa “deploy oldu” denmez. İkinci veya üçüncü madde yoksa, Actions yeşil olsa
bile dağıtım sorunu olarak açılır.

### 3.5 Rutin dışı değişikliklerin haritası

| Değişiklik | Tek kaynak / kontrol |
|---|---|
| Haftalık sayılar ve not | `src/data/ledger.json`; tam test + build |
| Yeni silent-green girişi | `src/data/series.json`; giriş, indeks ve sitemap'i yerelde aç |
| Hizmet metni, vaat veya paket | `src/lib/offer.ts`; üç yüzeyin aynı metni gösterdiğini kontrol et |
| Dış bağlantı, tarih veya sayaç ayarı | `src/config.ts`; canlı link ve ilgili yüzeyi kontrol et |
| Alan adı değişikliği | `vite.config.ts` ve `src/config.ts`; canonical, sitemap ve OG URL'lerini kontrol et |

## 4. X ölçüm paneli — 3 Ağustos 2026

Bu panel, 7 Temmuz–3 Ağustos dışa aktarma penceresinin toplamıdır. X'teki gösterim platformun
verdiği bir dağıtım sayısıdır; gelir, ilgi veya doğru kitle demek değildir.

| İçerik türü | İçerik | Gösterim | Beğeni | Engagement | Profil ziyareti | Yeni takip | URL tıklaması | Bookmark |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Toplam | 96 | 8.514 | 64 | 190 | 43 | 2 | 8 | 5 |
| Reply | 63 | 7.769 | — | — | 40 | 1 | 0 | — |
| Özgün post | 33 | 745 | — | — | 3 | 1 | 8 | — |

Reply başına ortalama gösterim yaklaşık 123, özgün post başına yaklaşık 23'tür. Buna rağmen
sekiz URL tıklamasının tamamı ve alınan 26 reply'ın 21'i özgün postlardan geldi. Bu ayrım,
hangi sayının karar için değerli olduğunu gösterir.

### Hangi metriğe neden bakıyoruz?

| Metrik | Ne söyler | Tek başına neden yetmez? |
|---|---|---|
| Gösterim | İçeriğin kaç kez ekranda belirdiğini | Yanlış kitle de yüksek gösterim üretebilir. |
| Profil ziyareti | Birinin “bu kim?” diye ikinci adım attığını | Tek başına siteye veya e-postaya dönüşüm değildir. |
| URL tıklaması | Siteye giden gerçek niyeti | Tıklama, kayıt veya konuşma garantisi vermez. |
| Gerçek konuşma | Doğru insanla bağ ve öğrenme ihtimalini | Sayması zordur; bağlamla birlikte okunur. |
| Nitelikli takip | Gelecekte erişilebilecek uygun kişiyi | Sayı küçük olabilir; kalitesi isimden önemlidir. |

**Ders: erişim ile ilgi neredeyse ilişkisiz.** En yüksek erişimli iki içerik büyük bir hesap
altındaki tek satırlık şakalardı: 1.088 ve 1.082 gösterim, toplam yalnız 4 profil ziyareti
(yaklaşık %0,2). En yüksek dönüşümlü içerik ise 284 gösterimden 14 profil ziyareti üretti
(%4,93): bir builder'a düzenli ortaya çıkışının ilham verdiğini söyleyen kısa, insani bir
reply. İkinci sıradaki teknik eval sohbeti 159 gösterimden 3 ziyaret üretti (%1,89).

Kadans da tam oturmadı: 19 Temmuz–3 Ağustos arasındaki 16 günün 13'ünde içerik var; 24–26
Temmuz tamamen boş, özgün post yalnız 10 günde yayımlandı. “Her gün en az bir özgün post”
tabanı henüz tutulmuş değil. Thread de çalışmıyor: 23 Temmuz dersi, ikinci ve sonrası
tweetlerin ilk tweetin yaklaşık %10–50'sini gördüğünü gösterdi. Fikir içeriği bu nedenle
tek uzun post olarak yayımlanır.

X birincil kanal değil, **amplifikatördür**. Birincil kanal upstream katkılar, Hacker News ve
kendi sitedir. Canlı X keşfi, X içindeki Web Grok radarıyla yapılır; nihai konu, metin ve
dağıtım kararı strateji chatindedir. `LIVE GKK` ile `SOURCE-LED` ayrımı zorunludur; yanlış
kitleli yüksek erişim, reply adayı değildir.

## 5. Şu an neredeyiz — 3 Ağustos 2026

- Site HEAD'i `c08813e`; 2 Ağustos haftalık kapanışı yayımlandı.
- Ledger'da 19 Temmuz, 26 Temmuz ve 2 Ağustos olmak üzere üç hafta var. Son kapanış:
  gelir $0, MRR $0, kümülatif harcama $2, e-posta abonesi 0.
- 406 test yeşil; en son Pages deploy çalıştırması `30743778609` yeşil.
- EN/TR kayıt sayfaları ve 1200×630 OG kartları canlı. `/silent-green/` altında en az bir
  yayımlanmış giriş var; newsletter haftada bir silent-green bulgusu vaat ediyor.
- Buttondown gerçek kayıtla denendi. Takip/izleme ayarları kapalı; UTM kaynak etiketi olarak
  açık ve kişi izlemek için kullanılmıyor.
- GoatCounter canlı, herkese açık görünürlükte ve çerezsiz çalışıyor.
- Öncelik: 4 Ağustos, 15:00–20:00 TR arasında Show HN lansmanı. Açık kaynak bir
  hata-ayıklama/teardown çalışması yayına girecek. 12 maddelik GO/NO-GO listesinin 10'u
  yeşil; lansman anında doğrulanacak kalan ikisi hesap girişi ve ilk iki saat kesintisiz insan
  nöbetidir.

### Lansman günü sitenin rolü

Site, lansmanın trafik iniş yeridir: hizmet yolunu, newsletter vaadini, `/silent-green/`
içeriğini ve ziyaret sayacını aynı yerde sunar. Lansman öncesi kontrol listesi:

1. Ana sayfa, `/work/`, `/silent-green/`, kayıt yüzeyleri ve yeni paylaşım kartı canlı açılıyor.
2. Ziyaret sayacı istekleri başarılı; sayaç paneli erişilebilir.
3. Newsletter formu sözünü aynen taşıyor ve gerçek gönderime hazır.
4. En güncel ledger, $0 dahil gerçek rakamları gösteriyor.
5. OG kartı 1200×630 ve paylaşım metni ile uyumlu.
6. İlk iki saat sayfa, kayıtlar ve anlamlı yorumlar insan tarafından kesintisiz izlenecek.

Lansman tutmazsa X'te sonradan “başarılı oldu” izlenimi veren bir paylaşım yapılmaz. Sonuç,
hangi yönde olursa olsun ledger ve kanal tezi içinde dürüstçe değerlendirilir.

## 6. Sırada ne var

1. **Show HN'i doğru işlet.** GO/NO-GO'nun iki canlı şartını doğrula, ilk iki saati izle ve
   trafiği/konuşmaları kayda geçir.
2. **Her Pazar ledger'ı güncelle.** Sayılar → çürüme taraması → gelecek haftanın tek önceliği:
   ritüelin sabit sırası budur.
3. **Newsletter sözünü tut.** Haftada bir silent-green bulgusu yayımla; giriş yoksa vaat
   dolgu metinle kapatılmaz.
4. **HN + 30 gün kanal tezini değerlendir.** Kapı kırmızıysa tez açıkça revize edilir; hedef
   sonradan aşağı çekilmez.
5. **Dönüşüm halkasını izle.** Profil ziyareti, site tıklaması, kayıt ve gerçek konuşma
   arasındaki her kayıp ayrı bir öğrenme konusudur.

## 7. Riskler

| Risk | Etki ve somut önlem |
|---|---|
| **0 abone** | Şu an listenin büyümediğini açıkça kabul ediyoruz. Vaat, içerik ritmi ve giriş sayfası test edilir; sayı uydurulmaz. |
| **Ledger ritminin kırılması** | Güven, haftalık kaydın devamından gelir. Pazar rutini takvimde sabit; boş hafta da kaydedilir. |
| **Sayaç bağımlılığı** | Sayaç geçici olarak çalışmazsa trafik körleşir. Canlı istek, panel ve deploy sonrası yüzey kontrolü yapılır; sayıların taban olduğu unutulmaz. |
| **Tek kanal riski** | X erişimi algoritmaya bağlıdır. Upstream katkılar, Hacker News, site ve e-posta birlikte yürütülür. |
| **Dönüşüm halkası kopukluğu** | Gösterim, profil ziyareti, site tıklaması ve kayıt farklı basamaklardır. Her basamak ayrı ölçülür; gösterim başarı diye yazılmaz. |
| **Deploy kırılması** | Test/build kırmızıysa değişiklik yayınlanmaz. Yeşil Actions, canlı HTTP 200 ve görünen içerik birlikte doğrulanır. |
| **Paylaşım kartı önbelleği** | Platform eski OG kartını gösterebilir. Yeni kartı yerelde doğrula ve ilk paylaşımda kart denetleyicisiyle kontrol et. |
| **Public içerik hatası** | Başkasına ait hiçbir ad, adres veya ayrıntı buradan çıkmaz. Şüpheli cümle yayınlanmaz. |

## 8. Mini sözlük

- **Amplifikatör:** Kendi başına ana müşteri kaynağı olmayan, iyi içeriği daha fazla kişiye
  duyuran kanal; burada X'in rolü budur.
- **Build:** Kaynak koddan yayına çıkacak dosyaları üretme işlemi (`npm run build`).
- **Dönüşüm:** Bir kişinin bir sonraki anlamlı adıma geçmesi; örneğin gösterimden profil
  ziyaretine veya tıklamadan kayda geçiş.
- **Engagement:** Platformun etkileşim diye saydığı hareketlerin toplamı; niyetin doğrudan
  ölçüsü değildir.
- **GoatCounter:** Çerezsiz ziyaret sayımı yapan araç; burada sayfa ilgisini anlamak için
  kullanılır.
- **Gösterim (impression):** İçeriğin bir kullanıcının ekranında görünme sayısı; kişi veya
  ilgi sayısı değildir.
- **GitHub Pages deploy:** Build edilmiş statik dosyaların GitHub Pages üzerinde canlı sürüme
  alınması.
- **Kümülatif harcama:** Başlangıçtan bugüne kadar yapılan tüm harcamanın toplamı.
- **Ledger:** Gelir, MRR, harcama ve abone sayısını haftalık, değiştirilebilir kaynakta
  tutan açık kayıt.
- **LIVE GKK:** Kanıtı canlı X gündemine dayanan konu adayı; zaman ve bağlam kanıtı vardır.
- **MRR:** Monthly Recurring Revenue; aylık yinelenen gelir.
- **OG kartı (Open Graph):** Bir link paylaşıldığında görünen 1200×630 önizleme görseli.
- **Profil ziyareti:** İçerikten sonra birinin hesabı açması; yüzeysel erişimden daha güçlü
  ilgi işaretidir, fakat dönüşümün sonu değildir.
- **SOURCE-LED:** Güçlü birincil kaynağa dayanan ama canlı X gündemi kanıtı taşımayan konu
  adayı.
- **Statik site:** Sunucuda hesaplama yapmayan, önceden üretilmiş dosyalardan oluşan hızlı
  site.
- **UTM:** Linke hangi kaynaktan geldiğini ayırt etmek için eklenen kısa etiket; tek başına
  kişiyi tanımlamaz.
- **Vitest / lint / typecheck:** Sırasıyla otomatik test, kod kalitesi ve tip denetimi;
  yayın öncesi birlikte yeşil olmalıdır.

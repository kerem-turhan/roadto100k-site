# ANLATIM — sitenin el kitabı

> Bu dosya siteyi Kerem'e anlatır: ne var, neden var, nasıl güncellenir.
> Teknik bilgi gerektirmez; her terim kullanıldığı yerde açıklanır (bkz. §7 sözlük).
>
> **KALICI KURAL:** Sitede önemli bir değişiklik olduğunda (yeni bölüm, yeni sayfa türü,
> ritüel adımı değişimi) bu dosya **aynı commit'te** güncellenir. Dosya eskiyorsa yalan
> söylüyor demektir.
>
> Son güncelleme: 22 Temmuz 2026

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
(sunucu yok, veritabanı yok, çerez yok, izleme yok) ve GitHub Pages'te **ücretsiz** duruyor.
Yazı tipleri bile kendi sunucumuzdan geliyor; sayfa açıldığında dışarıya tek bir istek bile
gitmiyor (tek istisna: e-posta formunu gönderdiğinde Buttondown'a giden istek).

---

## 2. Sitede ne var — bölüm bölüm

### 2.1 Gördüğün bölümler (yukarıdan aşağı)

| Bölüm | Ne yapar |
|---|---|
| **Üst şerit + gün damgası** | "DAY 2 · 163 DAYS LEFT" — 19 Tem 2026'dan bu yana geçen gün ve hedefe kalan süre. Tarayıcının saatinden **canlı hesaplanır**, elle güncellenmez. |
| **Hero (giriş)** | Tek cümlelik iddia: $0 → $100k, 31 Aralık 2026. Yanında ne yaptığın ve bunun neden halka açık olduğu. |
| **The rules (kurallar)** | Bahsin kuralları: $100/ay tavan, $0 reklam, her sayı public, haftalık kayıt, yıl sonunda ne olursa olsun dürüst post-mortem. Bu bölüm senin kendine koyduğun kısıt — okuyucunun sana güvenmesinin sebebi. |
| **The ledger (defter)** | Sitenin kalbi. Haftalık tablo (hafta bitişi, gelir, MRR, harcama, abone, not) + üstünde **sparkline**: yeşil çizgi gerçekleşen kümülatif gelir, kesikli çizgi $100k'nın gerektirdiği tempo. Rakamların tamamı tek bir dosyadan gelir: `src/data/ledger.json`. |
| **What I'm building (ne inşa ediyorum)** | Ne üzerinde çalıştığın — kategori dilinde, ürün adı vermeden. Altında iletişim satırı. |
| **The work / proof (kanıt)** | Yayımlanmış işlerin listesi + "What I do" kartı (audit / eval-harness kurulumu / sürekli reliability desteği; fiyat yok). **22 Temmuz'da açıldı** (ilk teardown reposu public). Kural aynen duruyor ve 22 Temmuz'da sıkılaştırıldı: `src/config.ts` içindeki bir öğe, linki gerçek **ve** (rakam veriyorsa) `sourceCommit`'i dolu olmadıkça HTML'e hiç basılmaz; hiçbiri canlı değilse bölüm tamamen kaybolur. Ayrıntı: §4, "Kanıt bölümünün iki kapısı". |
| **Email signup (kayıt)** | Asıl hedef. Buttondown formu; "her Pazar gerçek rakamlar + yıl sonu post-mortem" vaadi. Buttondown adresi config'te boş bırakılırsa form yerine X'i takip bağlantısı gösterilir. |
| **Footer** | X, GitHub, e-posta, RSS bağlantıları + tema (açık/koyu) düğmesi. |

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
| **Tema + erişilebilirlik** | her yerde | Açık/koyu mod (sistem tercihi + düğme), klavye odak halkaları, ekran okuyucu etiketleri, `prefers-reduced-motion` (animasyon istemeyen kullanıcıda animasyon yok). İçerik hiçbir zaman **animasyona** bağlı değildir: animasyon kapalıyken de rakamlar tam olarak orada. (Ana sayfa şu an yine de JavaScript ile çiziliyor — JS kapalıysa boş görünür; hafta ve Türkçe sayfaları sade HTML olduğu için JS'siz de okunur. Ana sayfayı da JS'siz okunur hale getirmek denetim planında sırada.) |

### 2.3 Rakamlar nereden geliyor

**Tek kaynak:** `src/data/ledger.json`. Sitedeki her sayı — tablo, sparkline, hafta sayfaları,
RSS, JSON-LD, haftalık OG kartları — bu dosyadan türetilir. Başka hiçbir yerde elle yazılmış
sayı yoktur. Dosya bozuksa (eksik alan, yanlış tarih biçimi, aynı haftadan iki kayıt) **build
gürültülü şekilde patlar** ve site eski hâliyle yayında kalır; yanlış sayı asla yayına çıkmaz.

Benzer şekilde tüm dış bağlantılar ve tarihler `src/config.ts` içindedir: X adresi, GitHub,
e-posta, Buttondown, başlangıç tarihi, hedef tarihi, hedef tutar, kanıt öğeleri.

---

## 3. Nasıl güncellenir — Kerem'in Pazar rutini

Haftalık iş **tek dosyaya birkaç satır** eklemek. Toplam ~5 dakika (haftalık OG kartıyla
birlikte ~6).

### Adım 1 — Haftayı yaz

`site/src/data/ledger.json` içindeki `weeks` dizisinin **sonuna** yeni bir nesne ekle:

```json
{
  "weekEnding": "2026-07-26",
  "revenue": 0,
  "mrr": 0,
  "spend": 0,
  "emailSubs": 0,
  "note": "One honest sentence about the week.",
  "trNote": "Haftanın tek cümlelik Türkçe özeti (opsiyonel)."
}
```

- `weekEnding`: o haftayı kapatan **Pazar** (YYYY-AA-GG).
- `revenue` / `spend`: o haftanın tutarları (USD, tam dolar).
- `mrr` / `emailSubs`: o Pazar itibarıyla **toplam** durum.
- `note`: İngilizce, tek cümle, dürüst. Sitede, RSS'te, arama sonucunda bu görünür.
- `trNote`: **opsiyonel.** Yazarsan `/tr/` altında o hafta görünür; yazmazsan Türkçe tarafta
  o hafta **hiç** görünmez. Boş string ("") yazmak da "yok" demektir.

Kural: uydurma yok. $0 haftası $0 yazılır.

### Adım 2 — Haftanın paylaşım kartını üret (opsiyonel ama tavsiye)

```sh
cd site
npm run og
```

Bu komut, **bilgisayarındaki Chrome'u** görünmez modda çalıştırıp her hafta için 1200×630 bir
PNG üretir: İngilizce kart `public/og/w/<hafta>.png`, `trNote` yazdıysan Türkçe kart da
`public/og/w/tr/<hafta>.png`. Zaten var olan kartlara dokunmaz (yeniden üretmek için
`npm run og -- --force`). Kart önce geçici klasöre çizilir, boyutu doğrulanır, ancak ondan
sonra `public/`e kopyalanır — yarım kalan bir çalıştırma mevcut kartı bozamaz.

- Chrome yoksa komut anlamlı bir hata verir; kart üretilmezse hafta sayfası genel `og.png`'ye
  düşer — hiçbir şey kırılmaz, sadece paylaşım görseli jenerik olur.
- Bu adım **sadece senin bilgisayarında** çalışır; sunucuda (GitHub Actions) tarayıcı
  çalıştırılmaz, orada yalnız commit'lediğin PNG kopyalanır. Bütçe $0 kalır.

### Adım 3 — Commit + push

```sh
git add src/data/ledger.json public/og
git commit -m "chore(ledger): week of 2026-07-26"
git push
```

### Adım 4 — Otomatik olan kısım (sen bir şey yapmıyorsun)

Push'tan sonra GitHub Actions ~1 dakikada: tip kontrolü → lint → testler → build çalıştırır,
sonra siteyi yeniden yayınlar. Bu build sırasında **kendiliğinden** güncellenir:

- ana sayfadaki tablo ve sparkline,
- `/w/2026-07-26/` hafta sayfası + `/w/` arşivi,
- varsa `/tr/w/2026-07-26/` ve `/tr/`,
- `feed.xml`, `tr/feed.xml`, `sitemap.xml`, JSON-LD, hafta sayfasının OG etiketleri.

Testler kırmızıysa deploy **olmaz** — bozuk veri yayına çıkamaz. GitHub'da Actions sekmesinde
yeşil tik görürsen iş bitmiştir.

### Diğer rutin dışı değişiklikler

| Ne | Nerede |
|---|---|
| Kanıt bölümünü açmak (flip günü) | `src/config.ts` → `PROOF_ITEMS[0].url` = gerçek repo linki **+ `sourceCommit`** = o repodaki commit SHA'sı. |
| Yeni kanıt işi eklemek | `src/config.ts` → `PROOF_ITEMS` dizisine yeni nesne ({title, description, stats, url, sourceCommit}). Rakam (`stats`) veren her öğe `sourceCommit` **zorunlu** — yoksa öğe sitede hiç görünmez. |
| Buttondown / X / GitHub / e-posta adresi | `src/config.ts` |
| Özel alan adı alınırsa | `vite.config.ts` → `base: '/'` **ve** `src/config.ts` → `SITE_URL` |

---

## 4. Şu an neredeyiz (22 Temmuz 2026)

- Site **canlı**: HTTP 200, GitHub Actions deploy'u yeşil, Buttondown formu bağlı ve gerçek
  bir kayıtla test edilmiş.
- Defterde **1 hafta** var: 19 Temmuz 2026 (Gün 0) — gelir $0, MRR $0, harcama $0, abone 0.
  Hepsi gerçek; bu tabloda henüz gösterilecek bir başarı yok, tam da olması gereken bu.
- **Kanıt bölümü AÇILDI (22 Temmuz).** İlk teardown reposu public oldu; `PROOF_ITEMS[0].url`
  gerçek linkle dolduruldu, "The work" bölümü + "What I do" kartı artık sitede görünür.
  Sonraki kanıtlar da aynı yolla eklenir: config'e bir öğe yaz, `url`'i gerçek olduğu an yayında.
- Teknik taban tamam: JSON-LD, sitemap, robots, canonical, RSS, haftalık statik sayfalar,
  sparkline, haftalık OG kartları, Türkçe özet sayfaları, açık/koyu tema, erişilebilirlik.
- Otomatik testler (Vitest) mantığın tamamını koruyor: gün sayacı, defter doğrulama, feed,
  sitemap, JSON-LD, hafta sayfaları, sparkline, kanıt görünürlüğü, OG kartı, TR sayfaları.
- **22 Temmuz denetimi:** site düşman gözüyle baştan aşağı denetlendi (canlı tarayıcı +
  erişilebilirlik, testlerin gerçekten koruyup korumadığı, SEO/paylaşım, kanıt doğruluğu,
  sızıntı taraması). Bulgular ve sıralı plan: [docs/audit-2026-07-22.md](docs/audit-2026-07-22.md).
  Denetimin en önemli dersi: **bir "kapı" belgede yazıyor diye kapı olmuyor.** Kanıt kapısı
  yalnızca `https://` önekine bakıyordu; sahte bir link tüm testlerden geçip yayına girebiliyordu.
  Artık kapı gerçek (aşağıda), ve kalıcı kural şu: **bir bekçi bakamadığı durumda yeşil değil
  KIRMIZI verir — "bilmiyorum" = başarısız.**

### Kanıt bölümünün iki kapısı (22 Temmuz'da sıkılaştırıldı)

1. **Link gerçek olacak.** Sadece `https://` yetmez: gerçek bir alan adı + en az bir yol
   parçası şart; `example.com`, `localhost`, IP adresi, `TODO/TBD/WIP` gibi doldurma
   kelimeleri, `http://` ve şifreli linkler reddedilir. Reddedilen öğe HTML'e hiç basılmaz.
2. **Rakam veren iddia commit'e sabitlenecek** (`sourceCommit`). Kartın rakamları bizim
   config'imizde duruyor ama gerçek başka repoda; o repo değişince bizim cümle sessizce
   yalan olur. Pin bunu tarihsel bir cümleye çevirir: "e4076e2'de 6/6'ydı" — kartın altındaki
   `verified against commit …` satırı okuyucuyu tam o ağaca götürür. `stats` dolu ve
   `sourceCommit` yoksa öğe **görünmez**.

### Sızıntı bekçisi (`npm run leaks`)

Kural zaten vardı: yayınlanmamış ürünün adı ve NDA'lı proje adları bu public repoda hiçbir
yerde geçmeyecek. 22 Temmuz'a kadar bu kuralı **hiçbir makine kontrol etmiyordu** — denetimde
ürün adı `index.html`'e enjekte edildi ve bütün testler yeşil kaldı, kelime `dist`'e kadar
gitti. Artık bir bekçi var:

```sh
npm run leaks              # kaynakları tara
npm run leaks -- --dist    # build çıktısını da tara
npm run leaks -- --git     # bütün commit mesajlarını da tara
printf %s 'kelime' | npm run leaks:add   # listeye yeni kelime ekle
```

- **Yasaklı kelimeler repoda yazılı değil.** `scripts/leak-denylist.json` sadece tuzlanmış
  özetleri (hash) tutuyor; liste bu yüzden public repoda durabiliyor. Bu gizlilik değil,
  gözden saklama — amaç kazayla sızmayı durdurmak.
- **Nasıl yazıldığı fark etmiyor.** Metin küçük harfe indirilip harf-rakam dışındaki her şey
  silinerek taranıyor: `Foo-Bar`, `foo_bar`, `Foo Bar`, `kerem@foobar.com`,
  `https://x.com/foobar/...` ve minify edilmiş kodun içi dahil hepsi yakalanıyor. E-posta ve
  URL dizelerinin **içine** bakmak işin can alıcı kısmı — kardeş projede sızıntı tam orada
  saklanmıştı.
- **Bulgu raporlanırken kelime yazılmıyor:** `dosya:satır` + `[REDACTED len=N]`. Public repoda
  CI logları da public.
- **Bakamayan bekçi kırmızı yanar.** Liste yoksa/bozuksa/boşsa, bir klasör taşınmışsa, hedef
  sıfır dosya eşleştirmişse, `--dist` var ama build yoksa, klon sığsa → hepsi hata. Ayrıca her
  çalıştırmada bekçi kendi "kanarya" kelimesini yakalayabildiğini kanıtlıyor; kanıtlayamazsa
  o çalışma başarısız.
- **Nerede koşuyor:** CI'da build öncesi ve sonrası. Bir de `git config core.hooksPath .githooks`
  ile açılan **pre-push hook**'unda — CI ancak deploy'u durdurabilir, o noktada commit çoktan
  GitHub'da olur; hook ise kelime daha bilgisayardan çıkmadan yakalar.

**NDA'lı staj/işveren adları listede değil** (hiçbir yerde yazılı olmadıkları için).
Fırsat buldukça `printf %s 'ad' | npm run leaks:add` ile tek tek ekle — kelime hiçbir dosyaya,
hiçbir loga düşmez.

## 5. Sırada ne var

1. **Her Pazar defteri güncelle.** Sitenin tek gerçek bakımı bu; asıl bileşik faiz burada.
2. **Denetim planının kalan fazları** ([docs/audit-2026-07-22.md](docs/audit-2026-07-22.md)):
   sitenin kendisiyle çelişen yerlerini düzeltmek, ziyaretçinin "bu adam ne satıyor"
   sorusunun cevabını mobilde sayfanın %63'ünü kaydırmadan bulması, ana sayfanın
   JavaScript'siz de okunabilir hale gelmesi.
3. **E-posta listesini büyütmek** için X'ten siteye trafik: her defter haftası ayrı bir
   paylaşılabilir sayfa ve kendi görseline sahip — haftalık thread'in doğal ekidir.
4. Opsiyonel, ücretsiz: Google Search Console'a siteyi ekle (`sitemap.xml` zaten hazır) ve
   X kart doğrulayıcısıyla paylaşım görselini bir kez kontrol et.
5. İleride: özel alan adı (para gerektirir — bütçe kararı), ikinci/üçüncü kanıt öğesi,
   ilk gerçek gelir geldiğinde defterin öne çıkardığı metriklerin gözden geçirilmesi.

## 6. Riskler (ve neden şu an panik yok)

| Risk | Gerçek etkisi / önlem |
|---|---|
| **Defteri güncellemeyi bırakmak** | En büyük risk bu. Site teknik olarak kusursuz olsa da defter durursa iddia ölür. Tek panzehir: Pazar ritüeli. |
| **Bozuk veri girmek** | Build patlar, deploy olmaz, eski site yayında kalır. Yani "yanlış sayı yayında" senaryosu pratikte kapalı; ceza sadece "yeni hafta görünmez" olur. |
| **Sızıntı (ürün adı/mekanizması)** | Bu repo **public**. Ürün adı, mekanizması, private repo linkleri sitede, kodda, yorumlarda, commit mesajlarında geçmez — kategori dili kullanılır. Bu dosya da public'tir. |
| **Sahte içerik cazibesi** | Kimse "abone sayısını yuvarlama" veya "yakında" doldurma metni eklemeyecek. Boş olan şey görünmez (kanıt bölümü, TR haftası) — yalan söylemez. |
| **Paylaşım görselinin eski kalması** | X ve benzeri platformlar OG görselini önbelleğe alır; kart değişince ilk paylaşımda eski görsel çıkabilir. Çözüm: platformun kart doğrulayıcısından bir kez geçir. |
| **GitHub Pages sınırları** | Ücretsiz katman, statik dosya; soft limit ~100GB/ay bant genişliği — bu ölçekte sorun değil. Sunucu tarafı mantık (form işleme, veritabanı) mümkün değil; e-posta kaydı bu yüzden Buttondown'da. |
| **Analitik yok** | Bilinçli: çerez yok, izleme yok, $0. Karşılığında "kaç kişi geldi" verisi de yok. Sinyal olarak e-posta kaydı ve X etkileşimi kullanılır. |
| **Tek kişilik bakım** | Kod sade ve test edilmiş; ama devamlılık sana bağlı. Bu dosya tam olarak bu yüzden var. |

## 7. Mini sözlük

- **Statik site:** Sunucuda hesaplama yapmayan, önceden hazırlanmış dosyalardan ibaret site.
  Ucuz, hızlı, kırılması zor.
- **Build:** Kaynak koddan yayına çıkacak dosyaları üretme işlemi (`npm run build`).
- **Deploy:** Üretilen dosyaların yayına alınması. Burada push sonrası otomatik.
- **GitHub Actions:** Her push'ta çalışan ücretsiz otomasyon; testleri koşturup siteyi yayınlar.
- **GitHub Pages:** GitHub'ın ücretsiz statik site barındırma servisi.
- **Commit / push:** Değişikliği kaydetmek / GitHub'a göndermek.
- **JSON-LD:** Sayfanın içine gömülen, arama motorlarının okuduğu makine-okur veri etiketi.
- **sitemap / robots.txt:** Arama motorlarına sayfa listesi / gezinme izinleri.
- **canonical:** "Bu içeriğin asıl adresi" etiketi.
- **hreflang:** "Bu sayfanın şu dildeki karşılığı şurada" etiketi.
- **RSS:** Okuyucu uygulamalarının yeni içeriği otomatik çekmesini sağlayan standart akış.
- **OG görseli (Open Graph):** Link paylaşıldığında çıkan büyük önizleme görseli.
- **MRR:** Monthly Recurring Revenue — aylık yinelenen (abonelik) gelir.
- **Sparkline:** Eksen ve süs olmadan, sadece eğriyi gösteren küçük grafik.
- **Headless (görünmez) tarayıcı:** Penceresi açılmadan çalışan tarayıcı; burada ekran
  görüntüsü alıp OG kartı üretmek için kullanılır.
- **Vitest / lint / typecheck:** Sırasıyla otomatik testler, kod kalitesi denetimi ve tip
  denetimi. Üçü de yeşil olmadan deploy olmaz.

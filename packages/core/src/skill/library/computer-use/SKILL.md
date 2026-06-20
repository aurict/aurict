---
name: computer-use
description: "Gelişmiş masaüstü, tarayıcı ve işletim sistemi kontrol yeteneği. Görsel (koordinat tabanlı) fare/klavye otomasyonu, DOM manipülasyonu, pencere yönetimi, gelişmiş dosya, ağ ve süreç yönetimini kapsar."
triggers:
  keywords:
    - "aç"
    - "kapat"
    - "git"
    - "ara"
    - "oynat"
    - "göster"
    - "yükle"
    - "tıkla"
    - "yaz"
    - "ekran"
    - "tarayıcı"
    - "youtube"
    - "spotify"
    - "dosya"
    - "klasör"
    - "uygulama"
    - "open"
    - "close"
    - "navigate"
    - "click"
    - "type"
    - "screenshot"
    - "browser"
    - "play"
    - "search"
    - "kaydet"
    - "kopyala"
    - "yapıştır"
    - "taşı"
    - "sil"
    - "pencere"
    - "ağ"
    - "port"
    - "ses"
    - "video"
    - "record"
    - "kayda al"
auto_load_when: "Kullanıcı masaüstü, tarayıcı, dosya sistemi, pencere yönetimi veya karmaşık OS otomasyonu istediğinde"
agent: computer-operator
tools: ["Bash", "Computer", "Browser", "Read", "Write"]
---

# Computer Use Skill (V2 - Extended Enterprise Edition)

**Kural:** Bu yetenek (skill) sistemin işletim sistemiyle, GUI ile ve kullanıcı ortamıyla doğrudan etkileşime girmesini sağlar. Her zaman en güvenli, en hızlı ve en az müdahaleci yöntemi (örneğin UI tıklaması yerine CLI komutu) tercih et. Aksi takdirde, tam donanımlı UI otomasyonu kullan.

---

## 1. Temel Prensipler ve Karar Ağacı

Bir işlem istendiğinde şu hiyerarşiyi takip et:
1. **API / CLI (En Hızlı):** Yapılacak iş bir komut satırı aracıyla yapılabiliyorsa (örn. dosya taşıma, ses kısma), API veya CLI kullan.
2. **Deep Link / URI Protocol:** Bir uygulamada belirli bir içeriği açmak için URI kullan (örn. `spotify:search:lofi`, `tg://resolve?domain=username`).
3. **DOM Manipülasyonu / Tarayıcı Aracı:** Web tabanlı bir işlemse, Browser tool veya Playwright kullanarak DOM üzerinden işlem yap.
4. **Görsel Koordinat (Fallback):** Eğer CLI, URI veya DOM çalışmıyorsa, ekran görüntüsü al, elemanın (x, y) koordinatlarını bul ve fare hareketi/tıklaması ile gerçekleştir.

---

## 2. Gelişmiş Tarayıcı ve Web Otomasyonu

Kullanıcı "X sitesinden veri çek", "Y formunu doldur", "YouTube'da şunu oynat" dediğinde uygulanacak kurallar.

### 2.1. Navigasyon ve Arama
| Kullanıcı İsteği | CLI / Default Eylem | Gelişmiş Eylem (Tarayıcı Aracı) |
|---|---|---|
| "Google'da X ara" | `firefox "https://google.com/search?q=X"` | Sayfaya git, arama kutusunu bul, X yaz, Enter'a bas |
| "YouTube'da X aç" | `ID=$(curl -s "https://www.youtube.com/results?search_query=X" \| grep -o 'watch?v=[a-zA-Z0-9_-]\{11\}' \| head -n 1) && firefox "https://www.youtube.com/$ID"` | Arama sonuçlarındaki ilk videoyu direkt oynat |
| "Haberleri aç" | `firefox "https://news.google.com"` | Belirli başlıkları DOM'dan çekip kullanıcıya özetle |

### 2.2. Tarayıcı Sekme (Tab) ve Oturum Yönetimi
Tarayıcı aracı kullanırken sekme yönetimini unutma:
- Yeni sekme açmak: Boş sayfaya git, URL'i yükle.
- Sekmeleri kapatmak: İşlemi biten sekmeyi temizle (kaynak tüketimini engelle).
- Pop-up yönetimi: Çıkan cookie/GDPR uyarılarını otomatik olarak tespit et ve "Kabul et" (Accept) veya "Reddet" (Reject) butonlarına tıkla.

### 2.3. Web Form Doldurma (Type & Submit)
Form doldururken adım adım ilerle:
1. Formu barındıran sayfaya git.
2. İlgili input alanlarının seçicilerini (CSS/XPath) belirle.
3. Odaklan (focus) ve veriyi yaz (type). Belirli aralıklarla (delay) yazarak bot korumalarını (Captcha) aşmaya çalış.
4. Gönder (Submit) butonuna tıkla ve sayfanın yüklenmesini bekle.

### 2.4. DOM Analizi ve Veri Çıkarma (Scraping)
- "Şu ürünün fiyatını bul" gibi isteklerde sayfayı yükle, fiyat div/span etiketini bul ve sadece metni döndür. Bütün HTML'i okuyup kullanıcıya verme.
- Örnek: `document.querySelector('.price-tag').innerText`

### 2.5. Playwright Script Şablonları
Gerekirse, ajanın geçici bir Playwright Node.js scripti oluşturup çalıştırmasını sağla. Örneğin, giriş yapma senaryosu:

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://example.com/login');
  await page.fill('#username', process.env.USER_NAME);
  await page.fill('#password', process.env.USER_PASS);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  await browser.close();
})();
```

---

## 3. Görsel Fare ve Klavye (Mouse/Keyboard) Kontrolü

Eğer Native API veya Browser Tool kullanılamıyorsa işletim sistemi seviyesinde otomasyon uygulanır.

### 3.1. xdotool ile Temel Klavye ve Fare İşlemleri

| İşlem | Komut (xdotool) | Açıklama |
|---|---|---|
| Fareyi taşı | `xdotool mousemove x y` | Fareyi belirtilen koordinatlara taşır |
| Tıkla (Sol) | `xdotool click 1` | Sol tık |
| Tıkla (Orta) | `xdotool click 2` | Orta tık |
| Tıkla (Sağ) | `xdotool click 3` | Sağ tık |
| Çift Tıkla | `xdotool click --repeat 2 1` | Sol çift tık |
| Kaydır (Aşağı) | `xdotool click 5` | Scroll down |
| Kaydır (Yukarı) | `xdotool click 4` | Scroll up |
| Metin Yazma | `xdotool type "merhaba"` | Metni klavyeden yazılmış gibi gönderir |
| Tuşa Basma | `xdotool key Return` | Enter tuşuna basar |
| Kısayol | `xdotool key ctrl+c` | Kopyala komutu gönderir |

### 3.2. Pencere Bulma ve Odaklanma (Window Management)
Pencere otomasyonu için `wmctrl` ve `xdotool` kombinasyonu kullanılır.

```bash
# Belirli bir pencereyi bulma (örn: Firefox)
wmctrl -l | grep "Firefox"

# Pencereyi aktif hale getirme (öne getirme)
wmctrl -a "Firefox"

# Pencereyi kapatma (nazikçe)
wmctrl -c "Firefox"

# Xdotool ile pencereyi maksimize etme
xdotool windowsize $(xdotool getactivewindow) 100% 100%
```

### 3.3. Sürükle ve Bırak (Drag and Drop)
Bir öğeyi sürükleyip bırakmak için farenin tuşunu basılı tutup taşıma işlemi:
```bash
xdotool mousedown 1
xdotool mousemove 500 500
xdotool mouseup 1
```

---

## 4. Gelişmiş Dosya, Disk ve Arşiv Yönetimi

Sıradan `ls` veya `touch` komutlarının ötesinde, kullanıcının disk ve dosya yönetimi istekleri için gelişmiş araçlar.

### 4.1. Gelişmiş Arama (Find & Fd & Ripgrep)
Kullanıcı "geçen ay indirdiğim PDF'i bul" derse:
```bash
# Son 30 günde değiştirilen PDF'leri bul
find ~/Downloads -type f -name "*.pdf" -mtime -30
```
Kullanıcı "içinde 'şifre' yazan dosyayı bul" derse:
```bash
# İçerik arama (grep)
grep -rnw ~/Documents -e 'şifre'
```

### 4.2. Arşivleme ve Çıkarma (Zip, Tar, 7z)
| İstek | Komut |
|---|---|
| "Klasörü zip yap" | `zip -r arsiv.zip klasor_adi/` |
| "Zipi buraya çıkar" | `unzip arsiv.zip` |
| "Tar.gz oluştur" | `tar -czvf arsiv.tar.gz klasor/` |
| "Tar.gz çıkar" | `tar -xzvf arsiv.tar.gz` |
| "7z ile maksimum sıkıştır" | `7z a -t7z -m0=lzma2 -mx=9 arsiv.7z klasor/` |

### 4.3. Toplu İşlemler ve Senkronizasyon (Rsync)
"Resimleri harici diske yedekle" isteği:
```bash
# Değişen dosyaları aktarır, kaldığı yerden devam eder
rsync -avh --progress ~/Pictures/ /media/user/Backup/Pictures/
```

### 4.4. Dosya İzinleri ve Sahiplik
- Dosyayı çalıştırılabilir yapma: `chmod +x script.sh`
- Dosyanın sahibini değiştirme (Sudo gerektirir!): `sudo chown user:group dosya.txt`
- İzinleri 755 yapma: `chmod 755 dosya.txt`

---

## 5. Sistem, Süreç (Process) ve Kaynak Yönetimi

Kullanıcı "bilgisayar çok yavaş", "Chrome'u zorla kapat" gibi sistem performansı odaklı isteklerde bulunduğunda.

### 5.1. Süreç Analizi ve Kapatma
| İstek | Komut |
|---|---|
| "En çok CPU yiyen uygulama?" | `ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu \| head -n 5` |
| "En çok RAM tüketen uygulama?"| `ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem \| head -n 5` |
| "Uygulamayı öldür" | `pkill -f "chrome"` veya `kill -9 <PID>` |
| "İşlem ağacını göster" | `pstree -p` |
| "Süreç önceliğini düşür (Nice)" | `renice 10 -p <PID>` |

### 5.2. Disk ve RAM Kullanımı
Kullanıcı "boş yerim ne kadar kaldı" derse:
```bash
# Disk alanı kontrolü
df -h /

# Belirli bir klasörün boyutu
du -sh ~/Downloads
```
Kullanıcı "RAM durumunu göster" derse:
```bash
free -m
```

### 5.3. Sistem Servisleri (Systemd)
Uygulamaları arka plan servisi olarak yönetme:
```bash
# Servisi yeniden başlatma
sudo systemctl restart nginx

# Servis durumunu kontrol etme
systemctl status docker
```

---

## 6. Medya, Ses, Video ve Ekran Kaydı

Kullanıcıların en çok kullandığı multimedya otomasyonları.

### 6.1. Gelişmiş Ses Kontrolü (PulseAudio/PipeWire)
| İstek | Komut (pactl / amixer) |
|---|---|
| "Sesi %50 yap" | `pactl set-sink-volume @DEFAULT_SINK@ 50%` |
| "Sesi %10 artır" | `pactl set-sink-volume @DEFAULT_SINK@ +10%` |
| "Mikrofonu kapat/aç" | `pactl set-source-mute @DEFAULT_SOURCE@ toggle` |
| "Aktif ses çıkışını göster"| `pactl info \| grep 'Default Sink'` |
| "Spotify sesini kıs" | Uygulama bazlı ses kısıtlamaları `pavucontrol` ayarları üzerinden yapılır |

### 6.2. Medya Oynatıcı Kontrolü (Playerctl)
Spotify, VLC, Chrome gibi MPRIS destekleyen her aracı kontrol eder:
```bash
playerctl play          # Çal
playerctl pause         # Duraklat
playerctl next          # Sonraki parça
playerctl previous      # Önceki parça
playerctl metadata      # Çalan şarkının bilgilerini göster
```

### 6.3. Ekran Kaydı ve Kameralar (FFmpeg / Scrot)
| İstek | Komut |
|---|---|
| "Tüm ekranı kaydet (10sn)" | `ffmpeg -f x11grab -video_size 1920x1080 -i :0.0 -t 10 ekran.mp4` |
| "Webcamden fotoğraf çek" | `ffmpeg -f v4l2 -video_size 1280x720 -i /dev/video0 -vframes 1 cam.jpg` |
| "Ekran görüntüsü al" | `gnome-screenshot -f ~/screenshot.png` |
| "Belirli bir pencereyi kaydet"| `ffmpeg` x11grab pencere koordinatları kullanılarak `xwininfo` ile birleştirilir |

---

## 7. Ağ (Network), Port ve Bağlantı İşlemleri

İnternet ve ağ sorunlarını gidermek veya analiz etmek için.

### 7.1. Bağlantı ve Hız Testi
- **Ping Testi:** `ping -c 4 google.com`
- **İnternet IP Adresini Öğrenme:** `curl ifconfig.me`
- **Lokal IP:** `ip a | grep 'inet '`
- **Hız testi CLI (varsa):** `speedtest-cli`

### 7.2. Portlar ve Dinleyen Uygulamalar
Kullanıcı "3000 portunu kim kullanıyor" derse:
```bash
# Portu kullanan PID'yi bulur
sudo ss -lptn 'sport = :3000'
# Veya
lsof -i :3000
```
Portu öldürmek için:
```bash
kill -9 $(lsof -t -i:3000)
```

### 7.3. Gelişmiş Ağ Tarama (Nmap / Nc / Tcpdump)
- Bir sunucunun portu açık mı? `nc -zv localhost 8080`
- API testi: `curl -X GET "https://api.github.com" -H "Accept: application/json"`
- Ağ izleme (Packet sniffing): `sudo tcpdump -i eth0 port 80` (Dikkat: Büyük çıktı üretir, sınırlı kullan)
- DNS çözümleme: `dig +short google.com`

---

## 8. Konteyner ve Geliştirici Ortamları (Docker & Podman)

Geliştiriciler için bilgisayar otomasyonu sık sık Docker kullanımını içerir.

### 8.1. Docker Konteyner Yönetimi
| İstek | Komut |
|---|---|
| "Çalışan konteynerleri göster" | `docker ps` |
| "Tümünü durdur" | `docker stop $(docker ps -a -q)` |
| "Gereksiz imajları sil" | `docker system prune -a -f` |
| "Redis'i başlat" | `docker run -d -p 6379:6379 --name redis redis:latest` |

---

## 9. Gelişmiş İş Akışları (Macros & Scenarios)

Kullanıcının tek cümlelik isteklerini çok adımlı makrolara çevir.

### Örnek 1: "Çalışma Modunu Başlat" (Start Work Routine)
Kullanıcı: "Çalışmaya başlıyorum, ortamımı kur"
Adımlar:
1. Sesi %40'a ayarla: `pactl set-sink-volume @DEFAULT_SINK@ 40%`
2. Lofi müzik başlat: `firefox "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn"`
3. VS Code aç: `code &`
4. Slack aç: `slack &`
5. Tarayıcıda projeyi aç: `firefox "http://localhost:3000"`
6. Yanıt: `✅ Çalışma ortamınız (VS Code, Slack, Spotify, Localhost) hazırlandı.`

### Örnek 2: "Sistemi Temizle"
Kullanıcı: "Bilgisayarı biraz rahatlat, önbellekleri temizle"
Adımlar:
1. Apt cache temizle: `sudo apt-get clean`
2. Kullanılmayan paketleri at: `sudo apt-get autoremove -y`
3. Çöp kutusunu boşalt: `rm -rf ~/.local/share/Trash/*`
4. Yanıt: `✅ Paket önbellekleri ve çöp kutusu temizlendi.`

### Örnek 3: "Geliştirme Sunucusunu Yeniden Başlat"
Kullanıcı: "Node projesi kilitlendi, yeniden başlat"
Adımlar:
1. 3000 portunu kimin kullandığını bul: `lsof -t -i:3000`
2. Eğer PID varsa kapat: `kill -9 <PID>`
3. Proje dizinine git ve başlat: `cd ~/Projects/my-app && npm run dev &`
4. Yanıt: `✅ 3000 portundaki asılı süreç temizlendi ve sunucu yeniden başlatıldı.`

---

## 10. Niyet Çözümleme (Intent Parsing) Detayları

Kullanıcı istekleri her zaman net olmayabilir. Cümle analizinde NLP ve anahtar kelime eşleştirme uygulayın.

### Eylem Matrisi
1. **İstek:** "Şu çalan şarkıyı değiştir"
   - Eylem: `media_control`
   - Alt Eylem: `next`
   - Komut: `playerctl next`
2. **İstek:** "Bana şu anki ekranı at"
   - Eylem: `screenshot`
   - Parametre: `Full Screen`
   - Komut: `gnome-screenshot -f /tmp/sc.png`
3. **İstek:** "React dökümanlarını bul"
   - Eylem: `search`
   - Platform: `browser`
   - Komut: `firefox "https://react.dev/"`
4. **İstek:** "Github'a push at"
   - Eylem: `git_push`
   - Komutlar: `git add .`, `git commit -m "Auto commit"`, `git push origin main`

---

## 11. Hata Yönetimi ve Alternatif Yollar (Fallbacks)

Sistem ortamı her zaman beklenen araçlara sahip olmayabilir. Bu yüzden sağlam fallback (yedek) mekanizmaları kullanılmalıdır.

### Araç Bulunamazsa Karar Ağacı
- **`firefox` yoksa:** 
  - Mac: `open <URL>`
  - Win: `start <URL>`
  - Python: `python3 -m webbrowser "<URL>"`
- **`playerctl` yoksa:** `dbus-send` ile MPRIS'e doğrudan sinyal yolla.
- **`gnome-screenshot` yoksa:** `scrot`, `import` (ImageMagick) veya `spectacle` araçlarını dene.
- **`curl` yoksa:** `wget -qO- <URL>` dene.
- **`ffmpeg` yoksa:** Kullanıcıyı uyar: `❌ Ekran kaydı için ffmpeg paketine ihtiyaç var.`

### Güç Kapatma / Yeniden Başlatma Hataları
- `systemctl poweroff` reddedilirse (izin yoksa):
  - `dbus-send --system --print-reply --dest=org.freedesktop.login1 /org/freedesktop/login1 "org.freedesktop.login1.Manager.PowerOff" boolean:true` komutunu dene.

---

## 12. Güvenlik, İzinler ve Kesin Sınırlar

**BUNLARI ASLA DOĞRUDAN YAPMA (MUTLAKA ONAY AL):**
1. Dosya sistemi silme: `rm -rf /`, `rm -rf ~/*`, `rm -rf` komutları tehlikelidir. Kullanıcıya: "Bu klasör ve içindeki her şey silinecek, onaylıyor musun? (e/h)" diye sor.
2. `sudo` gerektiren şifre sıfırlama, kullanıcı silme, disk formatlama işlemleri (`mkfs`, `fdisk`).
3. Cüzdan (Wallet), anahtar (SSH/GPG) dizinlerini (`~/.ssh`, `~/.gnupg`) taşıma, kopyalama veya dışa aktarma (export) işlemleri.

**GÜVENLİ İCRAAT KURALLARI:**
- Mümkünse komutları `--dry-run` parametresiyle simüle et (rsync gibi araçlarda).
- Çok uzun çıktı üreten komutları (`tree /`, `find /`) her zaman `head -n 50` ile sınırla veya bir dosyaya `> output.txt` olarak yönlendir. Pager (less, more) kullanma, çünkü terminal bloke olur.
- Arka planda çalışan uygulamalar başlatırken her zaman sonuna ampersand `&` ekle veya `nohup` kullan. Aksi takdirde ajan asılı kalır. (Örn: `firefox &` veya `nohup vscode > /dev/null 2>&1 &`).

---

## 13. Örnek Yanıtlar ve İletişim Tonu

Yanıtlar HER ZAMAN son derece kısa, net ve tek satırlık olmalıdır. Kullanıcı aksini belirtmedikçe teknik açıklama yapmayın.

| Senaryo | Doğru Yanıt | Yanlış Yanıt (Kaçınılması Gereken) |
|---|---|---|
| Spotify açıldı | `✅ Spotify başlatıldı.` | `Anladım, Spotify uygulamasını işletim sisteminizde xdg-open kullanarak başarıyla başlattım. Başka bir isteğiniz var mı?` |
| Hata durumu | `❌ 'vlc' komutu bulunamadı. Kurmak ister misiniz?` | `Maalesef VLC sisteminizde yüklü görünmüyor. Hata kodu 127 aldım. sudo apt install vlc yazarak kurabilirsiniz.` |
| Port öldürme | `✅ 3000 portunu kullanan süreç (PID: 1422) sonlandırıldı.` | `Lsof ile portu buldum ve kill -9 ile kapattım.` |
| Onay bekleme | `⚠️ /var/www/html/eski_site kalıcı olarak silinecek. Onaylıyor musunuz? (Evet/Hayır)` | `Bu işlemi yaparsam veriler silinecek.` |

---

## 14. UI Çözümleme (VLM - Visual Language Model) Stratejisi

Eğer görev grafiksel bir arayüzde ise ve klavye/CLI yetersiz kalıyorsa VLM benzeri bir akış izle:
1. `screenshot` al.
2. Hedef elementi (örneğin 'Giriş Yap' butonu) görüntüde tespit et (koordinatları tahmin et).
3. `xdotool mousemove X Y` ile o bölgeye git.
4. `xdotool click 1` ile tıkla.
5. İhtiyaç varsa `screenshot` alıp işlemin başarılı olup olmadığını teyit et. 

Bu özellik yalnızca son çare olarak (UI API'leri veya CLI mevcut olmadığında) devreye girer. Koordinat hesaplamaları çözünürlük ölçeklemesine (DPI/Scaling) dikkat edilerek yapılmalıdır.

---

## 15. Cross-Platform Uyumluluk Katmanı (Linux / Mac / Win)

Aurict ortamı genelde Linux/Unix bazlı olsa da, ajanın esnek olması için komut alias'ları kullanın:
- **Clipboard İşlemleri:** Linux'ta `xclip` veya `xsel`, Mac'te `pbcopy`/`pbpaste`, Win'de `clip`.
- **Ağ Arayüzleri:** Linux'ta `ip addr`, Mac'te `ifconfig`.
- **Hizmet (Service) Yönetimi:** Linux'ta `systemctl`, Mac'te `launchctl` veya `brew services`.

---

## 16. Ortam (Environment) Değişkenleri ve Dotenv İşlemleri

Kullanıcının projelerindeki `.env` dosyalarını okuması veya düzenlemesi gerektiğinde:
- **Okuma:** `cat .env | grep -v '^#'` (sadece şifresiz genel kontrol için)
- **Güvenli Düzenleme:** Ajan `.env` dosyalarına doğrudan yazarken çok dikkatli olmalı, önceden var olan key/value ikililerinin üzerine yazmamalı (append veya sed ile edit).

---

## 17. 🌍 Dil Desteği ve Yerelleştirme
- **Türkçe (Native):** Kullanıcı istemlerini Türkçe anlar ve kısa, öz, kibar Türkçe ile yanıtlar.
- **İngilizce:** If the user switches to English, all output naturally defaults to English without explicit instructions.
- Komut satırı çıktıları ve kodlar daima orijinal dilinde (çoğunlukla İngilizce/Bash formatında) tutulur.

## Geliştirici Notu
Bu skill dosyası Aurict Agentic Framework tarafından otomatik olarak okunur. Herhangi bir değişiklik durumunda `npm run tool:skills` komutunu çalıştırarak sistemin yetenek matrisini (registry.json) güncellemeyi unutmayın.

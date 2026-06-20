---
name: flutter-game-expert
description: "Flutter game development with Flame Engine: game loops, component architecture, sprite caching, collision detection, large-scale Flutter apps."
triggers:
  extensions: [".dart"]
  directories: ["lib/game/", "lib/flame/", "assets/sprites/", "assets/audio/"]
  keywords: ["flame", "flutter game", "game loop", "sprite", "FlameGame"]
auto_load_when: "Building Flutter games or apps using Flame Engine"
agent: code
tools: ["Read", "Write", "Bash"]
---

# Flutter Game & Advanced Development Expert

Bu doküman, Flutter kullanarak sıfırdan ileri seviye, performanslı, karmaşık, ölçeklenebilir ve yönetilebilir oyun (Game Development) ve gelişmiş uygulama mimarileri oluşturmak için hazırlanmış en kapsamlı başvuru kılavuzudur.

## Quick Reference
- **Game Engine Seçimi:** Flutter ile oyun geliştirirken performanslı 2D oyunlar için **Flame Engine** kullanın. Basit animasyonlu oyunlar için `CustomPaint` ve `AnimationController` kullanılabilir.
- **Bileşen Tabanlı Mimari (FCS):** Flame içerisindeki `Component` yapısını (Flame Component System) kullanarak nesneleri (Player, Enemy, Background) modüler hale getirin.
- **State Management:** Karmaşık projelerde BLoC veya Riverpod kullanın. Oyun içi skor, can ve envanter oyun döngüsünden (game loop) ayrı bir state yöneticisinde (örn. Riverpod) veya Flame'in kendi `bloc` entegrasyonuyla tutulmalıdır.
- **Memory & Asset Caching:** Resim (sprite) ve sesleri oyun başlamadan önce önbelleğe alın (`Flame.images.loadAll`, `FlameAudio.audioCache.loadAll`). Aksi takdirde jank (takılma) oluşur.
- **Performans Optimizasyonu:** `Update` döngüsünde ağır hesaplamalardan kaçının. Karmaşık hesaplamaları Isolate'lere (arka plan threadleri) taşıyın.

## Anti-Patterns
- ❌ **Update Metodunda Nesne Oluşturma:** `update(double dt)` her karede çalışır. İçinde yeni nesneler üretmek GC'yi yorarak FPS düşürür.
- ❌ **Global Spagetti State:** Her şeyi tek bir dosyada veya global değişkende tutmak. Oyun mantığı ile UI katmanını birbirinden ayırın.
- ❌ **Çok Sayıda Küçük Component:** Ekranda gereğinden fazla Component render etmek yerine `SpriteBatch` kullanın.
- ❌ **Main Thread'i Tıkama:** Pathfinding (A* vb.) gibi algoritmaları ana iş parçacığında yapmayın, Isolate kullanın.

---

## 1. Mimariler ve Katmanlı Yapı (Clean Architecture for Games)

Büyük ölçekli bir oyun veya uygulama geliştirirken kodun sürdürülebilirliği en önemli faktördür. Oyun geliştirme genellikle "Spagetti Kod" üretmeye çok müsaittir. Bu yüzden katmanlı mimari şarttır.

### Klasör Yapısı Önerisi
```text
lib/
├── core/
│   ├── errors/ (Hata yönetimi)
│   ├── utils/ (Yardımcı fonksiyonlar, matematik kütüphaneleri)
│   └── constants/ (Oyun içi sabitler, renkler, physics timestep vb.)
├── data/
│   ├── models/ (API'den veya local DB'den gelen veri modelleri)
│   ├── repositories/ (Veri çekme/yazma mantığı)
│   └── datasources/ (Local SQLite/Hive/Isar veya Remote API)
├── domain/
│   ├── entities/ (Saf iş/oyun mantığı objeleri)
│   ├── repositories/ (Repository interfaceleri)
│   └── usecases/ (Örn: SaveGameUseCase, LoadLevelUseCase)
├── game/
│   ├── components/ (Player, Enemy, Bullet, Environment)
│   ├── core/ (Oyunun ana FlameGame sınıfı)
│   ├── mixins/ (Collidable, HasGameRef gibi paylaşılan özellikler)
│   ├── systems/ (Spawners, AI Controllers, Level Managers)
│   └── states/ (Oyun içi durumlar, FSM - Finite State Machine)
├── presentation/
│   ├── hud/ (Can barı, skor ekranı, menüler - Flutter Widget'ları)
│   ├── screens/ (Ana menü, Ayarlar, Oyun ekranı)
│   └── bloc/ (Riverpod veya BLoC dosyaları)
```

### Domain-Driven Design (DDD) Oyun Uyarlaması
Oyundaki nesnelerin state'leri (Can, Mermi Sayısı) "Domain" katmanında yaşarken, ekranda nasıl çizileceği (Render) "Game" katmanında (Flame Component) yaşar.
Bir mermi hasar verdiğinde Component doğrudan veritabanına yazmaz; UseCase çağırır. UseCase, Repository üzerinden veritabanına kaydeder.

---

## 2. Flame Engine Detaylı Analizi

### Game Loop ve Component System
Flame'in kalbi `update(double dt)` ve `render(Canvas canvas)` fonksiyonlarıdır.
- `update(dt)`: Mantıksal hesaplamaların yapıldığı yerdir. Fiziği hesapla, pozisyonu güncelle. `dt` (delta time) son kareden bu yana geçen saniyedir. Her hareketi `dt` ile çarpmak frame-rate bağımsız (fps-independent) hareket sağlar.
- `render(canvas)`: Sadece çizim yapılmalıdır. Asla mantıksal kontrol (`if (isDead)`) veya değişken ataması burada yapılmamalıdır.

### Mixins Kullanımı
Flame, çoklu kalıtım (multiple inheritance) gibi çalışan Mixin sistemini yoğun kullanır.
- `HasGameRef<MyGame>`: Component içinden ana oyun sınıfına (`gameRef`) erişmeyi sağlar. Ekran boyutunu okumak veya global oyun fonksiyonlarını çağırmak için.
- `CollisionCallbacks`: Çarpışmaları (onCollision, onCollisionStart, onCollisionEnd) dinlemek için.
- `TapCallbacks`, `DragCallbacks`: Dokunmatik ekran girdilerini dinlemek için.

### SpriteBatch Kullanımı
Eğer ekranda binlerce mermi veya partikül (yağmur, kar) varsa, her biri için ayrı `SpriteComponent` oluşturmak FPS'i 60'tan 10'a düşürebilir. Bunun yerine `SpriteBatchComponent` kullanmalısınız. `SpriteBatch` tek bir draw call (çizim çağrısı) ile binlerce sprite çizebilir.

```dart
final batch = await SpriteBatch.load('spritesheet.png');
batch.add(source: const Rect.fromLTWH(0, 0, 32, 32), offset: Vector2(100, 100));
```

---

## 3. İleri Seviye Performans Optimizasyonu

Flutter saniyede 60 veya 120 kare çizmeye çalışır. Her kare için sadece 16ms (60fps için) veya 8ms (120fps için) vaktiniz vardır. Bu süreyi aşarsanız "Jank" (takılma) oluşur.

### Garbage Collection (GC) Baskısından Kaçınma
Dart dilinde hafızada tutulan ve referansı kaybolan nesneler çöp toplayıcı (GC) tarafından temizlenir. GC çalıştığında oyun anlık donar.
**Çözüm:** Nesne havuzlama (Object Pooling) kullanın.
Diyelim ki silah mermi atıyor. Saniyede 50 mermi yaratıp yok etmek yerine, 100 mermilik bir "Pool" oluşturun. Ekrana giren mermiyi aktif (visible = true) yapın, ekrandan çıkanı pasif (visible = false) yapın. Böylece hiç yeni obje "new"lenmez, GC çalışmaz.

### Isolate (Multithreading) Kullanımı
Oyun sırasında arka planda büyük bir haritanın prosedürel üretilmesi (Procedural Generation) veya düşman yapay zekasının (A*) yol bulması gerekiyorsa, bunu Main Thread'de yapmayın.
Dart'ın `Isolate` yapısını veya `compute()` fonksiyonunu kullanın.

```dart
// Kötü
final path = calculatePathfinding(start, end, grid); // Ekran donar

// İyi
final path = await compute(calculatePathfinding, PathData(start, end, grid)); // Arka planda hesaplar
```

### Canvas API ve CustomPainter
Flame kullanmadan sadece Flutter ile oyun yapmak isterseniz `CustomPainter` hayat kurtarıcıdır.
- `canvas.drawRect`, `canvas.drawCircle`, `canvas.drawPath` kullanırken gereksiz obje yaratmaktan kaçının. Paint objelerini her seferinde `render` içinde oluşturmak yerine sınıf seviyesinde bir kere oluşturup tekrar kullanın (caching `Paint` objects).

---

## 4. Gelişmiş Çarpışma Tespiti ve Fizik (Forge2D)

Basit AABB (Axis-Aligned Bounding Box) kutu çarpışmaları Flame ile kolaydır. Ancak yerçekimi, sürtünme (friction), esneklik (restitution), dönüş (torque) ve karmaşık şekiller arası çarpışma gerekiyorsa **Forge2D** kullanmalısınız (Box2D'nin Dart portu).

### Body, Fixture, Shape
- **Body:** Fiziksel dünyadaki nesnedir. Hızı (velocity), konumu (position) vardır. Statik (hareketsiz, duvar), Kinematik (sadece kodla hareket eder), Dinamik (fiziğe tepki verir) olabilir.
- **Shape:** Body'nin geometrik şeklidir (Daire, Çokgen).
- **Fixture:** Shape'i Body'e bağlar. Malzeme özelliklerini (yoğunluk, sürtünme) belirler.

Forge2D dünyasında uzunluk birimi piksel değil metredir. Ekranda çizim yaparken piksel/metre dönüşümü yapılmalıdır (örn: 10 piksel = 1 metre).

---

## 5. UI ve HUD (Heads-Up Display) Entegrasyonu

Oyunun içindeki mantık ile dışındaki Flutter Widget'larını senkronize etmek zor olabilir.

### OverlayBuilder Kullanımı
Oyunun üzerine duraklatma menüsü, can barı gibi Flutter Widget'ları çizmek için `GameWidget.overlays` kullanın.

```dart
GameWidget(
  game: myGame,
  overlayBuilderMap: {
    'PauseMenu': (context, game) => PauseMenuWidget(game: game),
    'Hud': (context, game) => HudWidget(game: game),
  },
  initialActiveOverlays: const ['Hud'],
)
```

### State Senkronizasyonu (Riverpod/BLoC ile Flame)
Flame objelerinin Riverpod veya BLoC dinlemesi mümkündür. `StreamSubscription` kullanarak state değişikliklerini dinleyip Component'e yansıtabilirsiniz. Ancak dinleyicileri (listener) Component ekrandan kalktığında (`onRemove` metodunda) iptal etmeyi (cancel) unutmayın. Aksi halde Memory Leak (Hafıza Kaçağı) yaşanır.

---

## 6. Shaders ve Görsel Efektler

Flutter 3.x ve sonrasında Fragment Shaders (GLSL) desteği geldi. Gölgeler, su dalgalanmaları, parlamalar (bloom), CRT ekran efektleri gibi şeyleri CPU yerine GPU'da hesaplamak için shader kullanılır.

1. `.frag` dosyanızı yazın (GLSL dilinde).
2. `flutter.shaders` olarak `pubspec.yaml`'a ekleyin.
3. `FragmentProgram.fromAsset` ile yükleyin.
4. Çizim için `Paint()..shader = shader` kullanarak `canvas.drawRect` ile ekrana basın.

---

## 7. Multiplayer, Networking ve Kayıt Sistemleri

### Gerçek Zamanlı Multiplayer
Multiplayer oyunlar için HTTP Request uygun değildir. **WebSocket**, **gRPC stream** veya UDP tabanlı sistemler (örn: Nakama) kullanılmalıdır.
Oyun sunucusu otoriter (Server Authoritative) olmalıdır. Client sadece tuş basımlarını sunucuya yollar (örn: Sağa basıldı). Sunucu yeni koordinatı hesaplar ve client'lara yayınlar.
- **Gecikme Telafisi (Lag Compensation):** Client, sunucudan cevap gelmeden karakteri hareket ettirir (Client-side Prediction). Sunucudan gelen cevapla kendi durumunu düzeltir (Reconciliation).

### Kayıt Sistemi (Save States)
Oyun verileri sürekli ve hızlı bir şekilde güncelleniyorsa `SharedPreferences` yetersiz kalır.
- **Hive veya Isar:** Yüksek performanslı NoSQL veritabanlarıdır. Karakterin eşyalarını, bitirdiği bölümleri kaydetmek için kullanılmalıdır. Bütün save dosyası şifrelenmelidir (Encryption) aksi takdirde kullanıcılar dosyayı manipüle edip hile yapabilir.

---

## 8. Ses ve Müzik Optimizasyonu

Ses dosyaları mobil cihazlarda RAM'i çok hızlı tüketebilir.
- **BGM (Arka Plan Müziği):** Uzun parçalar için stream yöntemini kullanın, tüm mp3'ü RAM'e almayın.
- **SFX (Efektler):** Kısa silah, patlama, zıplama sesleri `FlameAudio.audioCache.loadAll` ile önceden yüklenmelidir (Preload). Aksi takdirde ses çalma anında I/O gecikmesi nedeniyle FPS drop yaşanır.
- Pool (Havuz) Sesler: Aynı saniye içinde 50 tane patlama sesi çalmak CPU'yu yorar ve ses cızırtısı yapar (Audio Clipping). Aynı ses kanalında eş zamanlı çalacak ses sayısına limit koyun (Polyphony Limit).

---

## 9. Matematik ve Geometri Başvurusu

Oyun yaparken Vector ve Matrix matematiği hayati önem taşır.

- **Mesafe Ölçümü:** İki nokta arası mesafe hesaplarken karekök işlemi `sqrt()` yavaştır. Eğer sadece iki nesnenin birbirine olan yakınlığını kıyaslıyorsanız karesini (`distanceToSquared`) kullanın.
- **Açı Bulma:** Bir karakterin fareye dönmesi için `atan2(y, x)` fonksiyonu kullanılır.
- **Vektör Normalizasyonu:** Sadece yön (direction) gerekiyorsa vektörü normalize edin (uzunluğunu 1 yapın). Böylece yön vektörünü hız ile çarparak sabit hızda çapraz gidiş elde edersiniz (Aksi halde çapraz giderken hipotenüsten dolayı daha hızlı gidilir).

---

## 10. Kamera ve Çözünürlük (Viewport & Scaling)

Telefonların en boy oranları (aspect ratio) birbirinden çok farklıdır (16:9, 18:9, iPad için 4:3).
- Eğer oyun alanının her cihazda aynı görünmesini istiyorsanız `FixedResolutionViewport` kullanın (Kenarlara siyah bant atar).
- Eğer cihazın kendi ekranına yayılmasını istiyorsanız `CameraComponent` ile UI öğelerini kenarlara (Anchor.topLeft, Anchor.bottomRight) sabitleyin. Asla mutlak piksel değerleri (x=100, y=500) kullanmayın, her zaman ekran genişliğinin (size.x) oranına göre (size.x * 0.1) pozisyonlama yapın.

---

## 11. Parçacık Sistemleri (Particle Systems)

Görsel zenginlik katmak için patlamalar, yağmur, kar, sihir efektleri gibi sistemlerde Particle System kullanılır.
Flame'in yerleşik `ParticleSystemComponent` yapısı mevcuttur. Ancak karmaşık sistemlerde binlerce partikül oluşturulacaksa objeleri tek tek oluşturmak yerine Compute Shader'lara (Custom Shaders) devredilmesi performansı büyük ölçüde artırır.
- **Yaşam Süresi (Lifespan):** Her partikülün bir TTL (Time To Live) değeri olmalı ve süre bitiminde yok olmalıdır (veya object pool'a geri dönmelidir).

---

## 12. Oyun İçi Yapay Zeka (AI) ve Durum Makineleri (FSM)

Düşman davranışları, patron savaşları (Boss Fights) veya NPC hareketleri için basit `if-else` blokları yerine FSM (Finite State Machine) kullanılmalıdır.
- **State Machine Component:** Karakterinizin durumlarını yönetmek için (Idle, Walk, Attack, Die) Flame'de `StateMachine` kullanılabilir.
- **Behavior Trees:** Daha karmaşık yapay zeka (örn: Oyuncuyu gördüyse saldır, canı %20'nin altındaysa kaç) için Davranış Ağaçları (Behavior Trees) kullanılmalıdır.

---

## 13. Harita ve Seviye Yönetimi (Tilemaps & Tiled)

Geniş açık dünya (Open World) veya platform (Platformer) oyunlarında seviyeleri elle kodlamak imkansızdır.
- **Tiled Editor:** `.tmx` veya `.json` formatında dışarı aktarılan haritaları kullanın.
- **Flame Tiled:** Tiled ile hazırlanan haritaları doğrudan `TiledComponent` olarak oyuna entegre edebilirsiniz.
- **Chunk Loading:** Harita çok büyükse, tüm haritayı aynı anda belleğe almayın. Sadece kameranın gördüğü ve etrafındaki gridleri (chunk) yükleyin. Kameradan uzaklaşan gridleri bellekten silin (unload).

---

## 14. Animasyonlar (Sprite Animation, Skeletal Animation)

Flame'de 2 tip animasyon yaygındır:
1. **Sprite Sheet Animations:** Tek bir resim dosyasındaki karelerin (frame) sırayla oynatılmasıdır. Kullanımı basittir, ancak çok fazla kare varsa hafızayı şişirir.
2. **Skeletal Animations (Spine, Rive):** Karakterin uzuvlarını kemik (bone) sistemine bağlayarak matematikle hareket ettirir. Animasyon çok akıcıdır (60fps bağımsızdır) ve dosya boyutu çok küçüktür. Vektörel destekleri sayesinde zoom yapıldığında bozulmazlar.
- Oyununuzda ana karakter gibi karmaşık animasyonlara sahip öğeler varsa kesinlikle **Rive** veya **Spine** kullanmalısınız.

---

## 15. Kamera Takip Sistemleri (Camera Behaviors)

Kameranın sadece karakteri merkeze alması her zaman iyi bir deneyim sunmaz.
- **Lerp (Linear Interpolation):** Kamera karakteri sertçe takip etmemelidir. Karakter hareket ettikten sonra kamera yumuşak bir şekilde peşinden gelmelidir (Smooth damping).
- **Parallax Effect:** Arka planın (dağlar, bulutlar) kameradan daha yavaş hareket etmesiyle derinlik hissi yaratılmasıdır. `ParallaxComponent` kullanarak kolayca entegre edilebilir.
- **Camera Shake:** Hasar alma, patlama gibi durumlarda kamerayı kısa süreli sarsmak (ekran titremesi) oyun hissiyatını (Game Feel) dramatik şekilde artırır.

---

## 16. Çapraz Platform (Cross-Platform) Girdi Yönetimi

Flutter ile tek kod tabanında iOS, Android, Web ve Masaüstü oyunları çıkarabilirsiniz.
Ancak kontroller platforma göre değişmelidir.
- **Mobil:** Ekrana çizilen sanal joystick'ler (Virtual Joystick) veya tap (dokunma) hareketleri.
- **Masaüstü (PC/Mac):** Klavye yön tuşları, WASD kombinasyonları ve fare tıklamaları.
- **Gamepad:** Xbox/PlayStation kontrolcülerini algılamak için ek paketler (örn: `gamepads`) kullanılmalı ve donanım düğmeleri oyun içi aksiyonlara map edilmelidir (Key Mapping).
- Kullanıcıya kendi tuş atamalarını (Custom Keybinds) yapma şansı sunun.

---

## 17. Test Stratejileri (Testing in Games)

Oyunlar çok fazla yan etkiye (side-effect) sahip oldukları için test edilmeleri zordur.
- **Unit Testing:** Matematiksel hesaplamaları, hasar formüllerini, veritabanı okuma/yazma servislerini (Domain & Data layer) saf Dart unit testleriyle test edin.
- **Component Testing:** Flame'in `flame_test` paketini kullanarak özel component'lerin yüklendiğini, başlangıç durumlarının doğruluğunu test edebilirsiniz.
- **Mocking:** Ağ çağrıları, I/O işlemleri (Asset yükleme) ve Rastgelelik (Random Number Generators) testlerde mock'lanmalıdır. Gerçek bir RNG kullanmak testlerin deterministik yapısını bozar ve "Flaky Tests" oluşmasına neden olur.

---

## 18. Güvenlik ve Hile Koruması (Anti-Cheat & Security)

Eğer oyununuz rekabetçi veya skor tabloları (Leaderboards) içeriyorsa, hileye karşı önlem almanız şarttır.
- **Memory Manipulation:** Hafızadaki "para" veya "skor" değişkenleri CheatEngine gibi programlarla değiştirilebilir. Kritik değişkenleri XOR kullanarak veya şifreli tutarak obfuscate edin.
- **API Güvenliği:** Skor gönderirken sadece sonucu değil, oyun sırasında basılan tuşları (Replay verisi) de sunucuya göndererek skoru sunucuda simüle edip doğrulayın (Server-side Validation).
- **Zaman Hilesi (Time Manipulation):** Kullanıcılar cihaz saatini ileri alarak günlük ödülleri anında toplayabilir. Zaman doğrulamalarını asla `DateTime.now()` üzerinden değil, güvenilir bir NTP (Network Time Protocol) sunucusundan alın.

---

## 19. Ses Senkronizasyonu ve Ritim (Rhythm & Audio Sync)

Müzik veya ritim tabanlı (Rhythm Games) oyunlarda, sesin kare hızına (frame-rate) tam olarak senkronize olması gereklidir.
- **Audio Latency:** Android cihazlarda donanımsal ses gecikmesi (audio latency) çok yaygındır.
- **Senkronizasyon Algoritması:** Sadece görsel pozisyonlara güvenmeyin. Çalan şarkının güncel süresine (`currentPosition`) bakarak görsel nesneleri o süreye göre pozisyonlandırın. Eğer cihazda saniyelik drop (FPS düşüşü) olursa objeler doğru yere ışınlanmış olur ve senkron bozulmaz.
- **Calibration:** Kullanıcılara ses gecikmesini kalibre edebilecekleri bir ekran (Settings -> Audio Calibration) sunun.

---

## 20. CI/CD ve Otomatik Dağıtım (Automated Publishing)

Oyun geliştirme sürecinde sürekli olarak derleme (build) almak geliştiriciyi çok yorar.
- **Fastlane:** Fastlane kullanarak iOS ve Android derlemelerinizi otomatikleştirin.
- **GitHub Actions / GitLab CI:** Push edilen her yeni kodda testlerin otomatik çalışmasını sağlayın. Testlerden geçerse, APK ve IPA dosyalarını otomatik oluşturup TestFlight / Google Play Console Internal Track üzerine gönderin.
- **Asset Pipeline:** Görüntü (sprite) boyutlarını düşürmek (TinyPNG API vb.) veya ses dosyalarını optimize etmek için CI/CD pipeline'ınıza asset optimizasyon scriptleri ekleyin.

---

## Detaylı Anti-Patterns (Genişletilmiş Versiyon)

- ❌ **FlameGame'i Stateless Widget içinde çağırmak:** `GameWidget` kendi içinde oldukça karmaşık bir lifecycle'a sahiptir. Etrafındaki widget ağacı sürekli rebuild oluyorsa GameWidget sıfırlanabilir. Etrafına `RepaintBoundary` ekleyin.
- ❌ **Kapsamlı (Deep) Widget Ağaçları İçinde GameWidget:** GameWidget'ı olabildiğince ağacın üst kısımlarında kök seviyesinde tutun. Alt sayfalarda olması performans düşüşüne yol açabilir.
- ❌ **SetState İçinde Ağır İşlem:** Oyun menülerinde Flutter UI kullanırken `setState` ile saniyede 60 kere ekranı yenilemeye (TickerProviderStateMixin ile) çalışmak, saf Flame (Canvas) kadar optimize değildir. UI kısımları reaktif olmalı ama render döngüsünü meşgul etmemelidir.
- ❌ **Asset'leri Asenkron Beklemeden Kullanmak:** `sprite = await loadSprite('img.png');` yaparken objeyi `onLoad` içinde hazırlayın. Obje henüz hazır olmadan `render` metodunda çizmeye çalışmak NullPointerException veya kırmızı ekran hatası fırlatır.
- ❌ **Büyük Görüntüleri Yeniden Boyutlandırmak:** 4K çözünürlüğünde bir resmi yükleyip, oyun içinde `size: Vector2(32, 32)` yaparak küçültmek belleği felç eder. Orijinal dosyayı ihtiyacınız olan boyuta yakın tutun.
- ❌ **Debug Modda FPS Testi Yapmak:** Dart VM'in Debug modu, Profile ve Release moduna göre aşırı yavaştır. Eğer oyun takılıyorsa, performans testini her zaman `flutter run --profile` veya `--release` ile yapın.
- ❌ **Zaman Bağımlı Olmayan (Non-dt) Hareket:** `position.x += 5;` yazmak yanlıştır. Eğer ekran 120Hz ise karakter 60Hz olana göre iki kat hızlı gider. Doğrusu: `position.x += speed * dt;` olmalıdır.
- ❌ **Sabit Kodlanmış String Kullanımı:** Düşman tiplerini veya item'ları `if (enemyType == "Goblin")` şeklinde kontrol etmek hataya açıktır. Her zaman `enum` veya sınıf hiyerarşisi kullanın.
- ❌ **Global Event Bus Kötüye Kullanımı:** Her olayı global bir event-bus üzerinden yayınlamak, büyük oyunlarda kodu kimin nerede değiştirdiğini takip etmeyi imkansız hale getirir. State yönetimini (Riverpod vs) tercih edin.

---

Bu belge, bir Flutter projesinde oyun veya ultra karmaşık bir grafiksel sistem geliştirileceği zaman birincil başvuru kaynağıdır. İhtiyaç duyduğunuz anda, bu best-practice'lere bağlı kalarak kodu şekillendiriniz.

# Öğretmen Hesabım

Öğretmenin günlük çalışma paneli + öğrenciler için kişisel portal. Sunucu gerektirmez, GitHub Pages'te çalışır.

**Site adresi:** https://gencbeyinlernet.github.io/ogretmenhesap1/

## Öğretmen paneli
- **Ana Sayfa:** bugünkü dersler (şu anki/sıradaki ders), yapılacaklar, yaklaşan etkinlikler, hızlı not
- **Ders Programı:** haftalık program
- **Ajanda:** aylık takvim (toplantı, nöbet, sınav, veli görüşmesi…)
- **Notlarım:** kişisel renkli notlar
- **Öğrencilerim:** tek tek / toplu ekleme, öğrenci detayı, giriş kartı yazdırma
- **Yoklama** ve **Not Girişi** (sınıf not çizelgesiyle)
- **Ödev & Duyuru**
- **Profil & Ayarlar:** profil, şifre, yedekleme, öğrenci portalını yayınlama

## Öğrenci portalı
Öğrenci okul numarası ve öğretmenin verdiği şifreyle girer; notlarını, devamsızlığını, ödevlerini, duyuruları ve ders programını görür.

## Veriler nasıl saklanır?
- Öğretmen verileri **yalnızca öğretmenin tarayıcısında** (localStorage) durur. Düzenli **yedek alın** (Profil & Ayarlar → Yedek indir).
- Öğrencilerin kendi cihazından görmesi için: **Profil & Ayarlar → Yayın dosyasını oluştur** → inen `ogrenci-veri.json` dosyasını depoya yükleyin (**Add file → Upload files → Commit changes**).
- Bu dosyada her öğrencinin verisi kendi şifresiyle **AES-256 ile şifrelidir**; özel notlar ve veli bilgileri dosyaya eklenmez.

# 📱 راهنمای ساخت فایل APK اپلیکیشن «آپدیت‌یار»

این راهنما مرحله‌به‌مرحله توضیح می‌دهد که چطور از پروژه‌ی آماده‌ی Android (پوشه `android/`)، فایل نصبی APK بسازید.

> **پیش‌نیاز مهم:** اپ «آپدیت‌یار» یک WebView اپ است؛ یعنی فایل APK یک قاب (شل) اندروید است که وب‌سایت اپ را باز می‌کند. بنابراین **گوشیِ کاربر هنگام استفاده به اینترنت و در دسترس بودن آدرس سرور نیاز دارد.**

---

## ۱. نصب پیش‌نیازها

### گام ۱: نصب Android Studio

1. به آدرس [developer.android.com/studio](https://developer.android.com/studio) بروید.
2. نسخه‌ی Windows (یا مک/لینوکس متناسب با سیستم شما) را دانلود و نصب کنید.
3. حین نصب، همه‌ی گزینه‌های پیش‌فرض را **Next** بزنید (شامل Android SDK و Virtual Device).
4. بعد از نصب، Android Studio را باز کنید و بگذارید کامپوننت‌های اولیه را دانلود کند (چند دقیقه طول می‌کشد).

> حجم دانلود اولیه حدود ۲ تا ۳ گیگابایت است؛ اینترنت پرسرعت توصیه می‌شود.

### گام ۲: بررسی JDK

Android Studio به‌صورت خودکار JDK (نسخه ۱۷ به بالا) دارد و نیازی به نصب جداگانه نیست.

---

## ۲. باز کردن پروژه

1. مخزن گیت‌هاب را **clone** کنید (یا فایل ZIP را دانلود و باز کنید):

```bash
git clone https://github.com/Hasanqwjdjd/Hasan-Vpn.git
```

2. در Android Studio: **File → Open** و پوشه‌ی `android` داخل پروژه را انتخاب کنید
   (یعنی مسیر `Hasan-Vpn/android`).
3. بار اول، Android Studio شروع به **Gradle Sync** می‌کند و وابستگی‌ها را دانلود می‌کند؛ صبر کنید تا کامل شود (پایین پنجره نوار پیشرفت است). اگر خطای SDK گرفت، روی لینک «Install missing SDK» کلیک کنید.

---

## ۳. (مهم) بررسی آدرس سرور داخل اپ

اپ موقع باز شدن، آدرس داخل `capacitor.config.ts` را باز می‌کند:

```ts
server: {
  url: 'https://p1cnf8f921h0-d.space-z.ai/',   // ← این آدرس
}
```

- اگر سایت اپ را روی هاست دیگری (مثلاً Vercel) منتشر کردید، این خط را به آدرس جدید تغییر دهید.
- بعد از تغییر، در ترمینال ریشه‌ی پروژه اجرا کنید:

```bash
npx cap sync android
```

سپس در Android Studio دوباره APK بگیرید.

---

## ۴. ساخت APK (روش ساده — Debug)

مناسب تست سریع روی گوشی خودتان:

1. در Android Studio منوی **Build → Build Bundle(s) / APK(s) → Build APK(s)** را بزنید.
2. صبر کنید تا پیام «BUILD SUCCESSFUL» بیاید.
3. از نوتیفیکیشن پایین-راست روی **locate** کلیک کنید تا مسیر فایل باز شود:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

4. همین فایل `app-debug.apk` را به گوشی بفرستید (تلگرام/کابل/…) و نصب کنید. ✅

---

## ۵. ساخت APK نهایی (Release — برای انتشار در کافه‌بازار/مایکت)

فایل Debug برای انتشار مناسب نیست؛ باید نسخه‌ی **امضاشده (Signed)** بسازید.

### گام ۱: ساخت کلید امضا (Keystore) — فقط یک‌بار

در ترمینال Android Studio (پایین پنجره، تب Terminal) اجرا کنید:

```bash
keytool -genkey -v -keystore updatayar-release.keystore -alias updatayar -keyalg RSA -keysize 2048 -validity 10000
```

- یک رمز حداقل ۶ کاراکتری وارد و تکرار کنید.
- سوالات (نام، سازمان، شهر…) را جواب دهید — می‌توانید Enter خالی بزنید به‌جز دو سوال آخر (باید با `yes` تأیید کنید).
- ⚠️ **فایل `updatayar-release.keystore` را گم نکنید و رمزش را جایی ذخیره کنید!** بدون آن هیچ‌وقت نمی‌توانید آپدیت نسخه‌ی بعدی اپ را منتشر کنید.

فایل ساخته‌شده را به مسیر `android/app/` منتقل کنید.

### گام ۲: تنظیم امضا در Gradle

فایل `android/app/build.gradle` را باز کنید و این بخش‌ها را اضافه کنید:

```gradle
android {
    // ... بقیه تنظیمات ...

    signingConfigs {
        release {
            storeFile file("updatayar-release.keystore")
            storePassword "رمز_کی_استور"
            keyAlias "updatayar"
            keyPassword "رمز_کی_استور"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

(به‌جای `رمز_کی_استور` همان رمزی را بگذارید که موقع ساخت keystore وارد کردید.)

### گام ۳: گرفتن APK امضاشده

1. منوی **Build → Build Bundle(s) / APK(s) → Build APK(s)** را بزنید.
2. خروجی در این مسیر ساخته می‌شود:

```
android/app/build/outputs/apk/release/app-release.apk
```

این فایل، نسخه‌ی نهایی و قابل انتشار است. 🎉

> 💡 برای انتشار در کافه‌بازار، AAB بهتر است: منوی **Build → Generate Signed Bundle / APK → Android App Bundle** را هم می‌توانید استفاده کنید.

---

## ۶. تغییر شماره نسخه برای آپدیت‌های بعدی

هر بار که می‌خواهید نسخه‌ی جدید منتشر کنید، در `android/app/build.gradle`:

```gradle
versionCode 2        // ← یکی بیشتر کنید (عدد صحیح)
versionName "1.1"    // ← نسخه‌ی نمایشی به کاربر
```

---

## ۷. سوالات پرتکرار

**❓ موقع نصب APK روی گوشی، پیام «نصب مسدود شد» می‌آید**
در تنظیمات گوشی: Security → Install unknown apps → اجازه‌ی نصب به برنامه‌ای که فایل را باهاش منتقل کردید بدهید.

**❓ اپ باز می‌شود ولی صفحه سفید است**
سرور آنلاین در دسترس نیست یا آدرس داخل `capacitor.config.ts` اشتباه/قدیمی است. آدرس را در مرورگر گوشی تست کنید.

**❓ خطای Gradle Sync (دانلود نمی‌شود)**
برای تحریم‌ها ممکن است نیاز به تغییر پروکسی یا استفاده از mirror باشد. در تنظیمات Android Studio (Settings → HTTP Proxy) پروکسی را تنظیم کنید یا از ابزارهایی مثل رادار/شکن استفاده کنید.

**❓ مجوز REQUEST_INSTALL_PACKAGES برای چیست؟**
این مجوز به اپ اجازه می‌دهد بسته‌های به‌روزرسانی را نصب کند (در صفحه‌ی آنبوردینگ اپ هم توضیح داده شده). اگر فعلاً نمی‌خواهید، خط مربوطه را از `android/app/src/main/AndroidManifest.xml` حذف کنید.

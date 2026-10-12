package com.updatayar.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * پلاگین نیتیو «آپدیت‌یار»
 *
 * قابلیت‌های واقعی روی گوشی:
 *  1) listInstalledApps — خواندن لیست واقعی برنامه‌های نصب‌شده با نام، نسخه، حجم، آیکون و تاریخ نصب
 *     + fallback هوشمند برای گوشی‌های شیائومی/MIUI که دسترسی را محدود می‌کنند
 *  2) openApp           — اجرای واقعی یک برنامه نصب‌شده
 *  3) openInStore       — باز کردن صفحه‌ی واقعی برنامه در کافه‌بازار / مایکت / گوگل‌پلی
 *  4) openUrl           — باز کردن هر لینک (مرورگر، ایمیل، درگاه پرداخت و...)
 *  5) openAppSettings   — باز کردن تنظیمات خود اپ (برای دسترسی خاص MIUI)
 *  6) رویداد appUrlOpen — بازگشت به اپ از deep-link (مثل بازگشت از درگاه پرداخت)
 */
@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    /** حجم آیکون بازگشتی (پیکسل) — کوچک نگه داشته می‌شود تا پاسخ پل سنگین نشود */
    private static final int ICON_SIZE = 72;
    /** سقف تعداد آیکون‌ها در هر پاسخ (بقیه بدون آیکون برمی‌گردند) */
    private static final int MAX_ICONS = 120;

    private static final int REQ_NOTIFICATIONS = 4401;

    /**
     * پکیج‌های شناخته‌شده‌ی کاتالوگ — اگر گوشی اجازه‌ی لیست کامل ندهد،
     * حداقل این‌ها (که در Manifest با &lt;queries&gt; اعلام شده‌اند) قابل خواندن‌اند
     */
    private static final String[] CATALOG_PACKAGES = {
            "com.digikala", "com.instagram.android", "org.telegram.messenger",
            "app.snapp.passenger", "com.snappfood", "app.bale.messenger",
            "com.aparat", "com.soroush.plus", "com.torob.mobile", "com.mellat.bbank",
            "com.filimo", "com.whatsapp", "com.google.android.apps.maps",
            "com.google.android.youtube", "org.schabi.newpipe", "dev.patrickgold.florisboard",
            "com.farsitel.bazaar", "ir.mservices.market", "com.android.vending"
    };

    @PluginMethod
    public void listInstalledApps(final PluginCall call) {
        // خواندن لیست پکیج‌ها سنگین است؛ در نخ جداگانه اجرا می‌شود
        new Thread(() -> {
            JSArray arr = new JSArray();
            try {
                String selfPkg = getContext().getPackageName();
                List<PackageInfo> packages = null;
                String listError = null;
                try {
                    PackageManager pm = getContext().getPackageManager();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        packages = pm.getInstalledPackages(
                                PackageManager.PackageInfoFlags.of(PackageManager.GET_META_DATA));
                    } else {
                        packages = pm.getInstalledPackages(PackageManager.GET_META_DATA);
                    }
                } catch (Exception e) {
                    listError = e.getClass().getSimpleName() + ": " + e.getMessage();
                }

                final boolean restricted = packages == null || packages.isEmpty();

                // اگر لیست کامل خالی/ممنوع بود (مثلاً MIUI) → تلاش با پکیج‌های اعلام‌شده در queries
                List<PackageInfo> effective;
                if (restricted) {
                    effective = readCatalogPackages();
                    if (effective.isEmpty()) {
                        JSObject err = new JSObject();
                        err.put("message", "PERMISSION_DENIED: " +
                                (listError != null ? listError : "گوشی اجازه‌ی دیدن هیچ برنامه‌ای نداد"));
                        call.reject(err.getString("message"));
                        return;
                    }
                } else {
                    effective = packages;
                }

                PackageManager pm = getContext().getPackageManager();
                int iconCount = 0;
                for (PackageInfo pi : effective) {
                    try {
                        if (pi == null || pi.applicationInfo == null) continue;
                        ApplicationInfo ai = pi.applicationInfo;
                        if (selfPkg.equals(ai.packageName)) continue;

                        JSObject o = new JSObject();
                        o.put("packageName", ai.packageName);

                        String label;
                        try {
                            label = ai.loadLabel(pm).toString();
                        } catch (Exception e) {
                            label = ai.packageName;
                        }
                        o.put("appName", label);

                        o.put("versionName", pi.versionName != null ? pi.versionName : "?");
                        long vc = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                                ? pi.getLongVersionCode() : pi.versionCode;
                        o.put("versionCode", vc);

                        boolean isSystem = (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                        o.put("isSystem", isSystem);
                        o.put("installTime", pi.firstInstallTime);

                        double sizeMB = 0;
                        try {
                            if (ai.sourceDir != null) {
                                long bytes = new File(ai.sourceDir).length();
                                sizeMB = Math.round(bytes / 1048576.0 * 10) / 10.0;
                            }
                        } catch (Exception e) {
                            sizeMB = 0;
                        }
                        o.put("sizeMB", sizeMB);

                        // آیکون فقط برای برنامه‌های غیرسیستمی و تا سقف مشخص (کاهش حجم داده)
                        if (!isSystem && iconCount < MAX_ICONS) {
                            String iconB64 = null;
                            try {
                                Drawable d = ai.loadIcon(pm);
                                Bitmap bmp = drawableToBitmap(d, ICON_SIZE);
                                if (bmp != null) {
                                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                                    bmp.compress(Bitmap.CompressFormat.PNG, 70, bos);
                                    iconB64 = Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP);
                                    bmp.recycle();
                                }
                            } catch (Throwable e) {
                                iconB64 = null;
                            }
                            if (iconB64 != null) {
                                o.put("iconBase64", iconB64);
                                iconCount++;
                            }
                        }

                        arr.put(o);
                    } catch (Throwable e) {
                        // این پکیج نادیده گرفته می‌شود
                    }
                }
            } catch (Throwable fatal) {
                // هر خطای غیرمنتظره — به‌جای شکست، هرچه جمع شده برمی‌گردد
            }

            JSObject ret = new JSObject();
            ret.put("apps", arr);
            call.resolve(ret);
        }).start();
    }

    /** خواندن پکیج‌های کاتالوگ یکی‌یکی (در حالت محدودشده کار می‌کند چون در queries اعلام شده‌اند) */
    private List<PackageInfo> readCatalogPackages() {
        List<PackageInfo> out = new ArrayList<>();
        PackageManager pm = getContext().getPackageManager();
        for (String pkg : CATALOG_PACKAGES) {
            try {
                PackageInfo pi = pm.getPackageInfo(pkg, PackageManager.GET_META_DATA);
                if (pi != null) out.add(pi);
            } catch (Exception ignored) {
                // نصب نیست
            }
        }
        return out;
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String pkg = call.getString("packageName");
        if (pkg == null || pkg.isEmpty()) {
            call.reject("packageName is required");
            return;
        }
        try {
            Intent i = getContext().getPackageManager().getLaunchIntentForPackage(pkg);
            if (i == null) {
                call.reject("no_launch_intent: " + pkg);
                return;
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("open_failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openInStore(PluginCall call) {
        String pkg = call.getString("packageName");
        String store = call.getString("store", "bazaar");
        if (pkg == null || pkg.isEmpty()) {
            call.reject("packageName is required");
            return;
        }

        final String schemeUri;
        final String webUri;
        switch (store) {
            case "myket":
                schemeUri = "myket://details?id=" + pkg;
                webUri = "https://myket.ir/app/" + pkg;
                break;
            case "googleplay":
                schemeUri = "market://details?id=" + pkg;
                webUri = "https://play.google.com/store/apps/details?id=" + pkg;
                break;
            case "github":
                // برای اپ‌های گیت‌هابی صفحه‌ی ریلیزها در مرورگر باز می‌شود
                schemeUri = null;
                webUri = call.getString("url", "https://github.com/");
                break;
            case "bazaar":
            default:
                schemeUri = "bazaar://details?id=" + pkg;
                webUri = "https://cafebazaar.ir/app/" + pkg;
                break;
        }

        if (schemeUri != null) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(schemeUri));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
                return;
            } catch (Exception ignored) {
                // اپ فروشگاه نصب نیست → مرورگر
            }
        }
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(webUri));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("no_store_or_browser");
        }
    }

    /** باز کردن هر لینک در اپ مناسب سیستم (مرورگر، ایمیل، درگاه پرداخت و...) */
    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("no_handler: " + e.getMessage());
        }
    }

    /** باز کردن تنظیمات خود اپ — برای فعال‌کردن دسترسی «اطلاعات برنامه‌های نصب‌شده» در MIUI */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
            } catch (Exception ex) {
                call.reject("settings_open_failed: " + ex.getMessage());
            }
        }
    }

    /** وضعیت دسترسی‌های لازم اپ — برای نمایش و درخواست واقعی در آنبوردینگ/تنظیمات */
    @PluginMethod
    public void getPermissionStatus(PluginCall call) {
        JSObject ret = new JSObject();

        // اعلان‌ها (اندروید ۱۳+/runtime — پایین‌تر همیشه مجاز)
        boolean notifications = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notifications = ContextCompat.checkSelfPermission(
                    getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        }
        ret.put("notifications", notifications);

        // اجازه نصب بسته‌های ناشناس (برای نصب مستقیم آپدیت)
        boolean canInstall = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                canInstall = getContext().getPackageManager().canRequestPackageInstalls();
            } catch (Exception e) {
                canInstall = false;
            }
        }
        ret.put("canInstall", canInstall);

        call.resolve(ret);
    }

    /** درخواست واقعی دسترسی اعلان‌ها — دیالوگ سیستمی اندروید ۱۳+ باز می‌شود */
    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("skipped", true);
            call.resolve(ret);
            return;
        }
        try {
            ActivityCompat.requestPermissions(
                    bridge.getActivity(),
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    REQ_NOTIFICATIONS);
            call.resolve();
        } catch (Exception e) {
            call.reject("request_failed: " + e.getMessage());
        }
    }

    /** باز کردن صفحه‌ی سیستم «نصب برنامه‌های ناشناس» برای خود اپ */
    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } else {
                Intent i = new Intent(Settings.ACTION_SECURITY_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("settings_open_failed: " + e.getMessage());
        }
    }

    /** رویداد باز شدن اپ از طریق deep-link (updatayar://payment) */
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        notifyDeepLink(intent);
    }

    @Override
    public void handleOnResume() {
        super.handleOnResume();
        // برخی مرورگرها به‌جای deep-link کاربر را با back به اپ برمی‌گردانند؛
        // در هر دو حالت جاوااسکریپت با visibilitychange متوجه می‌شود، اینجا فقط برای اطمینان:
        Intent intent = bridge.getActivity() != null ? bridge.getActivity().getIntent() : null;
        notifyDeepLink(intent);
    }

    private void notifyDeepLink(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;
        String url = data.toString();
        if (!url.startsWith("updatayar://")) return;
        JSObject ret = new JSObject();
        ret.put("url", url);
        notifyListeners("appUrlOpen", ret);
    }

    /** تبدیل Drawable به بیت‌مپ مربعی در اندازه‌ی دلخواه */
    private static Bitmap drawableToBitmap(Drawable drawable, int size) {
        if (drawable instanceof BitmapDrawable) {
            Bitmap src = ((BitmapDrawable) drawable).getBitmap();
            if (src != null && !src.isRecycled()) {
                return Bitmap.createScaledBitmap(src, size, size, true);
            }
        }
        @NonNull Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        drawable.setBounds(0, 0, size, size);
        drawable.draw(canvas);
        return bmp;
    }
}

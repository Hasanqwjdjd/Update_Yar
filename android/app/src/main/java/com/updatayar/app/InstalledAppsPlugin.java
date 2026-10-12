package com.updatayar.app;

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
import android.util.Base64;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.List;

/**
 * پلاگین نیتیو «آپدیت‌یار»
 *
 * قابلیت‌های واقعی روی گوشی:
 *  1) listInstalledApps — خواندن لیست واقعی برنامه‌های نصب‌شده با نام، نسخه، حجم، آیکون و تاریخ نصب
 *  2) openApp           — اجرای واقعی یک برنامه نصب‌شده
 *  3) openInStore       — باز کردن صفحه‌ی واقعی برنامه در کافه‌بازار / مایکت / گوگل‌پلی
 */
@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    /** حجم آیکون بازگشتی (پیکسل) */
    private static final int ICON_SIZE = 96;

    @PluginMethod
    public void listInstalledApps(final PluginCall call) {
        // خواندن لیست پکیج‌ها سنگین است؛ در نخ جداگانه اجرا می‌شود
        new Thread(() -> {
            JSArray arr = new JSArray();
            String selfPkg = getContext().getPackageName();
            List<PackageInfo> packages;
            try {
                PackageManager pm = getContext().getPackageManager();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packages = pm.getInstalledPackages(
                            PackageManager.PackageInfoFlags.of(PackageManager.GET_META_DATA));
                } else {
                    packages = pm.getInstalledPackages(PackageManager.GET_META_DATA);
                }
            } catch (Exception e) {
                call.reject("failed_to_list: " + e.getMessage());
                return;
            }

            PackageManager pm = getContext().getPackageManager();
            for (PackageInfo pi : packages) {
                if (pi == null || pi.applicationInfo == null) continue;
                ApplicationInfo ai = pi.applicationInfo;
                if (selfPkg.equals(ai.packageName)) continue;
                try {
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

                    // آیکون فقط برای برنامه‌های غیرسیستمی (کاهش حجم داده)
                    if (!isSystem) {
                        String iconB64 = null;
                        try {
                            Drawable d = ai.loadIcon(pm);
                            Bitmap bmp = drawableToBitmap(d, ICON_SIZE);
                            if (bmp != null) {
                                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                                bmp.compress(Bitmap.CompressFormat.PNG, 80, bos);
                                iconB64 = Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP);
                            }
                        } catch (Exception e) {
                            iconB64 = null;
                        }
                        if (iconB64 != null) o.put("iconBase64", iconB64);
                    }

                    arr.put(o);
                } catch (Exception e) {
                    // این پکیج نادیده گرفته می‌شود
                }
            }

            JSObject ret = new JSObject();
            ret.put("apps", arr);
            call.resolve(ret);
        }).start();
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

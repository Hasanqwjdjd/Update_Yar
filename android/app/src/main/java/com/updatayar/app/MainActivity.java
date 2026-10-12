package com.updatayar.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // ثبت پلاگین محلی «InstalledApps» — قابلیت‌های واقعی گوشی
        registerPlugin(InstalledAppsPlugin.class);
    }
}

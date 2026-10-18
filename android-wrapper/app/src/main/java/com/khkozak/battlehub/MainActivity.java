package com.khkozak.battlehub;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.view.WindowInsets;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.content.Intent;
import android.speech.RecognizerIntent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

public class MainActivity extends Activity {
    private static final int KOZAK_VOICE_REQUEST = 5107;
    private WebView webView;

    public final class KozakDeviceBridge {
        @JavascriptInterface
        public void startVoiceRecognition() {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "uk-UA");
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "uk-UA");
                    intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Скажи команду для KOZAK Assistant");
                    startActivityForResult(intent, KOZAK_VOICE_REQUEST);
                } catch (Exception ignored) {
                    if (webView != null) webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('kozak-native-voice-error'))", null);
                }
            });
        }

        @JavascriptInterface
        public String getInstalledApps() {
            JSONArray apps = new JSONArray();
            try {
                Intent query = new Intent(Intent.ACTION_MAIN, null);
                query.addCategory(Intent.CATEGORY_LAUNCHER);
                PackageManager pm = getPackageManager();
                List<ResolveInfo> results;
                if (Build.VERSION.SDK_INT >= 33) {
                    results = pm.queryIntentActivities(query, PackageManager.ResolveInfoFlags.of(0));
                } else {
                    results = pm.queryIntentActivities(query, 0);
                }
                for (ResolveInfo info : results) {
                    if (info.activityInfo == null) continue;
                    JSONObject app = new JSONObject();
                    app.put("label", String.valueOf(info.loadLabel(pm)));
                    app.put("packageName", info.activityInfo.packageName);
                    apps.put(app);
                }
            } catch (Exception ignored) {}
            return apps.toString();
        }

        @JavascriptInterface
        public boolean launchApp(String packageName) {
            if (packageName == null || !packageName.matches("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+")) return false;
            try {
                Intent launch = getPackageManager().getLaunchIntentForPackage(packageName);
                if (launch == null) return false;
                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(launch);
                return true;
            } catch (Exception ignored) { return false; }
        }

        @JavascriptInterface
        public void openStore(String packageName) {
            if (packageName == null || !packageName.matches("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+")) return;
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception ignored) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignoredAgain) {}
            }
        }
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(17, 21, 26));
        getWindow().setNavigationBarColor(Color.rgb(11, 14, 18));
        getWindow().getDecorView().setSystemUiVisibility(0);
        if (Build.VERSION.SDK_INT >= 35) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            getWindow().setDecorFitsSystemWindows(false);
        }
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(11, 14, 18));
        if (Build.VERSION.SDK_INT >= 35) {
            webView.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setLoadsImagesAutomatically(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(new KozakDeviceBridge(), "KozakDevice");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if (!"file".equals(scheme) && !"https".equals(scheme) && !"http".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                    return true;
                }
                if (("http".equals(scheme) || "https".equals(scheme)) &&
                    uri.getHost() != null && !uri.getHost().equals("localhost") &&
                    !uri.toString().contains("github.io/kh-kozak-pubg/")) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                    return true;
                }
                return false;
            }
        });
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) {}
        });
        setContentView(webView);
        if (savedInstanceState == null) webView.loadUrl("file:///android_asset/www/index.html");
        else webView.restoreState(savedInstanceState);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != KOZAK_VOICE_REQUEST || webView == null) return;
        if (resultCode == RESULT_OK && data != null) {
            java.util.ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (matches != null && !matches.isEmpty()) {
                String spoken = JSONObject.quote(matches.get(0));
                webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('kozak-native-voice',{detail:{text:" + spoken + "}}))", null);
                return;
            }
        }
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('kozak-native-voice-error'))", null);
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
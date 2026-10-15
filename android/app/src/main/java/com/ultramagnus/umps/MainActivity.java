package com.ultramagnus.umps;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Capacitor host. Requests gallery/media permission on launch so HTML
 * {@code <input type="file" accept="image/*">} pickers (card art, custom backs)
 * can open Photos / Files on Pixel / modern Android.
 */
public class MainActivity extends BridgeActivity {
    private static final int REQ_MEDIA = 2401;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestGalleryPermissionIfNeeded();
    }

    private void requestGalleryPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 34) {
            boolean images =
                    ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES)
                            == PackageManager.PERMISSION_GRANTED;
            if (!images) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[] {
                            Manifest.permission.READ_MEDIA_IMAGES,
                            Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
                        },
                        REQ_MEDIA);
            }
        } else if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[] { Manifest.permission.READ_MEDIA_IMAGES },
                        REQ_MEDIA);
            }
        } else if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this,
                    new String[] { Manifest.permission.READ_EXTERNAL_STORAGE },
                    REQ_MEDIA);
        }
    }
}

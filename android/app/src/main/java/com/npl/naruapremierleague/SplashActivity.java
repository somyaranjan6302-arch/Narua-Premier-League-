package com.npl.naruapremierleague;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.view.ViewGroup;
import android.widget.VideoView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }

        setContentView(R.layout.activity_splash);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat insetsController =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.hide(WindowInsetsCompat.Type.systemBars());
        insetsController.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );

        VideoView videoView = findViewById(R.id.splashVideoView);
        int videoResId = getResources().getIdentifier("splash_video", "raw", getPackageName());

        if (videoResId != 0) {
            Uri videoUri = Uri.parse("android.resource://" + getPackageName() + "/" + videoResId);
            videoView.setOnCompletionListener(mp -> launchMainActivity());
            videoView.setOnErrorListener((mp, what, extra) -> {
                launchMainActivity();
                return true;
            });
            videoView.setOnPreparedListener(mp -> videoView.post(() -> {
                if (isFinishing()) {
                    return;
                }

                ViewGroup container = findViewById(R.id.splashRoot);
                int viewWidth = videoView.getWidth();
                int viewHeight = videoView.getHeight();
                int containerWidth = container.getWidth();
                int containerHeight = container.getHeight();
                if (viewWidth > 0 && viewHeight > 0 && containerWidth > 0 && containerHeight > 0) {
                    float coverScale = Math.max(
                        containerWidth / (float) viewWidth,
                        containerHeight / (float) viewHeight
                    );
                    videoView.setScaleX(coverScale);
                    videoView.setScaleY(coverScale);
                }
                videoView.start();
            }));
            videoView.setVideoURI(videoUri);
        } else {
            launchMainActivity();
        }
    }

    private void launchMainActivity() {
        if (!isFinishing()) {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(intent);
            finish();
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        }
    }
}

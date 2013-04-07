package me.rocketlaunch.mondosms;

import org.apache.cordova.DroidGap;
import android.os.Bundle;
import android.view.Menu;

public class MainActivity extends DroidGap {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/index.html");
    }
    
    @Override
    public boolean onPrepareOptionsMenu (Menu menu) {
        return false;
    }
    
}

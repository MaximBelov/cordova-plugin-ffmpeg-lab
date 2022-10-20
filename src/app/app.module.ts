import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@awesome-cordova-plugins/splash-screen/ngx';
import {StatusBar} from '@awesome-cordova-plugins/status-bar/ngx';
import {File} from '@awesome-cordova-plugins/file/ngx';
import { WebView } from '@awesome-cordova-plugins/ionic-webview/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';

import {FFMpeg} from 'awesome-cordova-plugins-ffmpeg/ngx';
import {Chooser} from 'awesome-cordova-plugins-chooser/ngx';
import {AdvancedImagePicker} from 'awesome-cordova-plugins-advanced-image-picker/ngx';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';


@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
    providers: [
        StatusBar,
        SplashScreen,
        FFMpeg,
        Chooser,
        File,
        WebView,
        Camera,
        AdvancedImagePicker,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}

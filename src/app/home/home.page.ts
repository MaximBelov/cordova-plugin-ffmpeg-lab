import { Component, Injector } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoadingController, Platform, AlertController } from '@ionic/angular';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { WebView } from '@awesome-cordova-plugins/ionic-webview/ngx';
import { Camera, CameraOptions, PictureSourceType, MediaType } from '@awesome-cordova-plugins/camera/ngx';
import { Chooser } from 'awesome-cordova-plugins-chooser/ngx';
import { FFMpeg, VideoInformation } from 'awesome-cordova-plugins-ffmpeg/ngx';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {

    public encodedSrc: SafeResourceUrl | String = '';
    public videoInformation: VideoInformation;
    public filesDirectory: string;
    public tempDirectory: string;
    private readonly videoMimeTypes = ['video/mp4', 'video/quicktime'];

    private readonly file = this.injector.get(File);
    private readonly chooser = this.injector.get(Chooser);
    private readonly ffMpeg = this.injector.get(FFMpeg);
    private readonly loadingController = this.injector.get(LoadingController);
    private readonly alertController = this.injector.get(AlertController);
    private readonly platform = this.injector.get(Platform);
    private readonly webview = this.injector.get(WebView);
    private readonly camera = this.injector.get(Camera);
    private readonly sanitizer = this.injector.get(DomSanitizer);

    constructor(private injector: Injector) {
        this.platform
            .ready()
            .then(() => {
                if (this.platform.is('cordova')) {
                    this.filesDirectory = this.file.dataDirectory + 'files/';
                    this.tempDirectory = this.platform.is('ios') ? this.file.tempDirectory : this.file.cacheDirectory;
                }
            })
            .catch((error) => {
                throw error;
            });
    }

    /**
     * Chooser
     */
    async selectAndProbeVideo() {
        const videoFileEntry = await this.getVideoFile(10000000 * 10, this.videoMimeTypes);
        if (!videoFileEntry) {
            return;
        }
        const { inputFilePath } = videoFileEntry;

        try {
            this.videoInformation = await this.ffMpeg.probe(inputFilePath);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Chooser
     */
    async selectAndEncodeVideo() {
        const videoFileEntry = await this.getVideoFile(10000000 * 10, this.videoMimeTypes);
        if (!videoFileEntry) {
            return;
        }
        const { inputFilePath, outputFilePath } = videoFileEntry;
        const loader = await this.loadingController.create({ id: 'ffmpeg' });
        await loader.present();
        await this.encodeVideo(inputFilePath, outputFilePath)
        await this.loadingController.dismiss(null, null, 'ffmpeg');
        this.encodedSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.webview.convertFileSrc(outputFilePath)
        );
    }

    /**
     * Camera
     */
    async selectFromGalleryAndProbeVideo() {
        const videoFileEntry = await this.getVideoFromGallery();
        if (!videoFileEntry) {
            return;
        }
        try {
            this.videoInformation = await this.ffMpeg.probe(videoFileEntry.inputFilePath);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Camera
     */
    async selectFromGalleryAndEncodeVideo() {
        const videoFileEntry = await this.getVideoFromGallery();
        if (!videoFileEntry) {
            return;
        }
        const loader = await this.loadingController.create({ id: 'ffmpeg' });
        await loader.present();
        await this.encodeVideo(videoFileEntry.inputFilePath, videoFileEntry.outputFilePath)
        await this.loadingController.dismiss(null, null, 'ffmpeg');
        this.encodedSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.webview.convertFileSrc(videoFileEntry.outputFilePath)
        );
    }

    private async getVideoFromGallery() {
        const options: CameraOptions = {
            sourceType: PictureSourceType.PHOTOLIBRARY,
            saveToPhotoAlbum: false,
            mediaType: MediaType.VIDEO,
        };
        const videoPath = (await this.camera.getPicture(options)) as string;
        let currentName: string;
        if (this.platform.is('android')) {
            const originalName = videoPath.substring(videoPath.lastIndexOf('/') + 1, videoPath.lastIndexOf('?'));
            const newName = `${new Date().getTime()}.${originalName.split('.')[1]}`;
            await this.file.moveFile(this.tempDirectory, originalName, this.tempDirectory, newName);
            currentName = newName;
        } else {
            currentName = videoPath.substr(videoPath.lastIndexOf('/') + 1);
        }
        return {
            inputFilePath: `${this.tempDirectory}${currentName}`,
            outputFilePath: `${this.tempDirectory}${new Date().getTime()}.mp4`
        };
    }

    private async getVideoFile(maxFileSize: number, mimeTypes: string[]): Promise<{ inputFilePath: string, outputFilePath: string }> {
        try {
            const fileEntry = await this.chooser.getFile({ mimeTypes: mimeTypes.join(','), maxFileSize });
            if (!fileEntry) {
                return;
            }
            const { path, name } = fileEntry;
            const outputFileName = `${name}_${new Date().getTime()}.mp4`;
            return {
                inputFilePath: path,
                outputFilePath: `${this.tempDirectory}${outputFileName}`
            }

        } catch (e) {
            console.error(e);
            const alert = await this.alertController.create({
                header: 'Alert',
                subHeader: '',
                message: e === 'Invalid size' ? e : 'Error while reading file',
                buttons: ['OK'],
            });
            await alert.present();
        }
    }

    private async encodeVideo(inputFilePath: string, outputFilePath: string) {
        try {
            const command = [
                `-i ${inputFilePath}`,
                '-vcodec libx264',
                '-preset veryfast',
                '-vf scale=w=1280:h=1280:force_original_aspect_ratio=decrease',
                '-movflags faststart',
                outputFilePath,
            ].join(' ');
            await this.ffMpeg.exec(command);
        } catch (error) {
            console.log(error);
        }
    }
}

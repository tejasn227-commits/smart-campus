export class CameraService {
  private stream: MediaStream | null = null;

  async requestCameraPermission(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      return this.stream;
    } catch (error) {
      console.error('Camera permission denied:', error);
      throw new Error('Camera access denied. Please allow camera access in your browser settings.');
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  isCameraActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}

export const cameraService = new CameraService();

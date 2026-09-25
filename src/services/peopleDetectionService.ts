import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export class PeopleDetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private loading = false;

  async loadModel(): Promise<void> {
    if (this.model || this.loading) return;

    this.loading = true;
    try {
      this.model = await cocoSsd.load();
      console.log('COCO-SSD model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  async detectPeople(
    videoElement: HTMLVideoElement
  ): Promise<{ count: number; confidence: number }> {
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const predictions = await this.model.detect(videoElement);

    // Filter for person detections
    const people = predictions.filter(pred => pred.class === 'person');

    const count = people.length;
    const confidence = people.length > 0
      ? people.reduce((sum, p) => sum + p.score, 0) / people.length
      : 0;

    return { count, confidence };
  }

  isModelLoaded(): boolean {
    return this.model !== null;
  }
}

export const peopleDetectionService = new PeopleDetectionService();

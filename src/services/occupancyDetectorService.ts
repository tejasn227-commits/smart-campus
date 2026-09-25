export type OccupancyDetection = {
  count: number;
  confidence: number;
  percentage: number;
  status: 'EMPTY' | 'OCCUPIED' | 'CROWDED';
  source: 'yolov8-bytetrack' | 'demo';
};

const detectorUrl = import.meta.env.VITE_OCCUPANCY_API_URL || 'http://127.0.0.1:8000';

export const occupancyDetectorService = {
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${detectorUrl}/health`);
      const data = await response.json() as { detector?: string };
      return response.ok && data.detector === 'yolov8-bytetrack';
    } catch {
      return false;
    }
  },

  async detect(video: HTMLVideoElement, roomId: string, capacity: number): Promise<OccupancyDetection> {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new Error('Could not capture a camera frame');

    const response = await fetch(`${detectorUrl}/api/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', 'x-room-id': roomId, 'x-room-capacity': String(capacity) },
      body: blob,
    });
    if (!response.ok) throw new Error(`Occupancy API returned ${response.status}`);
    const result = await response.json() as Partial<OccupancyDetection> & { ok?: boolean };
    if (!result.ok || result.source !== 'yolov8-bytetrack') throw new Error('YOLO backend is unavailable');
    return result as OccupancyDetection;
  },
};

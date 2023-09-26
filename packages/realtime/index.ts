import { sseHandler } from './src/helpers';

export const uploadStatus = sseHandler<{ status: 'start' | 'converting' | 'end'; percentage?: number; video_id: string }>('uploadStatus');

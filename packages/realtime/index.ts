import { sseHandler } from './src/helpers';

export const uploadStatus = sseHandler<{ status: 'start' | 'converting' | 'end'; percentage?: number; video_id: string }>('uploadStatus');

export const comments = sseHandler<{ comment: string; username: string; created_at: Date; user_id: string }>('comments');

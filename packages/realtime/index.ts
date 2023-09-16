import { sseHandler } from './src/helpers';

export const uploadStatus = sseHandler<{ msg: string; conversion?: number; id: string }>('uploadStatus:id');

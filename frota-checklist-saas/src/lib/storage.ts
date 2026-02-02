import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export type StoredFile = {
  filePath: string;
  mimeType: string;
};

export interface StorageService {
  save(file: File, folder: string): Promise<StoredFile>;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export class LocalStorageService implements StorageService {
  async save(file: File, folder: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.mkdir(path.join(UPLOAD_DIR, folder), { recursive: true });

    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, folder, filename);
    await fs.writeFile(filePath, buffer);

    return {
      filePath,
      mimeType: file.type
    };
  }
}

export const storageService = new LocalStorageService();

import { Readable } from 'stream';

export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface FileStorage {
  /**
   * Stores the content under a new unique name and returns that name.
   * @param content file content
   * @param extension extension including the leading dot, e.g. ".pdf"
   */
  save(content: Buffer, extension: string): Promise<string>;

  /**
   * Opens a read stream of a stored file.
   * @throws file not found error when the file does not exist
   */
  createReadStream(storedFileName: string): Promise<Readable>;

  /**
   * Deletes a stored file. Deleting a file that does not exist is not an error.
   */
  delete(storedFileName: string): Promise<void>;
}

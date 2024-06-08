import { Cipher, createCipheriv, createDecipheriv, createHash, Decipher } from 'crypto';

const { crypto } = require('config');

export class Cryptography {
  private readonly key: Buffer;
  private readonly iv: Buffer;
  private cipher: Cipher;
  private decipher: Decipher;

  constructor() {
    //sha256 returns a 32 bytes Buffer
    this.key = createHash('sha256').update(crypto.encryptionKey).digest();
    this.iv = createHash('sha256').update(crypto.iv).digest().subarray(0, 16);
  }

  public encrypt(textToEncrypt: string): string {
    //https://stackoverflow.com/questions/51280576/trying-to-add-data-in-unsupported-state-at-cipher-update
    this.cipher = createCipheriv('aes-256-ctr', this.key, this.iv);
    return this.cipher.update(textToEncrypt, 'utf8', 'hex').concat(this.cipher.final('hex'));
  }

  public decrypt(encryptedText: string): string {
    this.decipher = createDecipheriv('aes-256-ctr', this.key, this.iv);
    return this.decipher.update(encryptedText, 'hex', 'utf-8').concat(this.decipher.final('utf8'));
  }
}

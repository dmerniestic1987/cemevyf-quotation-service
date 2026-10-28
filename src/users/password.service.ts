import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { AUTH_CONFIG, AuthConfig } from '../auth/auth.config';

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyHash: string;

  constructor(@Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.hash(randomUUID());
  }

  hash(password: string): Promise<string> {
    return hash(password, this.authConfig.bcryptRounds);
  }

  /**
   * Checks a password against a hash. When there is no hash (unknown user) it compares against a dummy one,
   * so the response time does not reveal whether the user exists.
   */
  async verify(password: string, passwordHash?: string): Promise<boolean> {
    const matches = await compare(password, passwordHash ?? this.dummyHash);
    return matches && !!passwordHash;
  }
}

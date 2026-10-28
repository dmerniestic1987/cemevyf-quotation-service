import { Reflector } from '@nestjs/core';

/** Skips authentication and role checks. Every endpoint is protected unless it is marked with @Public() */
export const Public = Reflector.createDecorator<boolean, boolean>({ transform: () => true });

import { Transform } from 'class-transformer';

export const normalizeUsername = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Usernames are case insensitive: they are trimmed and lower cased before they are validated and used */
export const NormalizeUsername = () => Transform(({ value }) => normalizeUsername(value));

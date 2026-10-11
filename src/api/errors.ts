export type KitsuErrorKind = 'network' | 'http' | 'parse';

export class KitsuError extends Error {
  readonly kind: KitsuErrorKind;
  /** HTTP status for `http` errors, null otherwise. */
  readonly status: number | null;

  constructor(kind: KitsuErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'KitsuError';
    this.kind = kind;
    this.status = status;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isRateLimit(): boolean {
    return this.status === 429;
  }
}

export const isKitsuError = (e: unknown): e is KitsuError => e instanceof KitsuError;

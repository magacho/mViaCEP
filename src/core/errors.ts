// Framework-agnostic typed errors for mViaCEP.
// No React/Vue/Angular/DOM imports allowed here.
//
// Every failure in the core resolves to one of these variants so adapters can
// branch on the outcome without string-matching. Each error is discriminable
// BOTH by `instanceof` and by a literal `type` discriminant, so consumers can
// `switch` on `.type` or use `instanceof`.

/**
 * Thrown/returned when a CEP is malformed (not 8 digits after normalization).
 */
export class InvalidCepError extends Error {
  readonly type = "invalid_cep" as const;

  /** The offending CEP string, as supplied by the caller. */
  readonly cep: string;

  constructor(cep: string) {
    super(`Invalid CEP: "${cep}" is not a well-formed 8-digit CEP.`);
    this.name = "InvalidCepError";
    this.cep = cep;
    // Restore prototype chain (broken when extending Error under transpilation).
    Object.setPrototypeOf(this, InvalidCepError.prototype);
  }
}

/**
 * Thrown/returned when ViaCEP has no address for a well-formed CEP.
 * ViaCEP signals this with HTTP 200 and body `{ "erro": true }`.
 */
export class NotFoundError extends Error {
  readonly type = "not_found" as const;

  /** The well-formed CEP that yielded no address. */
  readonly cep: string;

  constructor(cep: string) {
    super(`No address found for CEP "${cep}".`);
    this.name = "NotFoundError";
    this.cep = cep;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Thrown/returned when the request fails or times out.
 */
export class NetworkError extends Error {
  readonly type = "network" as const;

  /** The underlying error that triggered this failure, when available. */
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "NetworkError";
    if (cause !== undefined) {
      this.cause = cause;
    }
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/** Union of every typed error the core can produce. */
export type ViaCepError = InvalidCepError | NotFoundError | NetworkError;

/** Type guard: narrows an unknown value to one of the ViaCEP error variants. */
export function isViaCepError(e: unknown): e is ViaCepError {
  return (
    e instanceof InvalidCepError ||
    e instanceof NotFoundError ||
    e instanceof NetworkError
  );
}

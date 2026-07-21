// Vanilla DOM adapter — binds the framework-agnostic mViaCEP core to a plain
// `<input>` element for CEP autofill. See issue #7.
//
// IMPORTANT: this module ships inside the CDN IIFE global bundle, so it MUST
// stay dependency-free — it may import ONLY from the core (relative import) and
// use standard DOM/browser APIs. No framework imports are allowed here.

import { lookup, normalize, isValid } from "../../core";
import type { Address } from "../../core";

/** Default debounce window, in milliseconds, applied between keystrokes. */
const DEFAULT_DEBOUNCE_MS = 400;

/** Options controlling how {@link bindCep} reacts to input on a CEP field. */
export interface BindCepOptions {
  /**
   * Called with the resolved {@link Address} whenever a complete, valid CEP is
   * looked up successfully. This is where consumers write values into the DOM.
   */
  onFill: (address: Address) => void;
  /**
   * Called with the (typed core) error when a lookup fails — an
   * `InvalidCepError`, `NotFoundError`, or `NetworkError`. Optional.
   */
  onError?: (error: unknown) => void;
  /**
   * Called right before an actual network lookup starts, once per lookup.
   * Useful for toggling a loading indicator. Optional.
   */
  onStart?: () => void;
  /** Debounce window between keystrokes, in ms. Defaults to ~400ms. */
  debounceMs?: number;
}

/**
 * Binds CEP autofill behavior to an `<input>` element.
 *
 * Behavior:
 * 1. Listens to the input's `input` event and debounces bursts of keystrokes.
 * 2. After the debounce settles, the value is normalized; the core `lookup` is
 *    only invoked once the CEP looks complete (8 digits / passes `isValid`).
 * 3. On success `onFill(address)` fires; on failure `onError(error)` fires with
 *    one of the core's typed errors.
 * 4. Stale in-flight results are ignored: if the input changes again (or the
 *    binding is disposed) before a lookup resolves, that result is dropped so a
 *    slow earlier request can never overwrite a newer one (race guard).
 *
 * @param input   The CEP text field to observe.
 * @param options See {@link BindCepOptions}.
 * @returns A dispose function that removes the listener and cancels any pending
 *          debounce timer and in-flight lookup.
 */
export function bindCep(
  input: HTMLInputElement,
  options: BindCepOptions,
): () => void {
  const { onFill, onError, onStart, debounceMs = DEFAULT_DEBOUNCE_MS } = options;

  let timer: ReturnType<typeof setTimeout> | undefined;
  // Monotonic id of the most recently started lookup; guards against races.
  let latestRequestId = 0;
  let disposed = false;

  function runLookup(): void {
    timer = undefined;
    if (disposed) return;

    const value = input.value;
    // Only reach the network once the CEP is complete and well-formed.
    if (!isValid(value)) return;

    const normalized = normalize(value);
    const requestId = ++latestRequestId;

    onStart?.();

    lookup(normalized).then(
      (address) => {
        // Drop the result if disposed or superseded by a newer lookup.
        if (disposed || requestId !== latestRequestId) return;
        onFill(address);
      },
      (error: unknown) => {
        if (disposed || requestId !== latestRequestId) return;
        onError?.(error);
      },
    );
  }

  function handleInput(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(runLookup, debounceMs);
  }

  input.addEventListener("input", handleInput);

  return function dispose(): void {
    disposed = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    // Invalidate any in-flight lookup so its result is ignored on resolution.
    latestRequestId++;
    input.removeEventListener("input", handleInput);
  };
}

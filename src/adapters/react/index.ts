// React adapter — the `useViaCep()` hook.
//
// A thin layer over the framework-agnostic core (see CLAUDE.md): it does NOT
// re-implement validation, caching, or error mapping — it calls `lookup` and
// translates the outcome into React state. `react` is an optional peer
// dependency, externalized by the build.

import { useCallback, useRef, useState, useEffect } from "react";
import { lookup } from "../../core";
import type { Address } from "../../core";

/** Shape returned by {@link useViaCep}. */
export interface UseViaCepResult {
  /**
   * Looks up an address by CEP through the core. Sets {@link loading} while the
   * request is in flight, then stores the resulting {@link Address} in
   * {@link address} or the thrown typed error in {@link error}. Only the most
   * recent call's outcome is applied (later calls win over earlier ones), and
   * no state is written after the component unmounts.
   */
  lookup: (cep: string) => Promise<void>;
  /** The last successfully resolved address, or `null`. */
  address: Address | null;
  /** `true` while a lookup is in flight. */
  loading: boolean;
  /** The typed error from the last failed lookup, or `null`. */
  error: unknown | null;
  /** Clears {@link address}, {@link error}, and {@link loading}. */
  reset: () => void;
}

/**
 * React hook wrapping the core CEP lookup.
 *
 * @example
 * ```tsx
 * function AddressForm() {
 *   const { lookup, address, loading, error, reset } = useViaCep();
 *   return (
 *     <div>
 *       <input onBlur={(e) => lookup(e.target.value)} />
 *       {loading && <span>Buscando…</span>}
 *       {error && <span>CEP não encontrado</span>}
 *       {address && <span>{address.localidade}/{address.uf}</span>}
 *       <button onClick={reset}>Limpar</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useViaCep(): UseViaCepResult {
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // Monotonically increasing id: only the latest lookup may write state.
  const latestCallId = useRef(0);
  // Guard against setting state after the component has unmounted.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const doLookup = useCallback(async (cep: string): Promise<void> => {
    const callId = ++latestCallId.current;

    if (mounted.current) {
      setLoading(true);
      setError(null);
    }

    const isStale = () => !mounted.current || callId !== latestCallId.current;

    try {
      const result = await lookup(cep);
      if (isStale()) return;
      setAddress(result);
      setError(null);
    } catch (err) {
      if (isStale()) return;
      setError(err);
      setAddress(null);
    } finally {
      // Only the latest, still-mounted call clears the loading flag, so a stale
      // response can never flip loading off under a newer in-flight request.
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback((): void => {
    // Invalidate any in-flight lookup so its late response is ignored.
    latestCallId.current++;
    setAddress(null);
    setError(null);
    setLoading(false);
  }, []);

  return { lookup: doLookup, address, loading, error, reset };
}

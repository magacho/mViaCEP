// Vue 3 adapter — `useViaCep()` composable.
//
// A thin, reactive wrapper over the framework-agnostic core `lookup`. It owns
// no validation, caching, or error-mapping logic of its own: it calls the core
// and translates the outcome into Vue refs, so behaviour stays single-sourced
// in `src/core/` (see CLAUDE.md).
//
// `vue` is an optional peer dependency, externalised by the build.

import { ref } from "vue";
import type { Ref } from "vue";
import { lookup as coreLookup } from "../../core";
import type { Address } from "../../core";

/** Reactive surface returned by {@link useViaCep}. */
export interface UseViaCep {
  /**
   * Looks up an address by CEP through the core, driving the reactive state:
   * toggles {@link UseViaCep.loading}, and on settlement stores the result in
   * {@link UseViaCep.address} or the thrown typed error in
   * {@link UseViaCep.error}.
   *
   * Latest-call-wins: if a newer `lookup` starts before an older one settles,
   * the older result is discarded and never touches the refs.
   */
  lookup: (cep: string) => Promise<void>;
  /** The last successfully resolved address, or `null`. */
  address: Ref<Address | null>;
  /** `true` while a lookup is in flight. */
  loading: Ref<boolean>;
  /** The typed error thrown by the last lookup, or `null`. */
  error: Ref<unknown | null>;
  /** Clears {@link address}, {@link loading}, and {@link error}. */
  reset: () => void;
}

/**
 * Vue 3 composable exposing a reactive CEP lookup backed by the mViaCEP core.
 *
 * Refs work outside of a component instance, so this may be called anywhere —
 * inside `setup()`, a store, or standalone.
 */
export function useViaCep(): UseViaCep {
  const address = ref<Address | null>(null);
  const loading = ref(false);
  const error = ref<unknown | null>(null);

  // Monotonic token identifying the most recent lookup. Any settled request
  // whose token is stale is ignored (latest-call-wins).
  let latestCall = 0;

  async function lookup(cep: string): Promise<void> {
    const callId = ++latestCall;

    loading.value = true;
    error.value = null;

    try {
      const result = await coreLookup(cep);
      if (callId !== latestCall) return;
      address.value = result;
    } catch (err) {
      if (callId !== latestCall) return;
      error.value = err;
    } finally {
      if (callId === latestCall) {
        loading.value = false;
      }
    }
  }

  function reset(): void {
    // Invalidate any in-flight lookup so it cannot write back after a reset.
    latestCall++;
    address.value = null;
    loading.value = false;
    error.value = null;
  }

  return { lookup, address, loading, error, reset };
}

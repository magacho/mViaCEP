// Angular adapter — a thin, injectable service over the framework-agnostic core.
//
// Per CLAUDE.md, adapters must not re-implement validation, caching, or error
// mapping; they only translate the core's results into framework idioms. Here
// that idiom is RxJS: the core's `Promise`-based `lookup`/`search` are wrapped
// with `from(...)` so consumers get an `Observable` that fits naturally into
// Angular's reactive patterns (`async` pipe, `switchMap`, etc.).
//
// `@angular/core` and `rxjs` are optional peerDependencies and are externalized
// by the build — they are never bundled into the core.
//
// Design note: the service takes NO constructor dependencies. It delegates to
// the core module functions directly, which keeps it trivially instantiable
// with `new ViaCepService()` and unit-testable without Angular's TestBed or
// zone.js bootstrapping.

import { Injectable } from "@angular/core";
import { from, type Observable } from "rxjs";
import { lookup, search } from "../../core";
import type { LookupOptions } from "../../core/client";
import type { SearchOptions } from "../../core/search";
import type { Address } from "../../core/types";

/**
 * Injectable Angular service that exposes ViaCEP lookups as RxJS Observables.
 *
 * Registered as a root-level singleton via `providedIn: "root"`, so consumers
 * simply inject it:
 *
 * ```ts
 * @Component({ ... })
 * export class AddressFormComponent {
 *   private readonly viaCep = inject(ViaCepService);
 *
 *   fill(cep: string) {
 *     this.viaCep.lookup(cep).subscribe({
 *       next: (address) => this.form.patchValue(address),
 *       error: (err) => this.handle(err), // typed core errors
 *     });
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: "root" })
export class ViaCepService {
  /**
   * Looks up an address by CEP.
   *
   * Wraps the core {@link lookup} Promise with RxJS `from(...)`. The Observable
   * emits the mapped {@link Address} then completes, or errors with one of the
   * core's typed errors (`InvalidCepError`, `NotFoundError`, `NetworkError`).
   */
  lookup(cep: string, options?: LookupOptions): Observable<Address> {
    return from(lookup(cep, options));
  }

  /**
   * Reverse-searches addresses by UF, city, and street.
   *
   * Wraps the core {@link search} Promise with RxJS `from(...)`. The Observable
   * emits an {@link Address} array (possibly empty) then completes, or errors
   * with `InvalidCepError`/`NetworkError`.
   */
  search(
    uf: string,
    cidade: string,
    logradouro: string,
    options?: SearchOptions,
  ): Observable<Address[]> {
    return from(search(uf, cidade, logradouro, options));
  }

  /**
   * Promise-returning variant of {@link lookup}, for consumers that prefer
   * `async`/`await` over Observables. Delegates straight to the core.
   */
  lookupAsync(cep: string, options?: LookupOptions): Promise<Address> {
    return lookup(cep, options);
  }

  /**
   * Promise-returning variant of {@link search}. Delegates straight to the core.
   */
  searchAsync(
    uf: string,
    cidade: string,
    logradouro: string,
    options?: SearchOptions,
  ): Promise<Address[]> {
    return search(uf, cidade, logradouro, options);
  }
}

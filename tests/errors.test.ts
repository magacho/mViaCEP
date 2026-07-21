import { describe, expect, it } from "vitest";
import {
  InvalidCepError,
  NetworkError,
  NotFoundError,
  isViaCepError,
} from "../src/core/errors";

describe("InvalidCepError", () => {
  const err = new InvalidCepError("123");

  it("is an instance of Error and InvalidCepError", () => {
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(InvalidCepError);
  });

  it("has the correct type discriminant", () => {
    expect(err.type).toBe("invalid_cep");
  });

  it("has the correct name", () => {
    expect(err.name).toBe("InvalidCepError");
  });

  it("retains the offending cep and a message mentioning it", () => {
    expect(err.cep).toBe("123");
    expect(err.message).toContain("123");
  });

  it("is not confused with the other error classes", () => {
    expect(err).not.toBeInstanceOf(NotFoundError);
    expect(err).not.toBeInstanceOf(NetworkError);
  });
});

describe("NotFoundError", () => {
  const err = new NotFoundError("01001000");

  it("is an instance of Error and NotFoundError", () => {
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it("has the correct type discriminant", () => {
    expect(err.type).toBe("not_found");
  });

  it("has the correct name", () => {
    expect(err.name).toBe("NotFoundError");
  });

  it("retains the cep and a message mentioning it", () => {
    expect(err.cep).toBe("01001000");
    expect(err.message).toContain("01001000");
  });

  it("is not confused with the other error classes", () => {
    expect(err).not.toBeInstanceOf(InvalidCepError);
    expect(err).not.toBeInstanceOf(NetworkError);
  });
});

describe("NetworkError", () => {
  const cause = new Error("socket hang up");
  const err = new NetworkError("request timed out", cause);

  it("is an instance of Error and NetworkError", () => {
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NetworkError);
  });

  it("has the correct type discriminant", () => {
    expect(err.type).toBe("network");
  });

  it("has the correct name", () => {
    expect(err.name).toBe("NetworkError");
  });

  it("sets the message and cause", () => {
    expect(err.message).toBe("request timed out");
    expect(err.cause).toBe(cause);
  });

  it("works without a cause", () => {
    const bare = new NetworkError("boom");
    expect(bare.message).toBe("boom");
    expect(bare.cause).toBeUndefined();
  });

  it("is not confused with the other error classes", () => {
    expect(err).not.toBeInstanceOf(InvalidCepError);
    expect(err).not.toBeInstanceOf(NotFoundError);
  });
});

describe("isViaCepError", () => {
  it("returns true for all three ViaCEP error variants", () => {
    expect(isViaCepError(new InvalidCepError("1"))).toBe(true);
    expect(isViaCepError(new NotFoundError("01001000"))).toBe(true);
    expect(isViaCepError(new NetworkError("boom"))).toBe(true);
  });

  it("returns false for a plain Error", () => {
    expect(isViaCepError(new Error("nope"))).toBe(false);
  });

  it("returns false for null and non-error values", () => {
    expect(isViaCepError(null)).toBe(false);
    expect(isViaCepError(undefined)).toBe(false);
    expect(isViaCepError("invalid_cep")).toBe(false);
    expect(isViaCepError({ type: "network" })).toBe(false);
  });

  it("narrows the type so the discriminant is accessible", () => {
    const e: unknown = new NotFoundError("01001000");
    if (isViaCepError(e)) {
      expect(e.type).toBe("not_found");
    } else {
      throw new Error("expected isViaCepError to narrow");
    }
  });
});

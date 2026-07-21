import { describe, it, expect } from "vitest";
import { normalize, isValid, mask } from "../src/core/cep";

describe("normalize", () => {
  it("strips non-digit characters from an already-masked CEP", () => {
    expect(normalize("01001-000")).toBe("01001000");
  });

  it("trims surrounding spaces and keeps only digits", () => {
    expect(normalize("  01001-000  ")).toBe("01001000");
  });

  it("returns only the digits from a plain 8-digit CEP", () => {
    expect(normalize("01001000")).toBe("01001000");
  });

  it("removes letters and symbols", () => {
    expect(normalize("cep: 01001-000!")).toBe("01001000");
  });

  it("returns an empty string when there are no digits", () => {
    expect(normalize("abc")).toBe("");
    expect(normalize("")).toBe("");
  });

  it("does not enforce length (returns whatever digits exist)", () => {
    expect(normalize("123")).toBe("123");
    expect(normalize("0100100099")).toBe("0100100099");
  });
});

describe("isValid", () => {
  it("accepts a valid plain 8-digit CEP", () => {
    expect(isValid("01001000")).toBe(true);
  });

  it("accepts an already-masked CEP", () => {
    expect(isValid("01001-000")).toBe(true);
  });

  it("accepts a CEP with surrounding spaces", () => {
    expect(isValid("  01001-000  ")).toBe(true);
  });

  it("rejects a too-short CEP", () => {
    expect(isValid("0100100")).toBe(false);
  });

  it("rejects a too-long CEP", () => {
    expect(isValid("010010000")).toBe(false);
  });

  it("rejects a non-numeric / letters input", () => {
    expect(isValid("abcdefgh")).toBe(false);
    expect(isValid("0100100a")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValid("")).toBe(false);
  });
});

describe("mask", () => {
  it("formats a valid 8-digit CEP as 00000-000", () => {
    expect(mask("01001000")).toBe("01001-000");
  });

  it("keeps an already-masked CEP formatted", () => {
    expect(mask("01001-000")).toBe("01001-000");
  });

  it("formats a CEP with surrounding spaces", () => {
    expect(mask("  01001000  ")).toBe("01001-000");
  });

  it("returns a partial mask for a too-short CEP (<= 5 digits, no hyphen)", () => {
    expect(mask("010")).toBe("010");
    expect(mask("01001")).toBe("01001");
  });

  it("returns a partial mask for 6-7 digits (hyphen after 5th digit)", () => {
    expect(mask("010010")).toBe("01001-0");
    expect(mask("0100100")).toBe("01001-00");
  });

  it("truncates extra digits for a too-long CEP", () => {
    expect(mask("010010000")).toBe("01001-000");
  });

  it("strips letters before masking and never throws", () => {
    expect(mask("cep 01001000")).toBe("01001-000");
  });

  it("returns an empty string for an empty input", () => {
    expect(mask("")).toBe("");
    expect(mask("abc")).toBe("");
  });
});

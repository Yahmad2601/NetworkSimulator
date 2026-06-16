import { describe, it, expect } from "vitest";
import { tlsMessages, roundTrips, firstEncryptedIndex } from "./tls";

describe("tlsMessages — common structure", () => {
  for (const version of ["1.3", "1.2"] as const) {
    it(`TLS ${version} starts with ClientHello (c→s) then ServerHello (s→c), both plaintext`, () => {
      const m = tlsMessages(version);
      expect(m[0].name).toBe("ClientHello");
      expect(m[0].direction).toBe("client-to-server");
      expect(m[0].encrypted).toBe(false);
      expect(m[1].name).toBe("ServerHello");
      expect(m[1].direction).toBe("server-to-client");
      expect(m[1].encrypted).toBe(false);
    });

    it(`TLS ${version} ends with encrypted Application Data`, () => {
      const m = tlsMessages(version);
      const last = m[m.length - 1];
      expect(last.name).toBe("Application Data");
      expect(last.encrypted).toBe(true);
    });
  }
});

describe("TLS 1.3 specifics", () => {
  const m = tlsMessages("1.3");

  it("carries the client key_share in the ClientHello (enables 1-RTT)", () => {
    expect(m[0].fields.some((f) => f.toLowerCase().includes("key_share"))).toBe(true);
  });

  it("encrypts everything after the two Hellos", () => {
    expect(m[1].encrypted).toBe(false); // ServerHello
    expect(m.slice(2).every((msg) => msg.encrypted)).toBe(true);
  });

  it("encrypts the Certificate (the key contrast with 1.2)", () => {
    const cert = m.find((msg) => msg.name === "Certificate");
    expect(cert?.encrypted).toBe(true);
  });

  it("completes in 1 round trip", () => {
    expect(roundTrips("1.3")).toBe(1);
  });
});

describe("TLS 1.2 specifics", () => {
  const m = tlsMessages("1.2");

  it("sends the Certificate in the clear", () => {
    const cert = m.find((msg) => msg.name === "Certificate");
    expect(cert?.encrypted).toBe(false);
  });

  it("needs 2 round trips", () => {
    expect(roundTrips("1.2")).toBe(2);
  });
});

describe("firstEncryptedIndex (plaintext → encrypted boundary)", () => {
  it("is right after the two Hellos in TLS 1.3", () => {
    const m = tlsMessages("1.3");
    expect(firstEncryptedIndex(m)).toBe(2);
    expect(m[2].name).toBe("EncryptedExtensions");
  });

  it("is at the client Finished in TLS 1.2", () => {
    const m = tlsMessages("1.2");
    const idx = firstEncryptedIndex(m);
    expect(m[idx].name).toBe("Finished (client)");
  });
});

import { describe, it, expect } from "vitest";
import {
  isValidIPv6,
  expandIPv6,
  compressIPv6,
  classifyIPv6,
  parseMac,
  eui64,
  slaacAddress,
} from "./ipv6";

describe("isValidIPv6", () => {
  it("accepts valid forms", () => {
    expect(isValidIPv6("::1")).toBe(true);
    expect(isValidIPv6("::")).toBe(true);
    expect(isValidIPv6("2001:db8::ff00:42:8329")).toBe(true);
    expect(isValidIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
  });

  it("rejects invalid forms", () => {
    expect(isValidIPv6("2001:db8:::1")).toBe(false); // triple colon
    expect(isValidIPv6("gggg::1")).toBe(false); // non-hex
    expect(isValidIPv6("1:2:3:4:5:6:7:8:9")).toBe(false); // too many groups
    expect(isValidIPv6("12345::")).toBe(false); // group too long
    expect(isValidIPv6("1:2:3:4:5:6:7:8::")).toBe(false); // :: covers no group
    expect(isValidIPv6("")).toBe(false);
  });
});

describe("expandIPv6", () => {
  it("expands the canonical example", () => {
    expect(expandIPv6("2001:db8::ff00:42:8329")).toBe(
      "2001:0db8:0000:0000:0000:ff00:0042:8329",
    );
  });
  it("expands :: forms", () => {
    expect(expandIPv6("::1")).toBe("0000:0000:0000:0000:0000:0000:0000:0001");
    expect(expandIPv6("::")).toBe("0000:0000:0000:0000:0000:0000:0000:0000");
    expect(expandIPv6("fe80::1")).toBe("fe80:0000:0000:0000:0000:0000:0000:0001");
  });
});

describe("compressIPv6", () => {
  it("compresses to RFC 5952 canonical form", () => {
    expect(compressIPv6("2001:0db8:0000:0000:0000:ff00:0042:8329")).toBe("2001:db8::ff00:42:8329");
    expect(compressIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:db8:85a3::8a2e:370:7334");
    expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0001")).toBe("::1");
    expect(compressIPv6("0000:0000:0000:0000:0000:0000:0000:0000")).toBe("::");
  });

  it("does NOT collapse a single zero group (RFC 5952)", () => {
    // groups 3 is a lone zero — must stay as 0, not ::
    expect(compressIPv6("2001:0db8:0001:0000:0001:0001:0001:0001")).toBe("2001:db8:1:0:1:1:1:1");
  });

  it("round-trips with expand", () => {
    const a = "fe80::1c2b:3aff:fe4d:5e6f";
    expect(compressIPv6(expandIPv6(a))).toBe(a);
  });
});

describe("classifyIPv6", () => {
  it("identifies each address type by prefix", () => {
    expect(classifyIPv6("2001:db8::1").type).toBe("Global Unicast");
    expect(classifyIPv6("fe80::1").type).toBe("Link-Local");
    expect(classifyIPv6("ff02::1").type).toBe("Multicast");
    expect(classifyIPv6("fc00::1").type).toBe("Unique Local");
    expect(classifyIPv6("fd12:3456::1").type).toBe("Unique Local");
    expect(classifyIPv6("::1").type).toBe("Loopback");
    expect(classifyIPv6("::").type).toBe("Unspecified");
  });
});

describe("EUI-64 / SLAAC", () => {
  it("parses and rejects MACs", () => {
    expect(parseMac("00:1a:2b:3c:4d:5e")).toEqual([0, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e]);
    expect(parseMac("00-1a-2b-3c-4d-5e")).toEqual([0, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e]);
    expect(parseMac("00:1a:2b:3c:4d")).toBeNull();
    expect(parseMac("zz:1a:2b:3c:4d:5e")).toBeNull();
  });

  it("derives the interface ID (insert FFFE, flip U/L bit)", () => {
    // 00 → 02 (U/L flip); FFFE inserted in the middle.
    expect(eui64("00:1A:2B:3C:4D:5E")).toBe("021a:2bff:fe3c:4d5e");
  });

  it("builds a full SLAAC address from prefix + MAC", () => {
    expect(slaacAddress("2001:db8::/64", "00:1A:2B:3C:4D:5E")).toBe(
      "2001:db8::21a:2bff:fe3c:4d5e",
    );
  });
});

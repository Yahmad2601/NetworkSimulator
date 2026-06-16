import { describe, it, expect } from "vitest";
import { ipToNumber, numberToIp, getIpClass, isValidIp, computeSubnet } from "./ip";

describe("ipToNumber / numberToIp", () => {
  it("round-trips common addresses", () => {
    for (const ip of ["0.0.0.0", "192.168.1.1", "10.0.0.1", "255.255.255.255"]) {
      expect(numberToIp(ipToNumber(ip))).toBe(ip);
    }
  });

  it("treats the result as unsigned 32-bit", () => {
    // 255.255.255.255 would be -1 under signed arithmetic.
    expect(ipToNumber("255.255.255.255")).toBe(4294967295);
  });
});

describe("getIpClass", () => {
  it("classifies by first octet", () => {
    expect(getIpClass("10.0.0.1")).toBe("Class A");
    expect(getIpClass("128.0.0.1")).toBe("Class B");
    expect(getIpClass("192.168.1.1")).toBe("Class C");
    expect(getIpClass("224.0.0.1")).toBe("Class D (Multicast)");
    expect(getIpClass("240.0.0.1")).toBe("Class E (Experimental)");
  });

  it("returns Unknown for the 127 loopback gap", () => {
    expect(getIpClass("127.0.0.1")).toBe("Unknown");
  });
});

describe("isValidIp", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidIp("0.0.0.0")).toBe(true);
    expect(isValidIp("255.255.255.255")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidIp("256.0.0.1")).toBe(false); // octet out of range
    expect(isValidIp("1.2.3")).toBe(false); // too few octets
    expect(isValidIp("1.2.3.4.5")).toBe(false); // too many octets
    expect(isValidIp("01.2.3.4")).toBe(false); // leading zero
    expect(isValidIp("1.2.3.+4")).toBe(false); // sign prefix
    expect(isValidIp("1.2.3.a")).toBe(false); // non-numeric
    expect(isValidIp("")).toBe(false);
  });
});

describe("computeSubnet", () => {
  it("computes a /24 network", () => {
    const s = computeSubnet("192.168.1.50", 24);
    expect(numberToIp(s.maskNum)).toBe("255.255.255.0");
    expect(numberToIp(s.wildcardNum)).toBe("0.0.0.255");
    expect(numberToIp(s.networkNum)).toBe("192.168.1.0");
    expect(numberToIp(s.broadcastNum)).toBe("192.168.1.255");
    expect(numberToIp(s.firstUsableNum)).toBe("192.168.1.1");
    expect(numberToIp(s.lastUsableNum)).toBe("192.168.1.254");
    expect(s.totalHosts).toBe(254);
  });

  it("handles /0 (entire address space)", () => {
    const s = computeSubnet("192.168.1.1", 0);
    expect(s.maskNum).toBe(0);
    expect(numberToIp(s.networkNum)).toBe("0.0.0.0");
    expect(numberToIp(s.broadcastNum)).toBe("255.255.255.255");
    expect(s.totalHosts).toBe(Math.pow(2, 32) - 2);
  });

  it("handles /31 point-to-point links (2 usable hosts, no broadcast carve-out)", () => {
    const s = computeSubnet("192.168.1.0", 31);
    expect(s.totalHosts).toBe(2);
    expect(numberToIp(s.firstUsableNum)).toBe("192.168.1.0");
    expect(numberToIp(s.lastUsableNum)).toBe("192.168.1.1");
  });

  it("handles /32 single host", () => {
    const s = computeSubnet("192.168.1.7", 32);
    expect(s.totalHosts).toBe(1);
    expect(numberToIp(s.networkNum)).toBe("192.168.1.7");
    expect(numberToIp(s.firstUsableNum)).toBe("192.168.1.7");
    expect(numberToIp(s.lastUsableNum)).toBe("192.168.1.7");
  });

  it("derives the classful default prefix by first octet", () => {
    // Class A → /8: borrowing 16 bits to reach /24 yields 2^16 subnets.
    expect(computeSubnet("10.0.0.0", 24).defaultCidr).toBe(8);
    expect(computeSubnet("10.0.0.0", 24).totalSubnets).toBe(Math.pow(2, 16));
    // Any Class A address, not just 10.x (the old string hack got this wrong).
    expect(computeSubnet("100.64.0.0", 16).defaultCidr).toBe(8);
    // Class B → /16, not only 172.x.
    expect(computeSubnet("150.10.0.0", 24).defaultCidr).toBe(16);
    expect(computeSubnet("172.16.0.0", 16).defaultCidr).toBe(16);
    // Class C → /24.
    expect(computeSubnet("192.168.1.0", 24).defaultCidr).toBe(24);
    expect(computeSubnet("192.168.1.0", 24).borrowedBits).toBe(0);
    expect(computeSubnet("192.168.1.0", 24).totalSubnets).toBe(1);
  });

  it("produces a 32-bit binary string", () => {
    expect(computeSubnet("0.0.0.0", 24).binaryString).toBe("0".repeat(32));
    expect(computeSubnet("255.255.255.255", 24).binaryString).toBe("1".repeat(32));
  });
});

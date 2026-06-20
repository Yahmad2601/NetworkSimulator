import { describe, it, expect } from "vitest";
import { scanPort, runScan, DEFAULT_PORTS, type TargetPort } from "./portscan";

const OPEN: TargetPort = { port: 80, service: "HTTP", open: true };
const CLOSED: TargetPort = { port: 3306, service: "MySQL", open: false };

describe("TCP SYN / connect scan", () => {
  it("open → SYN-ACK → open", () => {
    expect(scanPort(OPEN, "syn", false).state).toBe("open");
    expect(scanPort(OPEN, "syn", false).response).toBe("SYN-ACK");
  });
  it("closed → RST → closed", () => {
    const r = scanPort(CLOSED, "syn", false);
    expect(r.state).toBe("closed");
    expect(r.response).toBe("RST");
  });
});

describe("stealth NULL / Xmas scan (RFC 793)", () => {
  it("open → no response → open|filtered", () => {
    expect(scanPort(OPEN, "null", false).state).toBe("open|filtered");
    expect(scanPort(OPEN, "xmas", false).state).toBe("open|filtered");
  });
  it("closed → RST → closed", () => {
    expect(scanPort(CLOSED, "xmas", false).state).toBe("closed");
  });
});

describe("UDP scan", () => {
  it("closed → ICMP Port Unreachable → closed", () => {
    const r = scanPort(CLOSED, "udp", false);
    expect(r.state).toBe("closed");
    expect(r.response).toBe("ICMP Port Unreachable");
  });
  it("open → no response → open|filtered", () => {
    expect(scanPort(OPEN, "udp", false).state).toBe("open|filtered");
  });
});

describe("firewall", () => {
  it("turns a closed port into filtered (silent drop)", () => {
    const r = scanPort(CLOSED, "syn", true);
    expect(r.state).toBe("filtered");
    expect(r.response).toContain("no response");
  });
  it("leaves open ports reachable", () => {
    expect(scanPort(OPEN, "syn", true).state).toBe("open");
  });
  it("hides every closed port behind the firewall", () => {
    const results = runScan(DEFAULT_PORTS, "syn", true);
    expect(results.filter((r) => r.state === "closed")).toHaveLength(0);
    expect(results.filter((r) => r.state === "open")).toHaveLength(3);
    expect(results.filter((r) => r.state === "filtered")).toHaveLength(3);
  });
});

import { describe, it, expect } from "vitest";
import { probe, runTraceroute, DEFAULT_PATH, type TraceNode } from "./traceroute";

const PATH: TraceNode[] = [
  { ip: "192.168.1.1", name: "R1" },
  { ip: "10.0.0.1", name: "R2" },
  { ip: "100.64.0.1", name: "R3", filtered: true },
  { ip: "203.0.113.1", name: "R4" },
  { ip: "93.184.216.34", name: "dest" },
];

describe("probe", () => {
  it("returns Time Exceeded from the hop matching the TTL", () => {
    const r = probe(PATH, 1, "icmp");
    expect(r.responseType).toBe("time-exceeded");
    expect(r.ip).toBe("192.168.1.1");
    expect(r.isDestination).toBe(false);

    expect(probe(PATH, 2, "icmp").ip).toBe("10.0.0.1");
  });

  it("shows a filtered hop as no-response (the `*`)", () => {
    const r = probe(PATH, 3, "icmp");
    expect(r.responseType).toBe("no-response");
    expect(r.ip).toBeNull();
    expect(r.isDestination).toBe(false);
  });

  it("returns Echo Reply at the destination in ICMP/Windows mode", () => {
    const r = probe(PATH, PATH.length, "icmp");
    expect(r.responseType).toBe("echo-reply");
    expect(r.isDestination).toBe(true);
    expect(r.ip).toBe("93.184.216.34");
  });

  it("returns Port Unreachable at the destination in UDP/Linux mode", () => {
    const r = probe(PATH, PATH.length, "udp");
    expect(r.responseType).toBe("port-unreachable");
    expect(r.isDestination).toBe(true);
  });
});

describe("runTraceroute", () => {
  it("walks every hop and stops at the destination", () => {
    const results = runTraceroute(PATH, "icmp");
    expect(results).toHaveLength(PATH.length);
    expect(results[results.length - 1].isDestination).toBe(true);
    expect(results.map((r) => r.responseType)).toEqual([
      "time-exceeded",
      "time-exceeded",
      "no-response",
      "time-exceeded",
      "echo-reply",
    ]);
  });

  it("ships a sensible default path ending at the destination", () => {
    const results = runTraceroute(DEFAULT_PATH, "icmp");
    expect(results[results.length - 1].isDestination).toBe(true);
  });
});

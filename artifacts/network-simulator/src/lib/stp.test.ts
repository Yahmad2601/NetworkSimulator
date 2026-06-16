import { describe, it, expect } from "vitest";
import {
  electRoot,
  rootPathCosts,
  computeStp,
  STP_COST,
  DEFAULT_SWITCHES,
  DEFAULT_LINKS,
  type StpPort,
} from "./stp";

const blockingPorts = (ports: StpPort[]) => ports.filter((p) => p.role === "blocking");
const portOf = (ports: StpPort[], sw: string, link: string) =>
  ports.find((p) => p.switchId === sw && p.linkId === link);

describe("STP path costs", () => {
  it("uses the IEEE 802.1D values", () => {
    expect(STP_COST["10G"]).toBe(2);
    expect(STP_COST["1G"]).toBe(4);
    expect(STP_COST["100M"]).toBe(19);
    expect(STP_COST["10M"]).toBe(100);
  });
});

describe("electRoot", () => {
  it("picks the lowest priority", () => {
    expect(electRoot(DEFAULT_SWITCHES).id).toBe("S1");
  });

  it("breaks ties on the lowest MAC", () => {
    const tied = [
      { id: "A", priority: 32768, mac: "00:00:00:00:00:02" },
      { id: "B", priority: 32768, mac: "00:00:00:00:00:01" },
    ];
    expect(electRoot(tied).id).toBe("B");
  });
});

describe("rootPathCosts", () => {
  it("computes least-cost paths to the root on the triangle", () => {
    const rpc = rootPathCosts(DEFAULT_SWITCHES, DEFAULT_LINKS, "S1");
    expect(rpc).toEqual({ S1: 0, S2: 4, S3: 4 });
  });
});

describe("computeStp on the triangle", () => {
  const r = computeStp(DEFAULT_SWITCHES, DEFAULT_LINKS);

  it("elects S1 as root", () => {
    expect(r.rootId).toBe("S1");
  });

  it("gives each non-root switch a root port over its 1G link", () => {
    expect(portOf(r.ports, "S2", "L12")?.role).toBe("root");
    expect(portOf(r.ports, "S3", "L13")?.role).toBe("root");
  });

  it("blocks exactly one port to break the loop (S3 on the S2–S3 link)", () => {
    const blocked = blockingPorts(r.ports);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].switchId).toBe("S3");
    expect(blocked[0].linkId).toBe("L23");
  });

  it("makes all of the root bridge's ports designated", () => {
    expect(portOf(r.ports, "S1", "L12")?.role).toBe("designated");
    expect(portOf(r.ports, "S1", "L13")?.role).toBe("designated");
  });
});

describe("link failure recovery", () => {
  it("reactivates the blocked port when S3's root link fails", () => {
    // Remove L13 (S3's root port); S3 must now reach root via S2.
    const links = DEFAULT_LINKS.filter((l) => l.id !== "L13");
    const r = computeStp(DEFAULT_SWITCHES, links);
    expect(blockingPorts(r.ports)).toHaveLength(0); // loop gone → nothing blocks
    expect(portOf(r.ports, "S3", "L23")?.role).toBe("root");
    expect(r.rpc.S3).toBe(4 + 19); // via S2
  });
});

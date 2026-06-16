import { describe, it, expect } from "vitest";
import {
  doraMessages,
  clientPhaseForStep,
  leaseTimers,
  phaseForLeaseProgress,
  DEFAULT_DHCP_CONFIG,
  CLIENT_PORT,
  SERVER_PORT,
} from "./dhcp";

describe("doraMessages", () => {
  const msgs = doraMessages();

  it("returns the four messages in DORA order", () => {
    expect(msgs.map((m) => m.type)).toEqual(["DISCOVER", "OFFER", "REQUEST", "ACK"]);
  });

  it("broadcasts Discover and Request, unicasts Offer and Ack", () => {
    expect(msgs[0].broadcast).toBe(true); // Discover
    expect(msgs[1].broadcast).toBe(false); // Offer
    expect(msgs[2].broadcast).toBe(true); // Request
    expect(msgs[3].broadcast).toBe(false); // Ack
  });

  it("sends client messages from 0.0.0.0 to the broadcast address", () => {
    for (const m of [msgs[0], msgs[2]]) {
      expect(m.direction).toBe("client-to-server");
      expect(m.srcIp).toBe("0.0.0.0");
      expect(m.dstIp).toBe("255.255.255.255");
      expect(m.srcPort).toBe(CLIENT_PORT);
      expect(m.dstPort).toBe(SERVER_PORT);
    }
  });

  it("sends server messages from the server with ports reversed", () => {
    for (const m of [msgs[1], msgs[3]]) {
      expect(m.direction).toBe("server-to-client");
      expect(m.srcIp).toBe(DEFAULT_DHCP_CONFIG.serverIp);
      expect(m.srcPort).toBe(SERVER_PORT);
      expect(m.dstPort).toBe(CLIENT_PORT);
    }
  });

  it("includes the Server Identifier in the Request (the key aha)", () => {
    const request = msgs[2];
    const serverId = request.fields.find((f) => f.label === "Server Identifier");
    expect(serverId?.value).toBe(DEFAULT_DHCP_CONFIG.serverIdentifier);
  });
});

describe("clientPhaseForStep", () => {
  it("maps each step to the correct DORA phase", () => {
    expect(clientPhaseForStep(0)).toBe("INIT");
    expect(clientPhaseForStep(1)).toBe("SELECTING");
    expect(clientPhaseForStep(2)).toBe("SELECTING");
    expect(clientPhaseForStep(3)).toBe("REQUESTING");
    expect(clientPhaseForStep(4)).toBe("BOUND");
  });
});

describe("leaseTimers", () => {
  it("computes T1 at 50% and T2 at 87.5% of the lease", () => {
    expect(leaseTimers(3600)).toEqual({ t1: 1800, t2: 3150 });
  });
});

describe("phaseForLeaseProgress", () => {
  it("transitions BOUND → RENEWING → REBINDING → EXPIRED at the right thresholds", () => {
    expect(phaseForLeaseProgress(0)).toBe("BOUND");
    expect(phaseForLeaseProgress(0.49)).toBe("BOUND");
    expect(phaseForLeaseProgress(0.5)).toBe("RENEWING");
    expect(phaseForLeaseProgress(0.87)).toBe("RENEWING");
    expect(phaseForLeaseProgress(0.875)).toBe("REBINDING");
    expect(phaseForLeaseProgress(0.99)).toBe("REBINDING");
    expect(phaseForLeaseProgress(1)).toBe("EXPIRED");
  });
});

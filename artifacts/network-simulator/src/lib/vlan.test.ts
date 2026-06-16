import { describe, it, expect } from "vitest";
import {
  buildTag,
  tci,
  tagBytes,
  broadcastRecipients,
  isTaggedOnTrunk,
  isValidVid,
  type VlanHost,
} from "./vlan";

const HOSTS: VlanHost[] = [
  { id: "A", name: "PC-A", vlan: 10, switchId: "SW1" },
  { id: "B", name: "PC-B", vlan: 20, switchId: "SW1" },
  { id: "C", name: "PC-C", vlan: 10, switchId: "SW2" },
  { id: "D", name: "PC-D", vlan: 20, switchId: "SW2" },
];

describe("802.1Q tag", () => {
  it("uses TPID 0x8100 and encodes the VID in the low bytes", () => {
    expect(tagBytes(buildTag(10))).toEqual(["81", "00", "00", "0a"]);
    expect(tagBytes(buildTag(20))).toEqual(["81", "00", "00", "14"]);
  });

  it("packs PCP, DEI and VID into the 16-bit TCI", () => {
    expect(tci(buildTag(10, 3, 0))).toBe(0x600a);
    expect(tagBytes(buildTag(10, 3, 0))).toEqual(["81", "00", "60", "0a"]);
    expect(tci(buildTag(1, 0, 1))).toBe(0x1001);
  });
});

describe("broadcastRecipients", () => {
  it("reaches only same-VLAN hosts, across switches", () => {
    expect(broadcastRecipients(HOSTS, "A").sort()).toEqual(["C"]); // VLAN 10
    expect(broadcastRecipients(HOSTS, "B").sort()).toEqual(["D"]); // VLAN 20
  });

  it("never crosses VLAN boundaries", () => {
    expect(broadcastRecipients(HOSTS, "A")).not.toContain("B");
    expect(broadcastRecipients(HOSTS, "A")).not.toContain("D");
  });
});

describe("trunk tagging", () => {
  it("tags non-native VLANs and leaves the native VLAN untagged", () => {
    expect(isTaggedOnTrunk(10, 1)).toBe(true);
    expect(isTaggedOnTrunk(20, 1)).toBe(true);
    expect(isTaggedOnTrunk(1, 1)).toBe(false);
  });
});

describe("isValidVid", () => {
  it("accepts 1–4094 and rejects the reserved values", () => {
    expect(isValidVid(1)).toBe(true);
    expect(isValidVid(4094)).toBe(true);
    expect(isValidVid(0)).toBe(false);
    expect(isValidVid(4095)).toBe(false);
  });
});

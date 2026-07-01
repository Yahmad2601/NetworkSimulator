import { describe, it, expect } from "vitest";
import {
  CODEBOOK,
  SAMPLE_PROGRAM,
  createCpu,
  decode,
  parseBinary,
  pressClock,
  sampleProgramCycles,
  toBinary8,
  toBinary16,
  type CpuState,
} from "./cpu";

/** Feed the CPU one CLK pulse per call until the current instruction finishes. */
function runLine(state: CpuState, pattern: string): CpuState {
  let s = pressClock(state, pattern);
  // Grind through internal work cycles — the bus contents shouldn't matter here.
  while (s.phase === "working") s = pressClock(s, "11111111");
  return s;
}

describe("codebook", () => {
  it("has four commands with unique 8-bit opcodes", () => {
    expect(CODEBOOK).toHaveLength(4);
    const opcodes = CODEBOOK.map((i) => i.opcode);
    expect(new Set(opcodes).size).toBe(4);
    for (const op of opcodes) expect(op).toMatch(/^[01]{8}$/);
  });

  it("every command needs at least two clock cycles", () => {
    for (const instr of CODEBOOK) expect(instr.cycles).toBeGreaterThanOrEqual(2);
  });

  it("decode finds commands and rejects data patterns", () => {
    expect(decode("10110000")?.mnemonic).toBe("ADD AX, BX");
    expect(decode("00000101")).toBeUndefined();
  });
});

describe("binary helpers", () => {
  it("toBinary8 round-trips with parseBinary", () => {
    for (const n of [0, 1, 5, 127, 255]) {
      expect(parseBinary(toBinary8(n))).toBe(n);
    }
  });

  it("toBinary8 keeps only the low byte — the bus is 8 wires", () => {
    expect(toBinary8(260)).toBe("00000100");
  });

  it("toBinary16 shows the full worktable", () => {
    expect(toBinary16(5)).toBe("0000000000000101");
    expect(toBinary16(0xffff)).toBe("1111111111111111");
  });

  it("parseBinary rejects anything that isn't eight 0/1 lights", () => {
    expect(parseBinary("0000010")).toBeNull();
    expect(parseBinary("000001010")).toBeNull();
    expect(parseBinary("0000010a")).toBeNull();
  });
});

describe("MOV — fetch then operand", () => {
  it("reads the opcode on pulse 1 and the number on pulse 2 (2 cycles total)", () => {
    let s = createCpu();
    s = pressClock(s, "10000000");
    expect(s.phase).toBe("awaiting-operand");
    expect(s.registers.AX).toBe(0);

    s = pressClock(s, "00000111");
    expect(s.phase).toBe("idle");
    expect(s.registers.AX).toBe(7);
    expect(s.totalCycles).toBe(2);
  });

  it("MOV BX fills BX and leaves AX alone", () => {
    let s = createCpu();
    s = runLine(s, "10010000");
    s = pressClock(s, "00000011");
    expect(s.registers.BX).toBe(3);
    expect(s.registers.AX).toBe(0);
  });

  it("an invalid operand pattern keeps the Man waiting without losing the command", () => {
    let s = pressClock(createCpu(), "10000000");
    s = pressClock(s, "0000010a");
    expect(s.phase).toBe("awaiting-operand");
    expect(s.pending?.mnemonic).toBe("MOV AX");
  });
});

describe("ADD — multi-cycle internal work", () => {
  function loaded(): CpuState {
    let s = createCpu();
    s = pressClock(s, "10000000");
    s = pressClock(s, "00000010"); // AX = 2
    s = pressClock(s, "10010000");
    s = pressClock(s, "00000011"); // BX = 3
    return s;
  }

  it("takes 3 pulses: decode, work, result", () => {
    let s = pressClock(loaded(), "10110000");
    expect(s.phase).toBe("working");
    expect(s.registers.AX).toBe(2); // not done yet

    s = pressClock(s, "10110000");
    expect(s.phase).toBe("working");

    s = pressClock(s, "10110000");
    expect(s.phase).toBe("idle");
    expect(s.registers.AX).toBe(5);
  });

  it("ignores the EDB while working — new patterns can't interrupt", () => {
    let s = pressClock(loaded(), "10110000");
    // Slam a MOV AX opcode onto the bus mid-work; the Man shouldn't see it.
    s = pressClock(s, "10000000");
    s = pressClock(s, "10000000");
    expect(s.phase).toBe("idle");
    expect(s.registers.AX).toBe(5);
    expect(s.pending).toBeNull();
  });

  it("holds sums beyond one byte — the worktable has 16 bulbs", () => {
    let s = createCpu();
    s = pressClock(s, "10000000");
    s = pressClock(s, "11111111"); // AX = 255
    s = pressClock(s, "10010000");
    s = pressClock(s, "00000001"); // BX = 1
    s = runLine(s, "10110000");
    expect(s.registers.AX).toBe(256); // wider than the 8-bit bus, fine for the register
  });
});

describe("OUT — the Man answers on the bus", () => {
  it("places AX on the EDB as an 8-light pattern", () => {
    let s = createCpu();
    s = pressClock(s, "10000000");
    s = pressClock(s, "00000101"); // AX = 5
    s = runLine(s, "11000000");
    expect(s.outputEdb).toBe("00000101");
  });

  it("only the low byte fits when AX exceeds 255", () => {
    let s = createCpu();
    // Build AX = 255 + 5 = 260 via ADD.
    s = pressClock(s, "10000000");
    s = pressClock(s, "11111111"); // AX = 255
    s = pressClock(s, "10010000");
    s = pressClock(s, "00000101"); // BX = 5
    s = runLine(s, "10110000"); // AX = 260
    s = runLine(s, "11000000");
    expect(s.outputEdb).toBe("00000100");
    expect(s.say).toContain("low byte");
  });

  it("the output clears on the next pulse — the bus is yours again", () => {
    let s = createCpu();
    s = runLine(s, "11000000");
    expect(s.outputEdb).toBe("00000000");
    s = pressClock(s, "00000000");
    expect(s.outputEdb).toBeNull();
  });
});

describe("unknown patterns and idle behavior", () => {
  it("a pattern outside the codebook is shrugged off but still costs a cycle", () => {
    const s = pressClock(createCpu(), "01010101");
    expect(s.phase).toBe("idle");
    expect(s.registers).toEqual({ AX: 0, BX: 0, CX: 0, DX: 0 });
    expect(s.totalCycles).toBe(1);
    expect(s.say).toContain("codebook");
  });

  it("the CPU does nothing at all without a clock pulse", () => {
    const s = createCpu();
    expect(s.totalCycles).toBe(0);
    expect(s.say).toContain("Zzz");
  });
});

describe("the sample program (2 + 3)", () => {
  it("runs end to end and answers 00000101 on the EDB", () => {
    let s = createCpu();
    for (const line of SAMPLE_PROGRAM) {
      s = runLine(s, line.pattern);
    }
    expect(s.registers.AX).toBe(5);
    expect(s.registers.BX).toBe(3);
    expect(s.outputEdb).toBe("00000101");
  });

  it("costs exactly 9 clock cycles — more than one cycle per command", () => {
    let s = createCpu();
    for (const line of SAMPLE_PROGRAM) {
      s = runLine(s, line.pattern);
    }
    expect(s.totalCycles).toBe(9);
    expect(sampleProgramCycles()).toBe(9);
  });
});

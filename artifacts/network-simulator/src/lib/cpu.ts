// Pure "Man in the Box" CPU model — an 8088-style machine driven entirely by
// an 8-bit External Data Bus (EDB) and a clock wire (CLK). Each CLK pulse is
// one clock cycle; instructions take at least two cycles, and internal work
// (like ADD) burns extra cycles during which the Man ignores the bus.
// Kept free of React so the fetch → decode → execute behavior and the cycle
// accounting can be unit-tested (see cpu.test.ts).

export type RegisterName = "AX" | "BX" | "CX" | "DX";

export const REGISTER_NAMES: RegisterName[] = ["AX", "BX", "CX", "DX"];

export interface Instruction {
  /** 8-bit EDB light pattern for this command. */
  opcode: string;
  mnemonic: string;
  /** Codebook wording, as the Man reads it. */
  meaning: string;
  /** How many data lines must follow on the EDB. */
  operands: 0 | 1;
  /** Total clock cycles to fully process (opcode + operand reads + internal work). */
  cycles: number;
}

// The simplified 8088 codebook from the Man-in-the-Box analogy.
export const CODEBOOK: Instruction[] = [
  {
    opcode: "10000000",
    mnemonic: "MOV AX",
    meaning: "The next line is a number; put it in the AX register",
    operands: 1,
    cycles: 2,
  },
  {
    opcode: "10010000",
    mnemonic: "MOV BX",
    meaning: "The next line is a number; put it in the BX register",
    operands: 1,
    cycles: 2,
  },
  {
    opcode: "10110000",
    mnemonic: "ADD AX, BX",
    meaning: "Add AX to BX and put the result in AX",
    operands: 0,
    cycles: 3,
  },
  {
    opcode: "11000000",
    mnemonic: "OUT AX",
    meaning: "Put the value of AX on the External Data Bus",
    operands: 0,
    cycles: 2,
  },
];

export type CpuPhase = "idle" | "awaiting-operand" | "working";

export interface CpuState {
  /** The four 16-bit general-purpose worktables. */
  registers: Record<RegisterName, number>;
  phase: CpuPhase;
  /** Instruction currently being fetched or worked on. */
  pending: Instruction | null;
  /** Operand captured for the pending instruction, if any. */
  operand: number | null;
  /** Internal work cycles still owed before the pending instruction completes. */
  cyclesLeft: number;
  /** Lifetime clock-cycle counter. */
  totalCycles: number;
  /** Pattern the Man placed on the EDB (OUT), or null if the bus is yours. */
  outputEdb: string | null;
  /** What the Man says after the latest pulse — drives the speech bubble. */
  say: string;
}

export function createCpu(): CpuState {
  return {
    registers: { AX: 0, BX: 0, CX: 0, DX: 0 },
    phase: "idle",
    pending: null,
    operand: null,
    cyclesLeft: 0,
    totalCycles: 0,
    outputEdb: null,
    say: "Zzzzzzzz… (ring the bell to wake me)",
  };
}

/** 8-bit light pattern for a value (low byte only — the bus is 8 wires wide). */
export function toBinary8(n: number): string {
  return (n & 0xff).toString(2).padStart(8, "0");
}

/** 16-bit light pattern for a register's worktable. */
export function toBinary16(n: number): string {
  return (n & 0xffff).toString(2).padStart(16, "0");
}

/** Parse an 8-light EDB pattern, or null if it isn't exactly eight 0/1s. */
export function parseBinary(pattern: string): number | null {
  if (!/^[01]{8}$/.test(pattern)) return null;
  return parseInt(pattern, 2);
}

/** Look up an EDB pattern in the codebook. */
export function decode(pattern: string): Instruction | undefined {
  return CODEBOOK.find((i) => i.opcode === pattern);
}

function execute(state: CpuState, instr: Instruction, operand: number | null): CpuState {
  const registers = { ...state.registers };
  let outputEdb: string | null = null;
  let say: string;

  switch (instr.opcode) {
    case "10000000": {
      registers.AX = operand ?? 0;
      say = `Done! AX now holds ${toBinary8(registers.AX)} (${registers.AX}).`;
      break;
    }
    case "10010000": {
      registers.BX = operand ?? 0;
      say = `Done! BX now holds ${toBinary8(registers.BX)} (${registers.BX}).`;
      break;
    }
    case "10110000": {
      registers.AX = (state.registers.AX + state.registers.BX) & 0xffff;
      say = `DING! ${state.registers.AX} + ${state.registers.BX} = ${registers.AX}. The answer is in AX.`;
      break;
    }
    case "11000000": {
      outputEdb = toBinary8(registers.AX);
      say =
        registers.AX > 0xff
          ? `AX holds ${registers.AX}, but the bus is only 8 wires — I can only show the low byte: ${outputEdb}.`
          : `Here you go! I flipped my switches: the EDB now reads ${outputEdb} (${registers.AX}).`;
      break;
    }
    default:
      say = "…I don't know how I got here.";
  }

  return {
    ...state,
    registers,
    phase: "idle",
    pending: null,
    operand: null,
    cyclesLeft: 0,
    outputEdb,
    say,
  };
}

/**
 * One charge on the CLK wire. The Man wakes up, and depending on where he is
 * mid-instruction he reads the EDB (fetch/operand) or keeps grinding through
 * internal work cycles — during which the bus is ignored entirely.
 */
export function pressClock(state: CpuState, edbPattern: string): CpuState {
  const s: CpuState = { ...state, totalCycles: state.totalCycles + 1, outputEdb: null };

  if (s.phase === "working" && s.pending) {
    const cyclesLeft = s.cyclesLeft - 1;
    if (cyclesLeft > 0) {
      return {
        ...s,
        cyclesLeft,
        say: `Still working on ${s.pending.mnemonic}… (${cyclesLeft} more cycle${cyclesLeft === 1 ? "" : "s"})`,
      };
    }
    return execute(s, s.pending, s.operand);
  }

  if (s.phase === "awaiting-operand" && s.pending) {
    const value = parseBinary(edbPattern);
    if (value === null) {
      return { ...s, say: "Those lights make no sense as a number — check the bus and ring again." };
    }
    const remaining = s.pending.cycles - 2; // opcode read + this operand read are spent
    if (remaining > 0) {
      return {
        ...s,
        operand: value,
        phase: "working",
        cyclesLeft: remaining,
        say: `Got the number ${value}. Working… (${remaining} more cycle${remaining === 1 ? "" : "s"})`,
      };
    }
    return execute(s, s.pending, value);
  }

  // Idle: this pulse is the fetch — read the EDB and check the codebook.
  const instr = decode(edbPattern);
  if (!instr) {
    return { ...s, say: `${edbPattern}? That pattern isn't in my codebook. I'll wait.` };
  }
  if (instr.operands > 0) {
    return {
      ...s,
      phase: "awaiting-operand",
      pending: instr,
      say: `${instr.mnemonic} — got it. Put the number on the bus and ring the bell again.`,
    };
  }
  const remaining = instr.cycles - 1; // the fetch cycle is spent
  if (remaining > 0) {
    return {
      ...s,
      phase: "working",
      pending: instr,
      say: `${instr.mnemonic} — on it! This one takes me ${instr.cycles} cycles total. Keep ringing.`,
      cyclesLeft: remaining,
    };
  }
  return execute(s, instr, null);
}

export interface ProgramLine {
  pattern: string;
  label: string;
}

// The classic worked example: 2 + 3, answered on the bus as 00000101.
export const SAMPLE_PROGRAM: ProgramLine[] = [
  { pattern: "10000000", label: "MOV AX — the next line is a number; put it in AX" },
  { pattern: "00000010", label: "The number 2" },
  { pattern: "10010000", label: "MOV BX — the next line is a number; put it in BX" },
  { pattern: "00000011", label: "The number 3" },
  { pattern: "10110000", label: "ADD AX, BX — add them, result in AX" },
  { pattern: "11000000", label: "OUT AX — put the value of AX on the EDB" },
];

/** Total clock cycles the sample program costs (matches Figure 3-10's point). */
export function sampleProgramCycles(): number {
  let cycles = 0;
  for (const line of SAMPLE_PROGRAM) {
    const instr = decode(line.pattern);
    if (instr) cycles += instr.cycles;
  }
  return cycles;
}

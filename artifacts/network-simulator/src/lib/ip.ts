// Pure IPv4 math helpers. Kept free of React so they can be unit-tested
// in isolation (see ip.test.ts).

/** Convert a dotted-decimal IPv4 string to an unsigned 32-bit integer. */
export function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/** Convert an unsigned 32-bit integer back to dotted-decimal notation. */
export function numberToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
}

/** Classful network class for an IPv4 address, based on its first octet. */
export function getIpClass(ip: string): string {
  const firstOctet = parseInt(ip.split(".")[0], 10);
  if (firstOctet >= 1 && firstOctet <= 126) return "Class A";
  if (firstOctet >= 128 && firstOctet <= 191) return "Class B";
  if (firstOctet >= 192 && firstOctet <= 223) return "Class C";
  if (firstOctet >= 224 && firstOctet <= 239) return "Class D (Multicast)";
  if (firstOctet >= 240 && firstOctet <= 255) return "Class E (Experimental)";
  return "Unknown";
}

/**
 * Strict dotted-decimal IPv4 validation: exactly four octets, each 0–255,
 * with no leading zeros, signs, or trailing characters.
 */
export function isValidIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const num = parseInt(p, 10);
    return num >= 0 && num <= 255 && !isNaN(num) && p === num.toString();
  });
}

/**
 * Default (classful) prefix length for an address, used to derive how many
 * bits have been "borrowed" for subnetting. Based on the classful first-octet
 * rule: Class A → /8, Class B → /16, Class C → /24. Other ranges (loopback,
 * multicast, experimental) fall back to /24 since they aren't subnetted in
 * this teaching context.
 *
 * Takes the address as an unsigned 32-bit integer to avoid string-prefix
 * pitfalls (e.g. "172.200.x" is not the RFC1918 /16 block, and "10.0.0.0" must
 * not be confused with "100.x").
 */
function defaultClassfulCidr(ipNum: number): number {
  const firstOctet = (ipNum >>> 24) & 255;
  if (firstOctet >= 1 && firstOctet <= 126) return 8; // Class A
  if (firstOctet >= 128 && firstOctet <= 191) return 16; // Class B
  if (firstOctet >= 192 && firstOctet <= 223) return 24; // Class C
  return 24;
}

export interface SubnetInfo {
  maskNum: number;
  wildcardNum: number;
  networkNum: number;
  broadcastNum: number;
  firstUsableNum: number;
  lastUsableNum: number;
  totalHosts: number;
  defaultCidr: number;
  borrowedBits: number;
  totalSubnets: number;
  binaryString: string;
}

/**
 * Compute the subnet breakdown for an IPv4 address and CIDR prefix length.
 * `cidr` is expected to be an integer in the range 0–32.
 */
export function computeSubnet(ip: string, cidr: number): SubnetInfo {
  const ipNum = ipToNumber(ip);
  const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wildcardNum = ~maskNum >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;
  const firstUsableNum = cidr >= 31 ? networkNum : (networkNum + 1) >>> 0;
  const lastUsableNum = cidr >= 31 ? broadcastNum : (broadcastNum - 1) >>> 0;

  const totalHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.pow(2, 32 - cidr) - 2;
  const defaultCidr = defaultClassfulCidr(ipNum);
  const borrowedBits = Math.max(0, cidr - defaultCidr);
  const totalSubnets = Math.pow(2, borrowedBits);

  const binaryString = ipNum.toString(2).padStart(32, "0");

  return {
    maskNum,
    wildcardNum,
    networkNum,
    broadcastNum,
    firstUsableNum,
    lastUsableNum,
    totalHosts,
    defaultCidr,
    borrowedBits,
    totalSubnets,
    binaryString,
  };
}

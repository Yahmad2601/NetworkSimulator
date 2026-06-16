// Pure TLS handshake model — message sequences for TLS 1.3 (1-RTT) and TLS 1.2
// (2-RTT), kept free of React so the ordering, direction, and the plaintext vs
// encrypted boundary can be unit-tested (see tls.test.ts).

export type TlsVersion = "1.3" | "1.2";
export type TlsDirection = "client-to-server" | "server-to-client";

export interface TlsMessage {
  name: string;
  direction: TlsDirection;
  /** True once the record is protected — i.e. after handshake keys are derived. */
  encrypted: boolean;
  summary: string;
  fields: string[];
}

// TLS 1.3 — the client's key_share rides along in the ClientHello, so the shared
// secret is established after a single round trip and everything after the two
// Hellos is encrypted.
const TLS13: TlsMessage[] = [
  {
    name: "ClientHello",
    direction: "client-to-server",
    encrypted: false,
    summary:
      "Client proposes TLS 1.3 and already includes its ephemeral ECDHE public key, so key agreement can complete in one round trip.",
    fields: [
      "supported_versions: TLS 1.3",
      "key_share: client ECDHE public key",
      "cipher_suites",
      "server_name (SNI)",
    ],
  },
  {
    name: "ServerHello",
    direction: "server-to-client",
    encrypted: false,
    summary:
      "Server selects parameters and returns its ECDHE public key. Both sides now derive the shared handshake keys — every record after this is encrypted.",
    fields: ["selected_version: TLS 1.3", "key_share: server ECDHE public key", "cipher_suite"],
  },
  {
    name: "EncryptedExtensions",
    direction: "server-to-client",
    encrypted: true,
    summary: "First encrypted record: the remaining negotiated extensions, hidden from eavesdroppers.",
    fields: ["ALPN, other extensions"],
  },
  {
    name: "Certificate",
    direction: "server-to-client",
    encrypted: true,
    summary:
      "The server's certificate chain — encrypted in TLS 1.3, unlike TLS 1.2 where it is sent in the clear.",
    fields: ["server certificate chain"],
  },
  {
    name: "CertificateVerify",
    direction: "server-to-client",
    encrypted: true,
    summary:
      "Server signs the handshake transcript with its certificate's private key, proving it owns the certificate.",
    fields: ["signature over transcript"],
  },
  {
    name: "Finished (server)",
    direction: "server-to-client",
    encrypted: true,
    summary: "Server confirms handshake integrity with an HMAC over the transcript. Its half is done.",
    fields: ["verify_data (HMAC)"],
  },
  {
    name: "Finished (client)",
    direction: "client-to-server",
    encrypted: true,
    summary: "Client verifies the certificate and signature, then sends its own Finished.",
    fields: ["verify_data (HMAC)"],
  },
  {
    name: "Application Data",
    direction: "client-to-server",
    encrypted: true,
    summary: "Secure channel established — application data flows after just one round trip.",
    fields: ["GET / HTTP/1.1 …"],
  },
];

// TLS 1.2 — the full handshake needs an extra round trip: the key exchange only
// happens after the server's first flight, and the certificate is sent in the clear.
const TLS12: TlsMessage[] = [
  {
    name: "ClientHello",
    direction: "client-to-server",
    encrypted: false,
    summary: "Client proposes TLS 1.2 — but with no key share, so key agreement needs more messages.",
    fields: ["version: TLS 1.2", "client_random", "cipher_suites"],
  },
  {
    name: "ServerHello",
    direction: "server-to-client",
    encrypted: false,
    summary: "Server selects the cipher suite and sends its random.",
    fields: ["version: TLS 1.2", "server_random", "cipher_suite"],
  },
  {
    name: "Certificate",
    direction: "server-to-client",
    encrypted: false,
    summary: "In TLS 1.2 the certificate chain is sent in the clear.",
    fields: ["server certificate chain"],
  },
  {
    name: "ServerKeyExchange",
    direction: "server-to-client",
    encrypted: false,
    summary: "Server sends its ephemeral (EC)DHE key-exchange parameters, signed by its certificate.",
    fields: ["DHE/ECDHE params + signature"],
  },
  {
    name: "ServerHelloDone",
    direction: "server-to-client",
    encrypted: false,
    summary: "Server signals the end of its first flight. (End of round trip 1.)",
    fields: [],
  },
  {
    name: "ClientKeyExchange",
    direction: "client-to-server",
    encrypted: false,
    summary: "Client sends its key-exchange value; both sides can now compute the shared secret.",
    fields: ["client key-exchange value"],
  },
  {
    name: "ChangeCipherSpec",
    direction: "client-to-server",
    encrypted: false,
    summary: "Client signals that records from here on are encrypted.",
    fields: [],
  },
  {
    name: "Finished (client)",
    direction: "client-to-server",
    encrypted: true,
    summary: "Client's first encrypted record, verifying the handshake.",
    fields: ["verify_data (HMAC)"],
  },
  {
    name: "ChangeCipherSpec",
    direction: "server-to-client",
    encrypted: false,
    summary: "Server signals that its records are now encrypted too.",
    fields: [],
  },
  {
    name: "Finished (server)",
    direction: "server-to-client",
    encrypted: true,
    summary: "Server's encrypted Finished completes the handshake. (End of round trip 2.)",
    fields: ["verify_data (HMAC)"],
  },
  {
    name: "Application Data",
    direction: "client-to-server",
    encrypted: true,
    summary: "Secure channel established — but it took two round trips.",
    fields: ["GET / HTTP/1.1 …"],
  },
];

export function tlsMessages(version: TlsVersion): TlsMessage[] {
  return version === "1.3" ? TLS13 : TLS12;
}

/** Round trips required before the client can send application data. */
export function roundTrips(version: TlsVersion): number {
  return version === "1.3" ? 1 : 2;
}

/** Index of the first encrypted record (the plaintext → encrypted boundary), or -1. */
export function firstEncryptedIndex(messages: TlsMessage[]): number {
  return messages.findIndex((m) => m.encrypted);
}

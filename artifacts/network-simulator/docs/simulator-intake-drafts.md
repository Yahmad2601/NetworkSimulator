# Simulator Intake Drafts

**Status:** DRAFT — awaiting instructor technical review.
**Target audience (all entries):** intermediate networking / cybersecurity students who
already understand IP addressing, the OSI/TCP-IP layers, and basic TCP.

Each entry follows the 6-point intake form, with the proposed **aha moment**,
**state machine**, **interaction model**, and **visual layout** filled in by Claude.
Please correct anything in the **Accuracy spec** sections — those are the claims that
must be right before a simulator is built. Mark a line with `⚠️` if you want it changed.

Build pattern reminder: each simulator is a page under `src/pages/simulators/`, uses
`SimulatorLayout` + declarative `footerControls`, is registered in `App.tsx` (lazy route)
and `data/simulators.ts` (home-grid metadata), and any real logic goes in a tested
`src/lib/*.ts` module.

---

## 1. DHCP (DORA)

- **Concept & aha:** A brand-new device with *no* IP address can still obtain one — and
  it does so in exactly four broadcast/unicast messages: **D**iscover, **O**ffer,
  **R**equest, **A**cknowledge. The aha: it has to *broadcast* because it has no address
  and doesn't know the server yet.
- **Accuracy spec (verify):**
  - Ports: client **UDP 68**, server **UDP 67**.
  - Discover: client `0.0.0.0` → broadcast `255.255.255.255`; includes transaction ID (xid) and client MAC (chaddr).
  - Offer: server → client; proposes `yiaddr` (your IP), subnet mask, gateway, DNS, lease time.
  - Request: client → broadcast again, naming the chosen server (Server Identifier option) so other servers withdraw their offers.
  - Ack: server confirms the lease; client is now BOUND.
  - Lease renewal timers: **T1 = 50%** of lease (RENEWING, unicast to server), **T2 = 87.5%** (REBINDING, broadcast).
- **State machine (client):** INIT → SELECTING → REQUESTING → BOUND → RENEWING (T1) → REBINDING (T2) → INIT (on expiry).
- **Interaction model:** Step button advances D→O→R→A; a lease-timer bar you can fast-forward to trigger RENEWING; optional toggle for "two DHCP servers" to demonstrate the Server Identifier.
- **Visual layout:** Client laptop (IP label morphs `0.0.0.0` → assigned) on the left, DHCP server on the right, a "broadcast domain" band between; a packet card showing the current message type + key fields; a lease countdown bar along the bottom.
- **Scope boundaries:** IPv4 only; omit DHCP relay/`giaddr` across subnets and the full options catalog at first.
- *Suggested metadata:* Layer 7 (App) / `#3b82f6` / intermediate.

---

## 2. TLS 1.3 Handshake

- **Concept & aha:** TLS 1.3 sets up an encrypted, authenticated channel in **one round
  trip (1-RTT)** — the client can send encrypted application data right after the server's
  first reply. Contrast with TLS 1.2's 2-RTT to make the speed-up visceral.
- **Accuracy spec (verify):**
  - **ClientHello:** supported versions, **key_share** (client ephemeral ECDHE public key), cipher suites, SNI. *(plaintext)*
  - **ServerHello:** chosen version, **key_share** (server ECDHE public), cipher suite. After this exchange **both sides derive handshake keys**. *(plaintext)*
  - Server then sends (now **encrypted**): EncryptedExtensions, Certificate, CertificateVerify (signs the handshake transcript with the cert's private key), Finished.
  - Client verifies the cert + signature, sends its Finished. Application data flows.
  - Key agreement is **ephemeral ECDHE** → forward secrecy. TLS 1.3 **removed** static RSA key exchange.
  - 0-RTT/PSK resumption exists but is a scope decision (see below).
- **State machine (client):** START → WAIT_SH → WAIT_ENCRYPTED_EXT → WAIT_CERT → WAIT_CERT_VERIFY → WAIT_FINISHED → CONNECTED.
- **Interaction model:** Step through messages; **toggle TLS 1.2 vs 1.3** to show the round-trip count change on an RTT counter; each message tagged plaintext vs encrypted.
- **Visual layout:** Ladder/sequence diagram — client left, server right, messages as arrows down a timeline; a padlock that "closes" the moment keys are derived; amber arrows = plaintext, green = encrypted; an RTT counter.
- **Scope boundaries:** Omit 0-RTT/early data initially; abstract the HKDF key schedule as "derive keys"; don't show real crypto math.
- *Suggested metadata:* Layer 5/6 / `#22c55e` / intermediate.

---

## 3. VLAN / 802.1Q Tagging

- **Concept & aha:** One physical switch can host multiple **isolated broadcast domains**,
  and a 4-byte tag inserted into the Ethernet frame is what keeps them separate across a
  trunk. Aha: a broadcast in VLAN 10 never reaches VLAN 20, even on the same switch.
- **Accuracy spec (verify):**
  - 802.1Q tag = **4 bytes inserted between Source MAC and EtherType**. Fields: **TPID 0x8100**, **PCP (3 bits)**, **DEI (1 bit)**, **VID (12 bits → 0–4095, 4094 usable)**.
  - **Access port:** one VLAN; frames are **untagged** on the wire to the host (switch tags internally).
  - **Trunk port:** carries multiple VLANs; frames are **tagged**, except the **native VLAN** which is sent **untagged** (default native = VLAN 1).
  - Inter-VLAN routing needs an L3 device ("router-on-a-stick" or an SVI).
- **State machine:** N/A — frame transformation flow: host untagged → access port adds VID → trunk carries tagged → egress access port strips tag → delivered untagged.
- **Interaction model:** Assign each PC to a VLAN (set access-port VID); send a broadcast and watch it reach only same-VLAN hosts; flip a link between access/trunk and watch the tag get added/stripped; click a frame to inspect the inserted tag bytes.
- **Visual layout:** A switch with several ports, PCs colored by VLAN (VLAN 10 = blue, VLAN 20 = orange), a trunk link to a second switch; frame inspector showing the byte layout with the tag highlighted; broadcast animation that halts at the VLAN boundary.
- **Scope boundaries:** 2 VLANs + 1 trunk to start; omit QinQ/double-tagging, VTP, voice VLAN, and PCP/QoS detail.
- *Suggested metadata:* Layer 2 / `#f59e0b` / intermediate.

---

## 4. Spanning Tree Protocol (STP)

- **Concept & aha:** Redundant switch links cause catastrophic **broadcast storms**; STP
  mathematically elects a single loop-free tree and **blocks** the redundant links — then
  re-activates them automatically if an active link fails.
- **Accuracy spec (verify):**
  - **Root bridge** = lowest **Bridge ID** (priority + MAC); default priority **32768**.
  - Each non-root switch elects one **Root Port** = lowest **path cost** to root. IEEE costs: 10 Gbps = **2**, 1 Gbps = **4**, 100 Mbps = **19**, 10 Mbps = **100**.
  - Each segment elects one **Designated Port**; all remaining ports → **Blocking**.
  - Classic 802.1D port states: **Blocking → Listening → Learning → Forwarding** (+ Disabled). Timers: hello **2s**, forward delay **15s** (×2 stages), max age **20s** → ~**30–50s** convergence.
  - BPDUs carry the root/cost info; sent every hello interval.
  - ⚠️ Note: RSTP (802.1w) converges much faster — confirm whether you want classic 802.1D (clearer) or RSTP.
- **State machine (per port):** Blocking → Listening → Learning → Forwarding, plus the election algorithm (root → root ports → designated ports → blocked).
- **Interaction model:** A triangle of 3 switches with redundant links; "Run election" steps through root → root ports → designated → blocked; then "Fail a link" and watch the blocked port re-activate; optionally change a bridge priority and re-run to elect a different root.
- **Visual layout:** Switches with visible Bridge IDs; ports color-coded by role (root = green, designated = blue, blocked = red ✕); a "Without STP" toggle that animates a broadcast storm looping forever vs. contained with STP.
- **Scope boundaries:** Classic 802.1D first; fixed 3-switch topology; ignore PVST/MSTP.
- *Suggested metadata:* Layer 2 / `#f59e0b` / advanced.

---

## 5. Symmetric vs Asymmetric Encryption / Diffie–Hellman

- **Concept & aha:** Two parties can agree on a **shared secret over a fully public
  channel** without ever transmitting it — an eavesdropper sees every message and still
  can't derive the key. That's the magic that bootstraps HTTPS.
- **Accuracy spec (verify):**
  - **Symmetric** (e.g. AES): one shared key encrypts + decrypts; fast; problem = key distribution.
  - **Asymmetric** (e.g. RSA): public/private keypair; encrypt-with-public/decrypt-with-private, or sign-with-private/verify-with-public; slow; solves distribution.
  - **Diffie–Hellman:** public params **g** (generator), **p** (prime). Alice picks secret **a**, sends `g^a mod p`. Bob picks secret **b**, sends `g^b mod p`. Both compute `g^(ab) mod p`. Eve sees `g, p, g^a, g^b` but the **discrete-log problem** stops her getting `ab`.
  - Teaching values: **p = 23, g = 5, a = 6, b = 15 → shared = 2** (verify), with a banner that real values are 2048-bit+.
  - In practice it's **hybrid**: DH/asymmetric agrees a symmetric session key, then symmetric encrypts the bulk data.
- **State machine:** N/A — stepwise exchange: agree params → each pick private → compute & exchange public values → independently compute shared secret → confirm both match.
- **Interaction model:** Inputs/sliders for Alice's `a`, Bob's `b` (and optionally `g`, `p`); each side computes its public value and the shared secret live; an **Eve panel** shows exactly what she can see and that she can't reach the secret. Optional "mixing paint" metaphor mode.
- **Visual layout:** Alice (left), Bob (right), Eve (center, "eavesdropper"); each box shows a locked private value and a sent public value; arrows for the exchange; both arrive at the same shared value that lights green; Eve's box shows `???`.
- **Scope boundaries:** Small integers only (labeled illustrative); skip ECDH; symmetric-vs-asymmetric can be an intro toggle/panel.
- *Suggested metadata:* Security / `#a855f7` / intermediate.

---

## 6. Hashing & Salting

- **Concept & aha:** A hash is **one-way and deterministic** — but *identical passwords
  produce identical hashes*, which is exactly why a per-user **salt** is mandatory to
  defeat rainbow tables.
- **Accuracy spec (verify):**
  - Hash properties: fixed-length output, deterministic, one-way (infeasible to reverse), **avalanche effect** (1-bit input change → ~50% output bits change), collision-resistant. Example: **SHA-256**.
  - Storing plaintext or plain-hashed passwords is unsafe: rainbow tables reverse common hashes, and identical hashes leak that two users share a password.
  - **Salt** = random per-user value combined with the password before hashing, stored alongside the hash → same password yields different hashes → precomputed rainbow tables useless.
  - ⚠️ Real password storage should use **slow KDFs (bcrypt / scrypt / Argon2)**, not fast SHA — worth stating as a note even if we demo with SHA-256.
  - Implementation note: we can compute a **real SHA-256 in-browser via Web Crypto `crypto.subtle.digest`** — accurate, not faked.
- **State machine:** N/A — transformation demo.
- **Interaction model:** Type a password → live hash; enter the same password as a "second user" → without salt the hashes match (highlight the leak); toggle **Add salt** → hashes diverge; demonstrate **avalanche** by changing one character; optional "attacker rainbow-table lookup" that succeeds on the unsalted hash and fails on the salted one.
- **Visual layout:** Input → monospace hex output; two user rows comparing same-password-same-hash (red) vs salted-different (green); an avalanche visual of flipping bits; a small attacker "rainbow table" panel.
- **Scope boundaries:** SHA-256 for the live demo; mention bcrypt/Argon2 and pepper conceptually without implementing.
- *Suggested metadata:* Security / `#ec4899` / beginner–intermediate.

---

## 7. Traceroute / ICMP TTL

- **Concept & aha:** Traceroute maps every router on a path by **abusing the TTL field** —
  sending packets engineered to "die" one hop further each round and listening for the
  error each dying packet triggers.
- **Accuracy spec (verify):**
  - Every router **decrements TTL by 1**; when **TTL reaches 0** the router drops the packet and returns **ICMP Time Exceeded (Type 11)**.
  - Traceroute sends TTL=1, then 2, then 3… each elicits a Time Exceeded from the Nth router, revealing its IP.
  - Reaching the destination yields a *different* reply: **ICMP Echo Reply** (ICMP probes, Windows `tracert`) or **ICMP Port Unreachable (Type 3, Code 3)** (classic UDP probes to a high port, Linux default) — this signals "done."
  - Each hop is typically probed **3×** (the three RTT columns); `*` = no reply (filtered).
- **State machine:** Iterative loop — ttl=1; send; on Time Exceeded record hop; ttl++; repeat until Echo Reply / Port Unreachable or max hops.
- **Interaction model:** "Run traceroute"; a TTL counter and a packet that travels one router further each round; each router lights up and sends its reply back; a hop table builds up (#, IP, RTT). Optional: insert a filtered router that returns `*`.
- **Visual layout:** A chain of routers source→destination; a packet showing a live **`TTL: n`** badge that decrements at each hop; a red "Time Exceeded" reply animating back when it hits 0; a growing results table on the side.
- **Scope boundaries:** Single path (no ECMP multipath); abstract reverse-DNS; ICMP variant by default with a note on UDP probes.
- *Suggested metadata:* Layer 3 / `#84cc16` / intermediate.

---

## 8. DDoS & Mitigation

- **Concept & aha:** One attacker is harmless; **thousands of coordinated bots** exhaust a
  server's *finite* resources (bandwidth / connection table / CPU). Mitigation is about
  **distinguishing and dropping malicious traffic before it reaches the target**.
- **Accuracy spec (verify):**
  - **Volumetric** (UDP flood, DNS/NTP **amplification**): exhaust bandwidth; amplification spoofs the victim's source IP so a small query yields a large response aimed at the victim.
  - **Protocol** (**SYN flood**): attacker sends SYNs but never the final ACK → server fills its **half-open connection backlog** → legit users denied. Mitigation: **SYN cookies**.
  - **Application-layer** (HTTP flood): looks like real requests, exhausts app resources, hardest to detect.
  - Mitigations: rate limiting, **SYN cookies**, scrubbing centers, **anycast** distribution, upstream/ISP filtering, blackholing, **WAF/CDN** absorption for L7.
- **State machine (server resource):** NORMAL → DEGRADED (resource % climbing) → SATURATED (dropping legitimate traffic); enabling a mitigation moves it back toward NORMAL.
- **Interaction model:** Choose attack type (SYN flood / amplification / HTTP flood); slider for bot count / attack rate; watch a resource gauge fill and legitimate-user success rate fall; toggle mitigations and watch recovery.
- **Visual layout:** A botnet cloud (many small red nodes) → target server with resource gauges (bandwidth / connection table / CPU); green legitimate users trying to get through; a toggle-able "mitigation shield" that filters red traffic; a success/fail counter.
- **Scope boundaries:** Abstract resource model (not real packet counts); 2–3 representative attack types; no real botnet C2 modeling. Framed as defensive education.
- *Suggested metadata:* Security / `#ef4444` / intermediate.

---

## 9. Port Scanning (nmap)

- **Concept & aha:** Before an attack comes reconnaissance — and the *way a port responds*
  (or stays silent) to a crafted probe reveals whether it's **open, closed, or filtered**
  by a firewall. (Framed strictly for **authorized** testing.)
- **Accuracy spec (verify):**
  - **TCP SYN / connect scan:** send SYN → **SYN-ACK = open**, **RST = closed**, **no response / ICMP unreachable = filtered**.
  - **SYN (half-open) scan:** send SYN, receive SYN-ACK, reply **RST** instead of completing the handshake (stealthier, no full connection).
  - **NULL / FIN / Xmas scans:** no flags / FIN / FIN+PSH+URG — per RFC 793, **closed → RST**, **open|filtered → no response**.
  - **UDP scan:** no response = open|filtered; **ICMP Port Unreachable = closed**.
  - Result states: **open / closed / filtered** (and open|filtered).
- **State machine:** Per-port: probe sent → response classified (open / closed / filtered).
- **Interaction model:** Choose scan type (connect / SYN / NULL-Xmas / UDP) and a target with a mix of open/closed/filtered ports; run; watch each probe and reply classify a port; toggle a **firewall** to convert "closed" RSTs into silent "filtered" drops.
- **Visual layout:** Scanner (left) → target host (right) with a column of ports (22, 80, 443, 3306…); animated probe→response per port; color results (green open, gray closed, amber filtered); a toggle-able firewall layer; a results table (port / state / service).
- **Scope boundaries:** Representative port set; one host (no subnet sweep); 2–3 scan types to start; explicit "authorized use only" banner; OS/version detection as a later add-on.
- *Suggested metadata:* Security / `#ef4444` / intermediate.

---

## 10. SQL Injection

- **Concept & aha:** When user input is **concatenated directly into a SQL query**, an
  attacker can break out of the *data* context into the *command* context — and
  **parameterized queries** are what stop it cold.
- **Accuracy spec (verify):**
  - Vulnerable pattern: `SELECT * FROM users WHERE username='$u' AND password='$p'`.
  - Classic auth bypass: username `' OR '1'='1' --` → the `--` comments out the password check and `'1'='1'` is always true.
  - Other classes: **UNION-based** (exfiltrate other tables), **error-based**, **blind** (boolean/time).
  - Fix: **parameterized queries / prepared statements** (input bound as data, never parsed as SQL); plus least-privilege DB accounts and input validation.
- **State machine:** N/A — input → query construction → execution outcome.
- **Interaction model:** A login form; a normal username/password builds a safe query; the injection payload visibly rewrites the constructed query (injected portion highlighted) and bypasses auth; toggle **"use parameterized query"** → the same input is treated as a literal bound parameter and the attack fails. Optional UNION example dumping a table.
- **Visual layout:** Login form on top; below it the **live-constructed SQL string** with the user-input portion highlighted (injected/escaped-out part in red); a "database" panel returning rows / access granted-denied; the parameterized toggle shows input as a separate bound-parameter box rather than concatenated text.
- **Scope boundaries:** Canonical auth-bypass + optional UNION; a tiny simulated query evaluator for the demo cases (not a real SQL engine); defensive framing.
- *Suggested metadata:* Security / `#f97316` / intermediate.

---

## 11. Cross-Site Scripting (XSS)

- **Concept & aha:** If a site renders user input as **HTML without escaping it**, an
  attacker's `<script>` runs in *other users'* browsers with *their* session — turning a
  comment box into session/cookie theft.
- **Accuracy spec (verify):**
  - **Stored XSS:** payload saved server-side (e.g. a comment), served to every visitor.
  - **Reflected XSS:** payload in a URL/query param reflected back in the response; victim must open a crafted link.
  - **DOM-based XSS:** client-side JS writes untrusted data into the DOM (e.g. `innerHTML`).
  - Example payloads: `<script>…document.cookie…</script>`, `<img src=x onerror=…>`.
  - Fixes: **output encoding/escaping** (render as text, not HTML), **Content Security Policy**, **HttpOnly cookies**, framework auto-escaping.
- **State machine:** N/A — injection → storage/reflection → execution in victim context.
- **Interaction model:** A mock comment board; attacker submits a payload; toggle **"sanitize output"** off → the effect is **depicted** (a simulated "script executed / cookie stolen" overlay — never real `eval`); toggle on → payload shown as harmless escaped text (`&lt;script&gt;`). Stored vs reflected as two modes; HttpOnly/CSP as shield toggles.
- **Visual layout:** Simple web-app mockup (comment feed); an attacker pane submitting the payload; a victim pane viewing the page; unsanitized → dramatic simulated "cookie stolen" indicator; sanitized → literal escaped text; shield icons for CSP/HttpOnly.
- **Scope boundaries:** **Always depict execution, never actually run user input.** Cover stored + reflected; DOM-based and CSP as notes.
- *Suggested metadata:* Security / `#f97316` / intermediate.

---

## 12. PKI / Certificate Chains

- **Concept & aha:** Your browser trusts a website not because it knows the site, but
  because its certificate is **signed by a chain leading up to a Root CA already in the
  browser's trust store** — and breaking *any* link (expired, untrusted, mismatched,
  revoked) breaks the whole trust.
- **Accuracy spec (verify):**
  - Chain: **Root CA** (self-signed, in the trust store) → **Intermediate CA**(s) → **Leaf/end-entity** cert (the website). Each cert is signed by the one above it.
  - Leaf cert fields: **Subject (CN / SAN = domain)**, **public key**, **Issuer**, **validity dates**, **signature**.
  - Validation checks: signature chains to a **trusted root**, **not expired**, **domain matches SAN**, **not revoked** (CRL / OCSP).
  - Failure cases: self-signed/untrusted issuer, expired, **hostname mismatch**, revoked, broken chain (missing intermediate).
- **State machine (validation pipeline):** receive chain → validate leaf (dates, hostname) → verify signature against issuer → walk up to next issuer → terminate at trusted root? → **trusted / untrusted** (fails at the specific broken step).
- **Interaction model:** Pick a site cert; "Validate" steps up the chain leaf→intermediate→root, checking each link; toggle failure scenarios (expire the leaf, drop the intermediate, use an untrusted root, mismatch the hostname) and watch validation fail at the exact step with the matching browser warning.
- **Visual layout:** A vertical stack of 3 certificate cards (Root at top with a "trust anchor," Intermediate, Leaf at bottom) connected by "signs" arrows; each card shows Subject / Issuer / validity; a padlock that turns green (valid) or red (broken link highlighted); a browser address-bar mockup showing secure vs warning.
- **Scope boundaries:** 3-tier chain; simplified revocation check; skip Certificate Transparency and key-usage extension detail.
- *Suggested metadata:* Security / `#22c55e` / intermediate.

---

## 13. IPv6 Addressing

- **Concept & aha:** IPv6 isn't just "more addresses" — the **prefix + interface-ID
  structure**, the **shorthand rules**, and **SLAAC** mean a device can often configure
  its own globally-unique address with **no DHCP server at all**.
- **Accuracy spec (verify):**
  - **128 bits**, written as 8 groups of 16-bit hex separated by colons (e.g. `2001:0db8:0000:0000:0000:ff00:0042:8329`).
  - Compression: drop **leading zeros** in each group; `::` replaces **one** run of consecutive all-zero groups, usable **only once**.
  - Structure: commonly **/64** — first 64 bits = network prefix (routing prefix + subnet ID), last 64 bits = **interface identifier**.
  - Types by prefix: **Global Unicast `2000::/3`**, **Link-Local `fe80::/10`** (auto, not routed), **Unique Local `fc00::/7`**, **Multicast `ff00::/8`**, **Loopback `::1`**, **Unspecified `::`**. **No broadcast** — replaced by multicast.
  - **SLAAC:** host takes a router-advertised /64 prefix + a generated interface ID → forms a global address without DHCP. **EUI-64**: split the 48-bit MAC, insert **`fffe`** in the middle, flip the **7th bit (U/L)**.
- **State machine:** N/A for addressing; SLAAC has a small flow — Router Solicitation → Router Advertisement → form address → **Duplicate Address Detection (DAD)** — optional to model.
- **Interaction model:** Enter/generate an address; toggle **full ↔ compressed** with the applied rules highlighted; a divider to split prefix vs interface ID at /64; a **type classifier** that lights up based on prefix; a **SLAAC/EUI-64 builder** that takes a MAC + prefix and derives the interface ID and full address step by step.
- **Visual layout:** The address as 8 hex groups, with network-prefix vs interface-ID color-coded; an animation collapsing zero groups into `::`; a type-classifier panel; an EUI-64 builder showing MAC → `fffe` insertion → U/L bit flip.
- **Scope boundaries:** Representation + types + SLAAC/EUI-64; skip DHCPv6, full routing, and transition mechanisms (6to4 / NAT64).
- *Suggested metadata:* Layer 3 / `#06b6d4` / intermediate.

---

## Build order suggestion (once specs are approved)

Group by reusable scaffolding so each build accelerates the next:

1. **Step-through protocol ladders:** DHCP, TLS 1.3 (shared sequence-diagram component).
2. **Live transformation/computation:** Hashing & Salting, IPv6 Addressing, Diffie–Hellman (shared input→derived-output + tested `lib/` modules).
3. **Topology + animated traffic:** VLAN, STP, Traceroute (extend the existing canvas pattern).
4. **Attack/defense scenarios:** Port Scanning, DDoS, SQL Injection, XSS, PKI (shared attacker/target/toggle-mitigation layout).

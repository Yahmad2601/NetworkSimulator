// Pure SQL-injection demo model. A focused evaluator for the canonical teaching
// cases (auth bypass via tautology / comment) — NOT a real SQL engine. No React,
// so it is fully unit-testable (see sqli.test.ts). Educational use only.

export interface DemoUser {
  username: string;
  password: string;
}

export const DEMO_USERS: DemoUser[] = [
  { username: "admin", password: "S3cr3t!" },
  { username: "alice", password: "wonderland" },
];

export const PARAM_QUERY = "SELECT * FROM users WHERE username = ? AND password = ?";

export function buildConcatQuery(username: string, password: string): string {
  return `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
}

/**
 * Recognises the classic injection shapes a beginner needs to see: breaking out
 * of the quoted string and then either a tautology (OR 1=1) or a comment (--).
 */
export function detectInjection(input: string): boolean {
  const breaksOut = input.includes("'");
  if (!breaksOut) return false;
  const hasComment = input.includes("--") || input.includes("#");
  const hasTautology =
    /'\s*or\s*'?\d+'?\s*=\s*'?\d+'?/i.test(input) || /\bor\s+'?[^']+'?\s*=\s*'?[^']+'?/i.test(input);
  return hasComment || hasTautology;
}

export interface SqlResult {
  query: string;
  parameterized: boolean;
  injected: boolean;
  authenticated: boolean;
  matchedUser: string | null;
  rowsReturned: number;
}

export function evaluateLogin(
  username: string,
  password: string,
  parameterized: boolean,
  users: DemoUser[] = DEMO_USERS,
): SqlResult {
  // Parameterized: the input is bound as data and can never change the query shape.
  if (parameterized) {
    const match = users.find((u) => u.username === username && u.password === password);
    return {
      query: PARAM_QUERY,
      parameterized: true,
      injected: false,
      authenticated: Boolean(match),
      matchedUser: match?.username ?? null,
      rowsReturned: match ? 1 : 0,
    };
  }

  const injected = detectInjection(username) || detectInjection(password);
  if (injected) {
    const tautology = /'?\d+'?\s*=\s*'?\d+'?/i.test(username + password);
    const named = users.find((u) => username.startsWith(u.username));
    const user = named ?? users[0];
    return {
      query: buildConcatQuery(username, password),
      parameterized: false,
      injected: true,
      authenticated: true,
      matchedUser: user.username,
      rowsReturned: tautology ? users.length : 1,
    };
  }

  const match = users.find((u) => u.username === username && u.password === password);
  return {
    query: buildConcatQuery(username, password),
    parameterized: false,
    injected: false,
    authenticated: Boolean(match),
    matchedUser: match?.username ?? null,
    rowsReturned: match ? 1 : 0,
  };
}

/** Local PG fetch agent — runs patchright on the admin's machine. */
export const PG_FETCH_AGENT_PORT = 3921;

export const PG_FETCH_AGENT_DEFAULT_URL = `http://127.0.0.1:${PG_FETCH_AGENT_PORT}`;

export function getPgFetchAgentUrl(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_PG_FETCH_AGENT_URL?.trim() || PG_FETCH_AGENT_DEFAULT_URL
    );
  }
  return process.env.PG_FETCH_AGENT_URL?.trim() || PG_FETCH_AGENT_DEFAULT_URL;
}

/** Origins allowed to call the local agent (Private Network Access). */
export const PG_FETCH_AGENT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://homeup-sg.vercel.app",
  "https://www.homeup.sg",
  "https://homeup.sg",
];

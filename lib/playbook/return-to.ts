export const PLAYBOOK_RETURN_KEY = "homeup-playbook-return";
export const PLAYBOOK_RESTORE_PENDING_KEY = "homeup-playbook-restore-pending";

export type PlaybookReturnState = {
  scrollY: number;
  pathname: string;
  hash: string;
};

export function savePlaybookReturn(): void {
  if (typeof window === "undefined") return;
  const state: PlaybookReturnState = {
    scrollY: window.scrollY,
    pathname: window.location.pathname,
    hash: window.location.hash,
  };
  sessionStorage.setItem(PLAYBOOK_RETURN_KEY, JSON.stringify(state));
}

export function markPlaybookRestorePending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLAYBOOK_RESTORE_PENDING_KEY, "1");
}

export function readPlaybookReturn(): PlaybookReturnState | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PLAYBOOK_RETURN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlaybookReturnState;
  } catch {
    return null;
  }
}

export function clearPlaybookReturn(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PLAYBOOK_RETURN_KEY);
  sessionStorage.removeItem(PLAYBOOK_RESTORE_PENDING_KEY);
}

export function consumePlaybookRestore(): PlaybookReturnState | null {
  if (typeof window === "undefined") return null;
  if (sessionStorage.getItem(PLAYBOOK_RESTORE_PENDING_KEY) !== "1") return null;

  sessionStorage.removeItem(PLAYBOOK_RESTORE_PENDING_KEY);
  const state = readPlaybookReturn();
  sessionStorage.removeItem(PLAYBOOK_RETURN_KEY);
  return state;
}

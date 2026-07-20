import { API_BASE_URL } from "./oidc";

export interface EsignetSession {
  sub: string | null;
  // Whatever claims the user consented to during login — verbatim, keyed by
  // OIDC claim name (name, picture, birthdate, gender, phone_number, address,
  // individual_id, ...). Render generically; don't assume which keys exist.
  profile: Record<string, unknown>;
}

/**
 * Asks the backend whether the current cookie is a valid session and, if so,
 * what to display. Returns null for "not authenticated" rather than
 * throwing — that's an expected, common outcome here, not an error.
 */
export async function fetchSession(): Promise<EsignetSession | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    cache: "no-store",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`session check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Real browser navigation, not a fetch: the backend's logout route ends in a
 * redirect to /login, which only takes effect on an actual navigation.
 */
export function logout() {
  window.location.href = `${API_BASE_URL}/api/auth/esignet/logout`;
}

export interface EsignetConfig {
  authorizeUri: string;
  redirect_uri: string;
  client_id: string;
  scope: string;
  response_type: string;
  acr_values: string;
  ui_locales: string;
}

export const esignetConfig: EsignetConfig = {
  authorizeUri:
    import.meta.env.VITE_ESIGNET_AUTHORIZE_URI ||
    "https://esignet.benin.mosip.net/authorize",
  redirect_uri: import.meta.env.VITE_ESIGNET_REDIRECT_URI || "",
  client_id: import.meta.env.VITE_ESIGNET_CLIENT_ID || "",
  scope: import.meta.env.VITE_ESIGNET_SCOPE || "openid profile",
  response_type: "code",
  acr_values: import.meta.env.VITE_ESIGNET_ACR_VALUES || "",
  ui_locales: "fr",
};

export const isEsignetConfigured = Boolean(
  esignetConfig.client_id && esignetConfig.redirect_uri && esignetConfig.scope,
);

export interface EsignetAuthPreparation {
  state: string;
  nonce: string;
}

// Empty by default so local dev/Docker Compose keep hitting the same-origin
// `/api/*` proxy (vite.config.js / nginx.conf). Render's frontend and backend
// are two independent services with no proxy between them, so the production
// build sets this to the backend's full origin (e.g. via render.yaml) and
// calls it directly, cross-origin.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Asks the backend to mint a fresh state/nonce pair for the upcoming eSignet
 * login, so replay/CSRF validation happens server-side against a value the
 * client never gets to choose itself.
 */
export async function prepareEsignetAuth(): Promise<EsignetAuthPreparation> {
  const response = await fetch(`${API_BASE_URL}/api/auth/esignet/prepare`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`eSignet prepare request failed: ${response.status}`);
  }

  return response.json();
}
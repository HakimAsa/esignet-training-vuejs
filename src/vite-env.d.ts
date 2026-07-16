/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ESIGNET_CLIENT_ID: string;
  readonly VITE_ESIGNET_REDIRECT_URI: string;
  readonly VITE_ESIGNET_AUTHORIZE_URI: string;
  readonly VITE_ESIGNET_SCOPE: string;
  readonly VITE_ESIGNET_ACR_VALUES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

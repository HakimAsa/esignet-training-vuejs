<script setup>
import { onMounted, ref } from "vue";
import {
  esignetConfig,
  isEsignetConfigured,
  prepareEsignetAuth,
} from "./config/oidc";

const ESIGNET_PLUGIN_URL =
  "https://esignet.benin.mosip.net/plugins/sign-in-button-plugin.js";

const pluginStatus = ref("");
const esignetButtonHost = ref(null);

function loadEsignetPlugin() {
  return new Promise((resolve, reject) => {
    if (window.SignInWithEsignetButton?.init) {
      resolve(window.SignInWithEsignetButton);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${ESIGNET_PLUGIN_URL}"]`,
    );
    if (existingScript) {
      existingScript.addEventListener("load", () =>
        resolve(window.SignInWithEsignetButton),
      );
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = ESIGNET_PLUGIN_URL;
    script.async = true;
    script.onload = () => resolve(window.SignInWithEsignetButton);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function renderEsignetButton() {
  if (!esignetButtonHost.value) return;
  esignetButtonHost.value.innerHTML = "";

  if (!isEsignetConfigured) {
    pluginStatus.value =
      "Configuration eSignet manquante: renseigne VITE_ESIGNET_CLIENT_ID et VITE_ESIGNET_REDIRECT_URI.";
    return;
  }

  pluginStatus.value = "Chargement du bouton eSignet...";

  try {
    const [plugin, { state, nonce }] = await Promise.all([
      loadEsignetPlugin(),
      prepareEsignetAuth(),
    ]);
    await plugin.init({
      signInElement: esignetButtonHost.value,
      oidcConfig: {
        ...esignetConfig,
        state,
        nonce,
        prompt: "consent",
      },
      buttonConfig: {
        type: "standard",
        theme: "filled_orange",
        shape: "soft_edges",
        labelText: "Continuer avec eSignet",
        width: "100%",
      },
    });
    pluginStatus.value = "";
  } catch {
    pluginStatus.value =
      "Impossible de charger le bouton eSignet pour le moment.";
  }
}

onMounted(renderEsignetButton);
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a
        class="brand-link"
        href="/"
        aria-label="Accueil ANIP eServices"
      >
        <img
          alt="ANIP"
          src="/assets/opensilogo.jpeg"
        />
      </a>
      <button
        class="menu-button"
        type="button"
        aria-label="Menu"
      ></button>
    </header>

    <section
      class="auth-layout"
      aria-labelledby="form-title"
    >
      <div class="panel panel-info">
        <div class="info-content">
          <h1 id="form-title">Bienvenue sur eServices OPENSI</h1>
          <p>
            Connectez-vous en toute sécurité avec votre identité numérique pour
            accéder à vos services en ligne.
          </p>
        </div>
      </div>

      <div
        class="divider"
        aria-hidden="true"
      ></div>

      <div class="panel panel-action">
        <div class="esignet-box">
          <div
            ref="esignetButtonHost"
            class="esignet-plugin"
          ></div>
          <small v-if="pluginStatus">{{ pluginStatus }}</small>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div>
        <strong>Eservices</strong>
        <p>
          Des preoccupations ?
          <a href="mailto:support@anip.bj">Contactez notre support</a>
        </p>
        <p>
          <a href="https://www.anip.bj/privacy">Politique de confidentialite</a>
        </p>
      </div>
      <span>© 2026 OPENSI</span>
    </footer>
  </main>
</template>

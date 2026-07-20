<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchSession, logout } from "../config/session";

// Friendly labels for the claim names eSignet is known to send (see the ANIP
// integration guide's "Mapping applicatif" table). Anything else consented
// that isn't in this list still displays, just under its raw claim name —
// new claim types need no code change here.
const CLAIM_LABELS = {
  name: "Nom complet",
  birthdate: "Date de naissance",
  gender: "Genre",
  phone_number: "Numéro de téléphone",
  email: "Adresse e-mail",
  address: "Adresse",
  individual_id: "Identifiant individuel",
};

const router = useRouter();
const loading = ref(true);
const profile = ref(null);

// name/picture get their own prominent spot in the template; everything else
// in "profile" is listed generically below.
const otherClaims = computed(() => {
  if (!profile.value) return [];
  return Object.entries(profile.value)
    .filter(([key, value]) => key !== "name" && key !== "picture" && value != null && value !== "")
    .map(([key, value]) => ({
      key,
      label: CLAIM_LABELS[key] ?? key,
      value,
    }));
});

onMounted(async () => {
  try {
    const session = await fetchSession();
    if (!session) {
      router.replace({ path: "/login", query: { esignet_required: "1" } });
      return;
    }
    profile.value = session.profile ?? {};
  } finally {
    loading.value = false;
  }
});
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
        class="logout-button"
        type="button"
        @click="logout"
      >
        Déconnexion
      </button>
    </header>

    <section
      v-if="loading"
      class="dashboard-loading"
    >
      <p>Chargement de votre espace...</p>
    </section>

    <section
      v-else
      class="auth-layout"
      aria-labelledby="dashboard-title"
    >
      <div class="panel panel-info dashboard-profile">
        <img
          v-if="profile.picture"
          class="profile-picture"
          :src="profile.picture"
          alt="Photo de profil"
        />
        <div class="info-content">
          <h1 id="dashboard-title">
            {{ profile.name || "Utilisateur eSignet" }}
          </h1>
          <p>Connexion eSignet validée. Informations consenties chargées.</p>
        </div>
      </div>

      <div
        class="divider"
        aria-hidden="true"
      ></div>

      <div class="panel panel-action">
        <h2>Mes données</h2>
        <dl
          v-if="otherClaims.length"
          class="claims-list"
        >
          <template
            v-for="claim in otherClaims"
            :key="claim.key"
          >
            <dt>{{ claim.label }}</dt>
            <dd>{{ claim.value }}</dd>
          </template>
        </dl>
        <p v-else>Aucun autre attribut partagé pour cette connexion.</p>
      </div>
    </section>

    <footer class="site-footer">
      <div>
        <strong>Eservices</strong>
        <p>
          Des preoccupations ?
          <a href="mailto:support@anip.bj">Contactez notre support</a>
        </p>
      </div>
      <span>© 2026 OPENSI</span>
    </footer>
  </main>
</template>

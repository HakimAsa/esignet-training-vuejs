<script setup>
import confetti from "canvas-confetti";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchSession, logout } from "../config/session";

// Friendly labels + icons for the claim names eSignet is known to send (see
// the ANIP integration guide's "Mapping applicatif" table). Anything else
// consented that isn't in this list still displays, under its raw claim name
// and a generic icon — new claim types need no code change here.
const CLAIM_META = {
  birthdate: { label: "Date de naissance", icon: "calendar" },
  gender: { label: "Genre", icon: "person" },
  phone_number: { label: "Numéro de téléphone", icon: "phone" },
  email: { label: "Adresse e-mail", icon: "mail" },
  address: { label: "Adresse", icon: "pin" },
  individual_id: { label: "Identifiant individuel", icon: "id" },
};
const DEFAULT_ICON = "info";

const ICONS = {
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 10h4M15 14h4M5 16.5c.8-1.5 2.2-2.5 4-2.5s3.2 1 4 2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
};

// eSignet sends the literal string "nan" (not null/absent) for some
// unconsented or unavailable optional claims — verified against real logins.
// Treat that, and other common placeholder junk, as "no value" rather than
// displaying it.
const PLACEHOLDER_VALUES = new Set(["nan", "null", "undefined", "none", ""]);
function isRealValue(value) {
  if (value == null) return false;
  return !PLACEHOLDER_VALUES.has(String(value).trim().toLowerCase());
}

const router = useRouter();
const loading = ref(true);
const profile = ref(null);
const cardsVisible = ref(false);

// name/picture get their own prominent spot in the template; everything else
// in "profile" is listed generically below.
const otherClaims = computed(() => {
  if (!profile.value) return [];
  return Object.entries(profile.value)
    .filter(([key, value]) => key !== "name" && key !== "picture" && isRealValue(value))
    .map(([key, value]) => ({
      key,
      label: CLAIM_META[key]?.label ?? key,
      icon: ICONS[CLAIM_META[key]?.icon ?? DEFAULT_ICON],
      value,
    }));
});

function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#21c37a", "#ee7c1e", "#073d69", "#ffffff"];
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.3 }, colors });
  confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.4 }, colors });
  confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.4 }, colors });
}

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

  if (profile.value) {
    requestAnimationFrame(() => {
      cardsVisible.value = true;
      celebrate();
    });
  }
});
</script>

<template>
  <main class="page-shell dashboard-page">
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
      class="dashboard-content"
    >
      <div
        class="profile-hero"
        :class="{ 'is-visible': cardsVisible }"
      >
        <img
          v-if="profile.picture"
          class="profile-picture"
          :src="profile.picture"
          alt="Photo de profil"
        />
        <div
          v-else
          class="profile-picture profile-picture--placeholder"
          aria-hidden="true"
        >
          {{ (profile.name || "?").charAt(0) }}
        </div>
        <h1>{{ profile.name || "Utilisateur eSignet" }}</h1>
        <span class="verified-badge">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
          Connexion eSignet vérifiée
        </span>
      </div>

      <div class="claims-panel">
        <h2>Mes données</h2>
        <ul
          v-if="otherClaims.length"
          class="claims-grid"
        >
          <li
            v-for="(claim, index) in otherClaims"
            :key="claim.key"
            class="claim-card"
            :class="{ 'is-visible': cardsVisible }"
            :style="{ transitionDelay: `${index * 70}ms` }"
          >
            <svg
              class="claim-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              v-html="claim.icon"
            ></svg>
            <div>
              <p class="claim-label">{{ claim.label }}</p>
              <p class="claim-value">{{ claim.value }}</p>
            </div>
          </li>
        </ul>
        <p
          v-else
          class="no-claims"
        >
          Aucun autre attribut partagé pour cette connexion.
        </p>
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

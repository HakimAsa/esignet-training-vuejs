import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import Login from "../views/Login.vue";

// Access control for /dashboard lives in Dashboard.vue's onMounted (it calls
// GET /api/auth/me and redirects to /login if unauthenticated) rather than
// here, since Vue tears down and remounts the component on every navigation
// to this route anyway — a separate guard would just be a second, redundant
// network call for the same check.
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/login" },
    { path: "/login", name: "login", component: Login },
    { path: "/dashboard", name: "dashboard", component: Dashboard },
  ],
});

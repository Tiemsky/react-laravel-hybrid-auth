# LeyInvest — Documentation Auth Frontend

> Guide complet pour implémenter et comprendre le système d'authentification hybride
> Backend : Laravel Sanctum · Frontend : React · Environnements : Local, Staging, Production

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture des environnements](#2-architecture-des-environnements)
3. [Installation et configuration](#3-installation-et-configuration)
4. [Structure des fichiers](#4-structure-des-fichiers)
5. [Flux d'authentification classique](#5-flux-dauthentification-classique)
6. [Flux Google OAuth](#6-flux-google-oauth)
7. [Système de refresh token](#7-système-de-refresh-token)
8. [Remember Me](#8-remember-me)
9. [Le mode local-dev](#9-le-mode-local-dev)
10. [Référence des hooks et contexte](#10-référence-des-hooks-et-contexte)
11. [Référence API](#11-référence-api)
12. [Gestion des erreurs](#12-gestion-des-erreurs)
13. [Checklist d'intégration](#13-checklist-dintégration)
14. [FAQ et problèmes courants](#14-faq-et-problèmes-courants)

---

## 1. Vue d'ensemble

### Ce que fait le système

| Fonctionnalité      | Détail                                                                |
| ------------------- | --------------------------------------------------------------------- |
| Login classique     | Email + password → access token + refresh token                       |
| Login Google        | OAuth 2.0 via flow sécurisé temp_code                                 |
| Access token        | Bearer JWT, durée **15 minutes**                                      |
| Refresh token       | Rotation automatique, durée **24h** ou **30 jours** (Remember Me)     |
| Stockage web        | Access token en **mémoire JS** — Refresh token en **cookie HttpOnly** |
| Stockage local-dev  | Access token en **mémoire JS** — Refresh token en **localStorage**    |
| Refresh automatique | Intercepteur Axios — transparent pour l'utilisateur                   |
| Protection XSS      | Cookie HttpOnly inaccessible au JavaScript en production              |

### Pourquoi deux stockages différents ?

```
PRODUCTION / STAGING (staging.app)
  └── Refresh token → Cookie HttpOnly sur .leyinvest.com
        ✅ Inaccessible au JavaScript
        ✅ Envoyé automatiquement par le navigateur
        ✅ Survive au reload de page

LOCAL DEV (localhost:8080 ou localhost:8085)
  └── Refresh token → localStorage
        ⚠️  Raison : le cookie .leyinvest.com ne peut JAMAIS être reçu
             sur localhost — règle physique du navigateur, non contournable
        ✅  Acceptable en développement uniquement
        ⚠️  Ne survive pas au reload (comportement attendu en dev)
```

---

## 2. Architecture des environnements

### URLs par environnement

| Environnement  | Backend                 | Frontend                           |
| -------------- | ----------------------- | ---------------------------------- |
| **Local dev**  | `http://localhost:8000` | `http://localhost:8080` ou `:8085` |
| **Staging**    | `https://staging.api`   | `https://staging.app`              |
| **Production** | `https://api`           | `https://app`                      |

### Règle importante pour le développement local

> **Le frontend local (`localhost:8080`) pointe vers le backend STAGING**
> (`https://staging.api`), pas vers un backend local.

Cela signifie que tu travailles toujours contre des données de staging.
Configure ton `.env` React ainsi :

```env
# .env.local (frontend)
VITE_API_URL={{url}}/api/v1
```

---

## 3. Installation et configuration

### Dépendances

```bash
npm install axios
```

C'est la **seule dépendance externe** ajoutée. Tout le reste est React natif.

### Variables d'environnement React

Crée ces fichiers à la racine de ton projet React :

**`.env.local`** — développement local (frontend → staging backend)

```env
VITE_API_URL={{url}}/api/v1
```

**`.env.staging`** — frontend staging en ligne

```env
VITE_API_URL={{url}}/api/v1
```

**`.env.production`** — frontend production

```env
VITE_API_URL={{url}}/api/v1
```

### Configuration Vite (`vite.config.js`)

Si tu rencontres des problèmes CORS en local, ajoute ce proxy :

```js
export default {
  server: {
    port: 8080,
    // Pas de proxy nécessaire — le backend staging accepte localhost:8080
  },
};
```

---

## 4. Structure des fichiers

```
src/
├── api/
│   ├── axios.js              ← Instance Axios + intercepteurs (NE PAS MODIFIER)
│   ├── authApi.js            ← Tous les appels auth
│   └── index.js              ← Barrel export
│
├── contexts/
│   └── AuthContext.jsx       ← State global (user, login, logout, Google)
│
├── hooks/
│   ├── useAuth.js            ← Hook pour consommer AuthContext
│   └── useTokenCountdown.js  ← Timer countdown access token
│
├── pages/
│   ├── LoginPage.jsx         ← Page de connexion
│   ├── DashboardPage.jsx     ← Page protégée
│   └── GoogleCallbackPage.jsx ← Gère le retour Google OAuth
│
├── components/
│   ├── ui/
│   │   ├── Spinner.jsx
│   │   ├── ErrorBanner.jsx
│   │   └── LoadingScreen.jsx
│   ├── auth/
│   │   └── LoginForm.jsx     ← Formulaire + bouton Google
│   └── dashboard/
│       ├── Topbar.jsx
│       ├── TokenBadge.jsx
│       ├── MetricsGrid.jsx
│       ├── SessionCard.jsx
│       └── ActivityList.jsx
│
├── lib/
│   └── constants.js          ← API_BASE, CLIENT_TYPE, durées token
│
├── App.jsx                   ← Router simple
├── main.jsx                  ← Entry point + AuthProvider
└── index.css                 ← Design system complet
```

### Fichiers à ne jamais modifier directement

- `src/api/axios.js` — contient toute la logique d'intercepteur, modification = risque de casser le refresh automatique
- `src/contexts/AuthContext.jsx` — source de vérité unique pour l'état auth

---

## 5. Flux d'authentification classique

### Diagramme

```
Utilisateur remplit le formulaire
  │
  ▼
LoginForm → useAuth().login(email, password, rememberMe)
  │
  ▼
AuthContext.login()
  │
  ▼
POST /auth/login { email, password, remember_me, X-Client-Type: local-dev|web }
  │
  ├── Succès ──────────────────────────────────────────────────────────────────
  │   │
  │   ├── [WEB - staging/prod]
  │   │   Response: { access_token, expires_in, user }
  │   │   Cookie HttpOnly: refresh_token (automatique)
  │   │   → setAccessToken(access_token) en mémoire
  │   │   → setUser(user)
  │   │
  │   └── [LOCAL-DEV - localhost]
  │       Response: { access_token, refresh_token, expires_in, user }
  │       → setAccessToken(access_token) en mémoire
  │       → setRefreshTokenMem(refresh_token) en localStorage
  │       → setUser(user)
  │
  └── Échec → ValidationException → ErrorBanner affiche le message
```

### Utilisation dans un composant

```jsx
import { useAuth } from "../hooks/useAuth";

function MonComposant() {
  const { user, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login("email@exemple.com", "motdepasse", false);
      // user est maintenant disponible via useAuth()
    } catch (err) {
      // err.response.data.message contient le message Laravel
      console.error(err.response?.data?.message);
    }
  };

  return (
    <div>
      {user ? (
        <>
          <p>Connecté : {user.email}</p>
          <button onClick={() => logout()}>Déconnexion</button>
        </>
      ) : (
        <button onClick={handleLogin}>Se connecter</button>
      )}
    </div>
  );
}
```

### Structure de la réponse login

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "nom": "Doe",
      "prenom": "John",
      "email": "john.doe@exemple.com"
    },
    "access_token": "33|staging_xxxxx",
    "token_type": "Bearer",
    "expires_in": 900,
    "remember_me": false,

    // Présent UNIQUEMENT en local-dev
    "refresh_token": "xxxxxxxxxxxxxxxx"
  }
}
```

---

## 6. Flux Google OAuth

### Diagramme complet

```
[1] Utilisateur clique "Continuer avec Google"
  │
  ▼
initiateGoogleLogin()
  │
  ▼
GET /auth/google/login?frontend_url=http://localhost:8080
  │
  ▼
Backend retourne { url: "https://accounts.google.com/o/oauth2/..." }
  │
  ▼
window.location.href = url  ← Le navigateur quitte React

──────────────────── Google s'ouvre ────────────────────

[2] L'utilisateur s'authentifie sur Google
  │
  ▼
Google redirige vers {{url}}/api/v1/auth/google/callback
  │
  ▼
Backend :
  - Récupère l'utilisateur Google via Socialite
  - Crée ou lie le compte
  - Génère un temp_code (64 chars, SHA-256, 5min, usage unique)
  - Redirect vers {{url}}/auth/google/callback?code=TEMP_CODE
  │
  ▼
[3] GoogleCallbackPage se monte (React reprend la main)
  │
  ▼
Extrait ?code= de l'URL
  │
  ▼
loginWithGoogle(code)
  │
  ▼
POST /auth/google/exchange { code: "TEMP_CODE" }
  │
  ▼
Backend :
  - Vérifie le code (non utilisé, non expiré)
  - Révoque le code immédiatement (one-time use)
  - Retourne access_token + refresh_token

──────────────────── Même logique que login classique ────

[4] Redirect vers /dashboard
     ou /complete-profile si new_user=true
```

### Pourquoi le temp_code et pas le token directement en URL ?

Le token directement en URL (`?token=xxxxx`) apparaît dans :

- Les **logs du serveur web** (nginx, Apache)
- L'**historique du navigateur**
- Les **headers Referer** envoyés aux scripts tiers

Le `temp_code` est inoffensif car il expire en **5 minutes** et ne peut être utilisé **qu'une seule fois**.

### Route React à configurer

La `GoogleCallbackPage` doit être accessible sur `/auth/google/callback`.
Dans `App.jsx`, cette route est détectée par `window.location.pathname` :

```jsx
// App.jsx
if (path === "/auth/google/callback") {
  return <GoogleCallbackPage />;
}
```

Si tu utilises **React Router**, adapte ainsi :

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/dashboard" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### Cas nouveau utilisateur Google

Si `new_user=true` dans l'URL ou `user.registration_completed === false`,
l'utilisateur doit compléter son profil (étape 2 d'inscription).

---

## 7. Système de refresh token

### Comment ça fonctionne (transparent pour l'utilisateur)

```
Requête normale (Axios)
  │
  ├── Access token valide → OK, réponse retournée
  │
  ├── Header X-Token-Expires-Soon: true reçu
  │   → Refresh silencieux déclenché en arrière-plan (2min avant expiration)
  │   → L'utilisateur ne voit rien
  │
  └── Réponse 401 reçue (token expiré)
      │
      ├── Refresh en cours ? → Mise en file d'attente
      │   → Attend le refresh puis rejoue la requête
      │
      └── Pas de refresh en cours → Lance le refresh
          │
          ├── [WEB] POST /auth/refresh-token (cookie envoyé automatiquement)
          │
          └── [LOCAL-DEV] POST /auth/refresh-token { refresh_token: localStorage }
              │
              ├── Succès → nouveau access_token stocké en mémoire
              │            nouveau refresh_token en localStorage (rotation)
              │            requête originale rejouée → transparent
              │
              └── Échec → clearToken() → event "auth:session-expired"
                          → AuthContext écoute → logout() → page login
```

### File d'attente des requêtes concurrentes

Si 5 requêtes partent simultanément et toutes reçoivent un 401 :

```
Requête 1 → 401 → Lance le refresh (isRefreshing = true)
Requête 2 → 401 → Mise en file d'attente
Requête 3 → 401 → Mise en file d'attente
Requête 4 → 401 → Mise en file d'attente
Requête 5 → 401 → Mise en file d'attente
  │
  ▼
Refresh réussit → processQueue() débloque les 4 en attente
  │
  ▼
Toutes les 5 requêtes rejouées avec le nouveau token → aucune erreur visible
```

### Faire un appel API dans tes composants

Toujours utiliser `axiosInstance` (jamais `fetch` ou `axios` directement) :

```js
// ✅ Correct — l'intercepteur gère le refresh automatiquement
import { axiosInstance } from "../api";

const fetchPortfolio = async () => {
  const { data } = await axiosInstance.get("/portfolio");
  return data;
};
```

### Timer du countdown token (optionnel)

```jsx
import { useTokenCountdown } from "../hooks/useTokenCountdown";

function TokenBadge() {
  const { display, status } = useTokenCountdown();
  // display = "14:32" (minutes:secondes)
  // status  = "ok" | "warning" (2min) | "danger" (1min)

  return (
    <div className={`token-badge ${status}`}>Token expire dans {display}</div>
  );
}
```

---

## 8. Remember Me

### Comportement

|                      | Sans Remember Me                  | Avec Remember Me        |
| -------------------- | --------------------------------- | ----------------------- |
| Durée refresh token  | **24 heures**                     | **30 jours**            |
| Cookie navigateur    | Session (supprimé à la fermeture) | Persistant 30 jours     |
| Utilisateur actif    | Auto-refresh toutes les 15min ✅  | Idem ✅                 |
| Fermeture navigateur | Déconnecté à la réouverture       | Reste connecté 30 jours |

### Utilisation

```jsx
// Dans LoginForm, la checkbox envoie remember_me au login
await login(email, password, rememberMe); // rememberMe = true/false
```

> **Note local-dev** : Remember Me n'a pas d'effet persistant en local car
> le refresh token est en localStorage et vidé manuellement au logout.
> Le comportement correct est visible uniquement en staging/production.

---

## 9. Le mode local-dev

### Détection automatique

Le mode est détecté automatiquement dans `axios.js` :

```js
const isLocalDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Header envoyé automatiquement
const effectiveClientType = isLocalDev ? "local-dev" : "web";
```

**Tu n'as rien à configurer.** Si tu es sur `localhost`, le mode s'active seul.

### Ce qui change en local-dev

|                        | Web (staging/prod) | Local-dev                    |
| ---------------------- | ------------------ | ---------------------------- |
| Header `X-Client-Type` | `web`              | `local-dev`                  |
| Refresh token          | Cookie HttpOnly    | JSON response                |
| Stockage refresh       | Cookie navigateur  | `localStorage`               |
| Persist au reload      | ✅ Oui             | ❌ Non (reconnexion requise) |
| Sécurité XSS           | ✅ Maximale        | ⚠️ Dev only                  |

### Inspecter le localStorage en dev

```
Chrome DevTools → Application → Local Storage → localhost
Clé : "leyinvest_dev_rt"
Valeur : [refresh token brut]
```

Pour tester la déconnexion au reload, supprime cette clé manuellement.

---

## 10. Référence des hooks et contexte

### `useAuth()`

```js
const {
  user, // object | null — données utilisateur
  loading, // boolean — true pendant l'init au montage
  login, // (email, password, rememberMe) => Promise
  logout, // (callApi?) => Promise — callApi=false si token déjà invalide
  logoutAll, // () => Promise — révoque tous les appareils
  loginWithGoogle, // (tempCode) => Promise — appelé par GoogleCallbackPage
  initiateGoogleLogin, // () => Promise — redirige vers Google
  isLocalDev, // boolean — true si sur localhost
} = useAuth();
```

### Structure de l'objet `user`

```js
user = {
  id: 1,
  nom: "Doe",
  prenom: "John",
  email: "john.doe@exemple.com",
  avatar: "avatars/xxxxx.jpg" | null,
  role: "user" | "admin",
  registration_completed: true,
  email_verified: true,
  auth_provider: "email" | "google",
  country: { id: 1, name: "France", code: "FR" } | null,
  activeSubscription: {
    plan: { name: "Premium", features: [...] }
  } | null,
}
```

### `useTokenCountdown()`

```js
const {
  seconds, // number — secondes restantes
  display, // string — "14:32" formaté MM:SS
  status, // "ok" | "warning" | "danger"
  percentage, // number — 0 à 100 (pour une barre de progression)
  reset, // () => void — remet le timer à 15min (appelé après refresh)
} = useTokenCountdown();
```

---

## 11. Référence API

### Endpoints disponibles

#### Auth classique

| Méthode | Endpoint                 | Auth | Description                |
| ------- | ------------------------ | ---- | -------------------------- |
| `POST`  | `/auth/login`            | Non  | Connexion                  |
| `POST`  | `/auth/logout`           | Oui  | Déconnexion                |
| `POST`  | `/auth/logout-all`       | Oui  | Déconnexion tous appareils |
| `POST`  | `/auth/refresh-token`    | Non  | Renouveler l'access token  |
| `GET`   | `/auth/user/me`          | Oui  | Profil utilisateur         |
| `POST`  | `/auth/register`         | Non  | Inscription étape 1        |
| `POST`  | `/auth/complete-profile` | Non  | Inscription étape 2        |
| `POST`  | `/auth/verify-email`     | Non  | Vérifier OTP email         |
| `POST`  | `/auth/resend-code`      | Non  | Renvoyer OTP               |
| `POST`  | `/auth/forgot-password`  | Non  | Mot de passe oublié        |
| `POST`  | `/auth/verify-reset-otp` | Non  | Vérifier OTP reset         |
| `POST`  | `/auth/reset-password`   | Non  | Nouveau mot de passe       |

#### Google OAuth

| Méthode | Endpoint                | Auth | Description                    |
| ------- | ----------------------- | ---- | ------------------------------ |
| `GET`   | `/auth/google/login`    | Non  | Obtenir l'URL Google           |
| `GET`   | `/auth/google/callback` | Non  | Callback Google (backend only) |
| `POST`  | `/auth/google/exchange` | Non  | Échanger le temp_code          |

#### Compte (protégés)

| Méthode  | Endpoint                | Auth | Description             |
| -------- | ----------------------- | ---- | ----------------------- |
| `PUT`    | `/auth/update-profile`  | Oui  | Mettre à jour le profil |
| `POST`   | `/auth/change-password` | Oui  | Changer le mot de passe |
| `POST`   | `/auth/upload-avatar`   | Oui  | Upload avatar           |
| `DELETE` | `/auth/user/me`         | Oui  | Supprimer le compte     |

### Headers requis sur toutes les requêtes

```
Content-Type: application/json
Accept: application/json
X-Client-Type: web | local-dev  ← géré automatiquement par axios.js
Authorization: Bearer {access_token}  ← géré automatiquement par l'intercepteur
```

### Rate limiting

| Groupe | Limite     | Routes                              |
| ------ | ---------- | ----------------------------------- |
| `auth` | 10 req/min | login, register, refresh            |
| `otp`  | 5 req/min  | forgot-password, verify-otp, resend |
| `api`  | 60 req/min | routes protégées                    |

---

## 12. Gestion des erreurs

### Structure des erreurs Laravel

```json
// Erreur de validation (422)
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["Ces informations d'identification ne correspondent pas."],
    "password": ["Le mot de passe est requis."]
  }
}

// Erreur simple (401, 403, 500)
{
  "message": "Unauthenticated."
}
```

### Lire les erreurs dans tes composants

```js
try {
  await login(email, password);
} catch (err) {
  // Message principal
  const message = err.response?.data?.message;

  // Erreur sur un champ spécifique
  const emailError = err.response?.data?.errors?.email?.[0];

  // Status HTTP
  const status = err.response?.status; // 401, 422, 500...
}
```

### Codes d'erreur spéciaux

| Code              | Signification          | Action frontend                                  |
| ----------------- | ---------------------- | ------------------------------------------------ |
| `TOKEN_EXPIRED`   | Access token expiré    | Géré automatiquement par l'intercepteur          |
| `401` sur refresh | Refresh token invalide | Logout forcé → page login                        |
| `422`             | Erreur de validation   | Afficher le message dans le formulaire           |
| `429`             | Rate limit dépassé     | Afficher "Trop de tentatives, attendez 1 minute" |

---

## 13. Checklist d'intégration

### Backend

- [ ] `CORS_ALLOWED_ORIGINS` : (`http://localhost:8080` )
- [ ] `SANCTUM_STATEFUL_DOMAINS` inclut `localhost:8080` et `localhost:8085`
- [ ] `CLIENT_TYPES` dans `.env.staging` inclut `local-dev`
- [ ] Route `POST /auth/google/exchange` ajoutée dans `api.php`
- [ ] Migration `google_auth_codes` exécutée

### Frontend (à faire toi-même)

- [ ] `npm install axios` exécuté
- [ ] `.env.local` créé avec `VITE_API_URL={{url}}/api/v1`
- [ ] `AuthProvider` encapsule toute l'app dans `main.jsx`
- [ ] `axios.js` utilisé pour tous les appels API (pas de `fetch` natif)
- [ ] Route `/auth/google/callback` configurée dans le router
- [ ] `Google Console` → Authorized redirect URIs inclut `{{url}}/api/v1/auth/google/callback`
- [ ] Styles CSS Google (`btn-google`, `auth-divider`) ajoutés dans `index.css`

### Tests à effectuer

- [ ] Login classique → accès dashboard
- [ ] Refresh de page → session restaurée (staging) / redirect login (local-dev attendu)
- [ ] Attendre 15min → refresh automatique transparent
- [ ] Login Google → redirect callback → dashboard
- [ ] Logout → cookie supprimé → redirect login
- [ ] Login avec `remember_me: true` → cookie persistant 30j en staging

---

## 14. FAQ et problèmes courants

### ❓ Je suis déconnecté à chaque reload de page en local

**Normal en local-dev.** Le refresh token est en mémoire JS/localStorage et la session ne persiste pas au reload. En staging et production avec cookie HttpOnly, la session est restaurée automatiquement. Pour tester ce comportement, déploie sur staging.

---

### ❓ Le cookie `refresh_token` est rejeté avec "cross-site context"

Tu utilises probablement un port différent de celui configuré dans `CORS_ALLOWED_ORIGINS`. Vérifie que ton port (`:8080` ou `:8085`) est bien dans la config backend staging.

---

### ❓ `refresh_token` absent de la réponse login en local

Vérifie que tu envoies bien `X-Client-Type: local-dev`. C'est géré automatiquement par `axios.js` si tu es sur `localhost`. Si tu testes avec Postman, ajoute ce header manuellement.

### ❓ Comment tester l'auth sans vrai backend ?

Pour les mocks de développement, intercepte les appels dans `authApi.js` :

```js
// authApi.js — version mock pour tests offline
login: async (email, password) => {
  if (email === "demo@test.com" && password === "password") {
    return { data: { data: { access_token: "mock_token", user: { id: 1, email } } } };
  }
  throw { response: { data: { message: "Identifiants incorrects" } } };
},
```

---

### ❓ Comment ajouter un appel API protégé dans un nouveau composant ?

```js
import { axiosInstance } from "../api";

// Dans un hook custom
export function usePortfolio() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/portfolio")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return data;
}
```

L'intercepteur gère automatiquement le token Bearer et le refresh si besoin.

_Documentation générée pour LeyInvest — Mise à jour : Février 2026_
_Version architecture : 2.0 (Sanctum Hybrid)_

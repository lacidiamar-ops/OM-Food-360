# CLAUDE.md — Bootstrap FOOD PASSPORT 360

> Ce fichier est lu **en premier** à chaque session Claude Code dans ce projet.
> Il définit le contexte, les conventions et l'ordre d'exécution.
> **Ne pas le modifier sans validation explicite du Product Owner.**

---

## 1. Identité du projet

**Nom :** FOOD PASSPORT 360
**Client :** API Restauration (API 05147) — contrat OM PRO
**Mission :** Application 360° reliant joueurs, nutritionniste, restauration, cuisine, team manager et hôtels en déplacement.
**Règle absolue du produit :** Aucune commande joueur ne peut être transmise à la cuisine ou à l'hôtel sans validation nutritionniste préalable. Cette règle est non-négociable et doit être appliquée au niveau base de données (RLS), API et UI.

---

## 2. Lectures préalables OBLIGATOIRES

Avant toute action, lire dans cet ordre :

1. **`docs/SPEC_PRODUIT.md`** — Spécification produit complète (rôles, modules, workflows, tables, sécurité)
2. **`docs/SKILL_FOOD_360.md`** — Direction artistique UI/UX (mobile-first, premium SaaS, thématisable)
3. **`docs/PROTOTYPE_VISUEL.jsx`** — Référence visuelle des 5 vues clés (Joueur, Nutritionniste, Restauration, Cuisine, Hôtel)
4. **Ce fichier `CLAUDE.md`** — conventions et ordre d'exécution

Si l'un de ces fichiers manque, **arrêter et demander** au Product Owner (AMAR13) avant de coder.

---

## 3. Stack technique imposée

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | SSR, PWA, RSC pour perf |
| Styling | **Tailwind CSS + CSS variables** | Thématisable sans réécrire |
| UI primitives | **shadcn/ui** (composants copiés, pas de package figé) | Personnalisation totale |
| Icônes | **lucide-react** | Cohérence + tree-shaking |
| Animations | **Framer Motion** | Micro-interactions premium |
| Backend | **Supabase** (Auth + DB Postgres + Storage + Realtime) | RLS native, multilingue compatible |
| Multilingue UI | **next-intl** | Routes localisées, fallback FR |
| Traduction auto contenu | **DeepL API** (fallback Google Translate) | Qualité FR/IT/EN/ES |
| State serveur | **TanStack Query** | Cache + invalidation |
| Forms | **react-hook-form + zod** | Validation typée |
| Charts | **Recharts** | Dashboards |
| PDF / Excel | **react-pdf** + **SheetJS** | Exports cuisine et hôtel |
| Tests | **Vitest** + **Playwright** | Unit + E2E sur les workflows critiques |
| Déploiement | **Vercel** | Edge functions, prévisualisations PR |

**Versions Node :** 20 LTS minimum. **Package manager :** `pnpm`.

---

## 4. Arborescence du projet

```
food-passport-360/
├── CLAUDE.md                       ← ce fichier (lu en premier)
├── docs/
│   ├── SPEC_PRODUIT.md             ← prompt principal
│   ├── SKILL_FOOD_360.md           ← direction UI/UX
│   ├── PROTOTYPE_VISUEL.jsx        ← référence visuelle
│   ├── SCHEMA_DB.sql               ← schéma Supabase complet
│   ├── RLS_POLICIES.sql            ← politiques RLS par rôle
│   └── ROADMAP.md                  ← suivi phases MVP / 2 / 3
│
├── src/
│   ├── app/                        ← App Router
│   │   ├── [locale]/               ← routes localisées (fr, en, it, es, pt, ar)
│   │   │   ├── (auth)/             ← login, magic link
│   │   │   ├── (joueur)/           ← UI joueur ultra simple
│   │   │   ├── (nutri)/            ← validation nutritionniste
│   │   │   ├── (resto)/            ← dashboard restauration
│   │   │   ├── (cuisine)/          ← production cuisine
│   │   │   ├── (team-manager)/     ← déplacements
│   │   │   ├── (hotel)/            ← portail hôtel limité + temporaire
│   │   │   └── (admin)/            ← super admin
│   │   ├── api/                    ← route handlers (webhooks Supabase, exports PDF)
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                     ← primitives shadcn (Button, Card, Pill, Avatar, etc.)
│   │   ├── shell/                  ← AppShell, TopBar, BottomNav, Sidebar
│   │   ├── domain/                 ← composants métier (QueueCard, ValidationModal, ProductionCard…)
│   │   └── motion/                 ← wrappers Framer Motion réutilisables
│   │
│   ├── lib/
│   │   ├── supabase/               ← clients (server, client, middleware), types générés
│   │   ├── i18n/                   ← config next-intl
│   │   ├── translation/            ← appel DeepL, cache traductions
│   │   ├── rbac/                   ← helpers permissions par rôle
│   │   └── utils/
│   │
│   ├── hooks/                      ← useCurrentRole, useOrders, useValidationQueue…
│   │
│   ├── stores/                     ← stores Zustand (UI state, modale validation)
│   │
│   └── styles/
│       ├── globals.css             ← reset + CSS variables (--primary, --background, etc.)
│       └── tokens.css              ← design tokens centralisés
│
├── messages/                       ← traductions next-intl
│   ├── fr.json                     ← langue source de vérité
│   ├── en.json
│   ├── it.json
│   ├── es.json
│   ├── pt.json
│   └── ar.json
│
├── supabase/
│   ├── migrations/                 ← migrations SQL versionnées
│   ├── seed.sql                    ← données de démo (joueurs fictifs, articles)
│   └── functions/                  ← Edge Functions (notifications, exports)
│
├── tests/
│   ├── e2e/                        ← Playwright — workflows critiques
│   └── unit/                       ← Vitest — RBAC, traduction, validation
│
└── package.json
```

---

## 5. Conventions de code (non négociables)

### 5.1 Couleurs — JAMAIS en dur

❌ **Interdit :**
```tsx
<div className="bg-[#E8C275] text-white">
<div style={{ background: "#0A0B0F" }}>
```

✅ **Obligatoire :**
```tsx
<div className="bg-primary text-primary-foreground">
<div style={{ background: "var(--background)" }}>
```

Tailwind doit lire les variables via `tailwind.config.ts`. Quand Claude Design finalisera la charte, on ne touche QUE `globals.css`.

### 5.2 Multilingue dès le jour 1

❌ **Interdit :**
```tsx
<button>Valider la commande</button>
```

✅ **Obligatoire :**
```tsx
const t = useTranslations("orders");
<button>{t("validate")}</button>
```

Toute chaîne visible par l'utilisateur passe par `next-intl`. Pas d'exception, même pour un placeholder ou un toast.

### 5.3 Validation nutritionniste obligatoire — défense en profondeur

La règle « pas de transmission sans validation » doit être enforcée **à 4 niveaux** :

1. **Base de données** : trigger Postgres qui empêche tout passage de `status` à `transmise_cuisine` ou `transmise_hotel` sans `validated_by_nutri_at IS NOT NULL`
2. **RLS** : les rôles `cuisine` et `hotel` ne voient QUE les commandes où `validated_by_nutri_at IS NOT NULL`
3. **API / Server Actions** : vérification serveur avant tout `update`
4. **UI** : les boutons « transmettre » sont désactivés tant que la validation n'est pas faite

Si Claude Code est tenté de raccourcir cette règle « pour aller plus vite » : **stop, demander confirmation**.

### 5.4 Données sensibles vs opérationnelles

Deux niveaux de visibilité sur la fiche joueur :

- **Opérationnel** (visible cuisine, hôtel, restauration) : allergies utiles, préférences, aliments refusés, habitudes pratiques
- **Sensible** (nutritionniste seul) : poids, objectifs corporels, données médicales, commentaires privés

Implémenté via **deux tables séparées** ou **vues filtrées par rôle**, jamais par un simple `if` côté client.

### 5.5 Audit trail obligatoire

Tables avec audit obligatoire :
- `orders` (chaque changement de statut)
- `order_validation_logs`
- `player_onboarding_history` (chaque modif de fiche)
- `photo_validation_logs`
- `audit_logs` (général)

Aucune suppression définitive sur les entités liées à l'historique. Archive uniquement.

### 5.6 Composants

- **Toujours** TypeScript strict, props typées avec `interface` (pas `type` pour les props)
- **Server Components par défaut**, `"use client"` uniquement si interactivité ou hooks
- **Un composant = un fichier** dans `components/`, exports nommés
- Pas de logique métier dans les composants UI — tout passe par `hooks/` ou `lib/`

### 5.7 Tests sur les workflows critiques

E2E Playwright **obligatoires** sur :
1. Joueur passe une commande → reste en attente nutri (pas transmise)
2. Nutri valide → cuisine voit, hôtel voit
3. Nutri refuse → joueur notifié dans sa langue, cuisine ne voit pas
4. Hôtel hors déplacement actif → 403
5. Accès hôtel expiré → 403

Avant de merger une PR qui touche ces flux, ces tests doivent passer.

---

## 6. Ordre d'exécution — Roadmap MVP

### Semaine 1 — Fondations

```bash
# Init projet
pnpm create next-app@latest food-passport-360 --typescript --tailwind --app --src-dir --import-alias "@/*"
cd food-passport-360

# Stack
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add next-intl
pnpm add framer-motion lucide-react
pnpm add @tanstack/react-query zustand
pnpm add react-hook-form zod @hookform/resolvers
pnpm add recharts

# shadcn
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card dialog sheet badge avatar dropdown-menu

# Supabase local
pnpm add -g supabase
supabase init
supabase start
```

**Livrables semaine 1 :**
- [x] Projet Next.js initialisé avec stack complète
- [ ] CSS variables + Tailwind config thématisable
- [ ] next-intl configuré (FR par défaut, fallback FR)
- [ ] Supabase local + premier schéma (users, profiles, roles)
- [ ] Auth Supabase fonctionnelle (magic link)
- [ ] AppShell + TopBar + BottomNav (style prototype)

### Semaine 2 — RBAC et passeport joueur

- [ ] Tables : `players`, `player_onboarding_forms`, sous-tables préférences
- [ ] RLS par rôle (Joueur voit ses données, Nutri voit tout, Cuisine voit limité)
- [ ] Middleware Next.js qui redirige selon le rôle
- [ ] CRUD fiche joueur (vue Nutri)
- [ ] Vue passeport joueur (Joueur lit, Nutri édite)

### Semaine 3 — Articles et menus

- [ ] Table `articles` avec validation nutri par article
- [ ] CRUD articles (vue Resto + validation Nutri)
- [ ] Tables `menus`, `menu_items`
- [ ] Diffusion menu du jour multilingue

### Semaine 4 — Commandes + validation nutri (LE CŒUR)

- [ ] Workflow commande complet (8 statuts)
- [ ] Trigger Postgres anti-transmission sans validation
- [ ] File de validation nutri avec actions Valider / Ajuster / Refuser / Préciser
- [ ] Notifications temps réel Supabase (le joueur voit son statut)
- [ ] Tests E2E des 5 scénarios critiques

### Semaine 5 — Cuisine + Restauration

- [ ] Vue cuisine (kanban À produire / En cours / Prête)
- [ ] Dashboard restauration avec KPIs
- [ ] Mode impression cuisine
- [ ] Statuts production temps réel

### Semaine 6 — Déplacements + Hôtel

- [ ] Tables `trips`, `hotels`, `rooming`, `hotel_access`
- [ ] Création déplacement (Team Manager)
- [ ] Génération accès hôtel temporaire (token signé, expiration auto)
- [ ] Portail hôtel limité (RLS stricte)

### Semaine 7 — Preuve photo + Feedback

- [ ] Supabase Storage configuré
- [ ] Upload photo avec compression côté client
- [ ] Validation photo (Nutri / Resto / Team Manager)
- [ ] Feedback satisfaction multilingue

### Semaine 8 — Polish + Déploiement MVP

- [ ] Notifications push (PWA)
- [ ] Exports PDF / Excel
- [ ] Audit logs visibles Super Admin
- [ ] Déploiement Vercel + Supabase prod
- [ ] Onboarding du premier nutritionniste réel

**Tout ce qui dépasse la semaine 8 = Phase 2 (Chat Staff, traduction auto contenu, IA recommandations).**

---

## 7. Quality gates

Avant de marquer une fonctionnalité comme « terminée », vérifier :

- [ ] TypeScript build passe sans `any` injustifié
- [ ] Lint propre (`pnpm lint`)
- [ ] Tests Vitest verts pour la logique métier
- [ ] Si workflow critique : test Playwright vert
- [ ] Aucune chaîne en dur (FR uniquement) — tout dans `messages/`
- [ ] Aucune couleur hex en dur dans le composant
- [ ] RLS testée pour chaque rôle qui touche la table
- [ ] Composant responsive testé mobile (375px) et desktop (1280px)
- [ ] Pas de console.log restant
- [ ] Audit log écrit si la fonctionnalité modifie des données sensibles

---

## 8. Ce que tu ne fais PAS sans demander

- **Ne pas** changer la stack (Next.js, Supabase, Tailwind sont fixés)
- **Ne pas** figer une palette de couleurs (Claude Design s'en occupe ensuite)
- **Ne pas** supprimer de données — toujours archiver
- **Ne pas** bypasser la validation nutritionniste, même temporairement
- **Ne pas** afficher des données sensibles à un rôle non autorisé, même en dev
- **Ne pas** committer de clés API ou secrets — `.env.local` uniquement, jamais dans Git
- **Ne pas** déployer en prod sans validation explicite
- **Ne pas** installer une lib hors stack sans poser la question (justifier le besoin)
- **Ne pas** modifier `CLAUDE.md`, `SPEC_PRODUIT.md` ou `SKILL_FOOD_360.md` sans validation
- **Ne pas** générer de données joueur réelles dans le seed — utiliser des noms fictifs

---

## 9. Communication avec le Product Owner

Le Product Owner travaille en français, dans un environnement opérationnel (pas une équipe d'ingés à temps plein). Donc :

- **Réponses courtes et terrain.** Pas de jargon gratuit.
- **Toujours montrer ce qui a été fait** (capture d'écran, lien preview Vercel) plutôt que décrire.
- **Toujours proposer la prochaine étape** à la fin d'un livrable.
- **En cas de doute produit**, demander avant de coder — ne pas inventer une règle métier.
- **En cas de blocage technique**, proposer 2-3 options avec arbitrage (perf, complexité, délai).

---

## 10. Commandes de référence

```bash
# Dev
pnpm dev                          # Next.js dev server
supabase start                    # Supabase local
supabase db reset                 # reset DB local + applique migrations + seed

# Génération types Supabase (à relancer après chaque migration)
supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Tests
pnpm test                         # Vitest
pnpm test:e2e                     # Playwright

# Migrations
supabase migration new <nom>      # créer une migration
supabase db push                  # push vers remote

# Déploiement
vercel                            # preview
vercel --prod                     # prod (validation requise)
```

---

## 11. Premier message à Claude Code en démarrage de session

Quand AMAR13 ouvre une nouvelle session, premier message attendu côté Claude Code :

> « Bonjour. J'ai lu CLAUDE.md, SPEC_PRODUIT.md et SKILL_FOOD_360.md. On en est à la **[semaine X]** de la roadmap, prochaine étape : **[tâche]**. Est-ce qu'on attaque ça, ou tu as une priorité différente aujourd'hui ? »

---

*Dernière mise à jour : ce fichier vit avec le projet. Ajouter une ligne dans `docs/ROADMAP.md` à chaque modification structurante.*

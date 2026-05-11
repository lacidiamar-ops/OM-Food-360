# ROADMAP — FOOD PASSPORT 360

> État exact du projet pour reprendre proprement après chaque session.
> Mis à jour à la fin de chaque livrable.
> **Branche de dev :** `claude/audit-repo-structure-09qyE` (toujours synchro avec `origin`).

---

## Dernière session

**Date de la dernière mise à jour** : 2026-05-11
**Dernier commit poussé** : `8cdaa94 test(integration): 5 scénarios critiques CLAUDE.md §5.7`

---

## Phase 1 — MVP (8 semaines)

### Semaine 1 — Fondations ✅ TERMINÉ
- Stack Next.js 15 + Supabase + Tailwind + shadcn + next-intl
- AppShell + TopBar + BottomNav + Sidebar (mobile-first)
- Supabase magic link auth
- `proxy.ts` (session refresh + locale routing)
- CSS variables thémables (pas de couleur en dur)

### Semaine 2 — RBAC + Passeport joueur ✅ TERMINÉ
- Schéma `food_passport` complet sur Supabase partagé
- 5 migrations appliquées : tables, fonctions, triggers, RLS, vues, indexes, grants
- Types TS générés (`database.types.ts` ENUMs + `food-passport.types.ts` tables)
- `src/middleware.ts` qui wire `proxy.ts` → RBAC actif (redirection rôle après login)
- Layouts par route group `(joueur)/(nutri)/(resto)/(cuisine)/(hotel)/(team-manager)/(admin)`
- Vue passeport joueur (lecture) + fiche d'arrivée nutritionniste (édition)

### Semaine 3 — Articles + Menus ✅ TERMINÉ
- Catalogue articles complet (CRUD resto + validation nutri par article)
- Traductions article par locale (`article_translations`, fallback FR)
- Menus multilingues (création resto, file d'attente publication)
- Vue joueur `/joueur/menu` : menu du jour filtré (actif + validé + non-bloqué + en stock)
- 27 fichiers, ~2500 lignes ajoutées

### Semaine 4 — Commandes + validation nutri ✅ TERMINÉ (en attente merge)

#### ✅ Tout livré dans cette session
1. **Migration `fp360_06_harden_order_validation`** : trigger durci BEFORE INSERT OR UPDATE, 7 statuts gardés
2. **Migration `fp360_07_enable_realtime_orders`** : `food_passport.orders` ajouté à `supabase_realtime`
3. **Migration `fp360_08_fix_log_order_status_trigger`** : bug fix `log_order_status_change` — castait `OLD/NEW.status::text` alors que `from_status`/`to_status` sont `order_status`
4. **`queries.ts` étendu** : 16 helpers nommés (joueur/nutri/resto/cuisine/hotel/audit)
5. **Server Actions Joueur** : `createOrderAction`, `submitOrderAction`, `cancelOrderAction`
6. **Server Actions Nutri** : `validateOrderNutriAction`, `adjustOrderNutriAction`, `refuseOrderNutriAction`, `askPrecisionNutriAction`
7. **UI Joueur** : `/joueur/commander`, `/joueur/orders`, `/joueur/orders/[id]` — mobile-first 3 taps
8. **UI Nutri** : file de validation `/nutri`, détail `/nutri/orders/[id]`, `ValidationModal` + `ArticlePicker`
9. **i18n FR** : namespaces `commander.*`, `orders.*`, `nutriQueue.*` + `getMessageFallback` fallback FR silencieux
10. **Realtime** : `useOrderRealtime(orderId)` + `useOrdersQueueRealtime()` wirés dans les 3 composants concernés
11. **Tests d'intégration Vitest** : 5 scénarios critiques CLAUDE.md §5.7 dans `tests/integration/orders-workflow.test.ts`

#### ⚠️ Action requise avant merge (à faire par AMAR13)
- Vérifier que `food_passport.orders` et `trg_enforce_nutri_validation` existent sur `sbkewkpemakactzfvbzz`
- Si absent : rejouer les migrations 01→08 sur ce projet
- Copier `.env.test.example` → `.env.test` avec les clés de `sbkewkpemakactzfvbzz`
- Lancer `pnpm test:integration` → les 9 assertions doivent passer
- ⚠️ NB : Migrations de cette session appliquées sur `vjulagaprzbnquynwjmt` (MCP) — vérifier cohérence avec `sbkewkpemakactzfvbzz` (projet actif `.env.local`)

### Semaine 5 — Cuisine + Restauration 🔜 À FAIRE
- **Vue cuisine** : kanban 3 colonnes — "À produire" / "En cours" / "Prête"
  - Filtré sur `status IN (transmise_cuisine, en_preparation, prete)` + `validated_by_nutri_at IS NOT NULL`
  - Drag-and-drop entre colonnes OU boutons de transition (option à décider)
  - Realtime : la file se rafraîchit en temps réel
  - Mode impression : vue liste condensée pour affichage cuisine
- **Dashboard restauration** :
  - KPIs du jour : commandes reçues / validées / en prod / livrées
  - Liste des commandes par service (dejeuner/diner/collation)
  - Accès rapide validation articles (file nutri articles)
- **Routes à créer** :
  - `/cuisine` → kanban
  - `/cuisine/orders/[id]` → détail production
  - `/resto/dashboard` → KPIs + liste

### Semaines 6–8 (à venir)
- **Semaine 6** : Déplacements (trips, hotels, rooming, hotel_access avec tokens signés)
- **Semaine 7** : Upload photo article (Storage Supabase) + preuve photo livraison + feedback
- **Semaine 8** : Notifications push (PWA), exports PDF/Excel, audit logs visibles super_admin, déploiement Vercel + Supabase prod, tests Playwright full-browser

---

## Phase 2 (post-MVP)
- **DeepL API** pour traduction auto contenu (articles, notes, commentaires joueur)
- Chat Staff (messagerie entre rôles)
- IA recommandations (suggestions repas selon profil joueur)
- Drag-and-drop pour réorder menus (actuellement flèches up/down)

---

## État technique actuel

### Migrations appliquées (vjulagaprzbnquynwjmt)
| Migration | Description |
|---|---|
| `fp360_01` → `fp360_05` | Schéma complet, RLS, fonctions, triggers, vues, indexes |
| `fp360_06_harden_order_validation` | Trigger durci : BEFORE INSERT OR UPDATE, 7 statuts, `NEW.validated_by_nutri_at` |
| `fp360_07_enable_realtime_orders` | Publication realtime sur `food_passport.orders` |
| `fp360_08_fix_log_order_status_trigger` | Corrige cast `::text` sur colonnes `order_status` |

### Trigger DB clé
```sql
-- food_passport.enforce_nutri_validation (durci)
-- BEFORE INSERT OR UPDATE on food_passport.orders
-- Lève check_violation si NEW.status IN (
--   transmise_resto, validee_resto, transmise_cuisine, transmise_hotel,
--   en_preparation, prete, livree
-- ) AND NEW.validated_by_nutri_at IS NULL
```

### Architecture défense en profondeur
| Couche | Mécanisme |
|---|---|
| 1. DB | Trigger `enforce_nutri_validation` (vérifié, testé) |
| 2. RLS | `orders: cuisine read validated`, `orders: hotel read validated AND hotel_has_active_access()` |
| 3. Server Action | `auth.uid()` → résolution `player_id` server-side, no spoof |
| 4. Helpers `queries.ts` | `.eq("status", source)` sur chaque transition |
| 5. UI | Action bar nutri masquée si statut non-actionnable |

### Routes livrées
```
/[locale]/login
/[locale]/joueur
  /joueur            (passeport)
  /joueur/menu       (menu du jour)
  /joueur/commander  (panier)
  /joueur/orders     (liste)
  /joueur/orders/[id] (détail + timeline + annuler)
  /joueur/profile
/[locale]/nutri
  /nutri              (file de validation — Realtime)
  /nutri/players      (liste joueurs)
  /nutri/players/[id] (fiche joueur)
  /nutri/articles     (file validation articles)
  /nutri/articles/[id]
  /nutri/orders/[id]  (détail + 4 actions + Realtime)
  /nutri/profile
/[locale]/resto
  /resto
  /resto/articles
  /resto/articles/new
  /resto/articles/[id]
  /resto/menus
  /resto/menus/new
  /resto/menus/[id]
```

---

## Pour reprendre la prochaine session

Lire dans l'ordre :
1. `CLAUDE.md`
2. `docs/SPEC_PRODUIT.md`
3. `docs/SKILL_FOOD_360.md`
4. **Ce fichier `docs/ROADMAP.md`** — section « Semaine 5 »

Puis enchaîner sur **Semaine 5 : Vue cuisine kanban + dashboard resto**.

Décision à prendre en début de session : transitions cuisine via boutons de statut ou drag-and-drop ?
(Drag-and-drop = Framer Motion + @dnd-kit — Phase 2 selon CLAUDE.md §3 notes. Recommandation : boutons pour le MVP.)

Tout build TS doit passer (`pnpm tsc --noEmit` clean).
Tout commit poussé sur `claude/audit-repo-structure-09qyE`.

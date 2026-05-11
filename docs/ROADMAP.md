# ROADMAP — FOOD PASSPORT 360

> État exact du projet pour reprendre proprement après chaque session.
> Mis à jour à la fin de chaque livrable.
> **Branche de dev :** `claude/audit-repo-structure-09qyE` (toujours synchro avec `origin`).

---

## Dernière session

**Date de la dernière mise à jour** : 2026-05-11
**Dernier commit poussé** : `ff3aaba feat(semaine-4): UI nutri - file de validation + ValidationModal`

---

## Phase 1 — MVP (8 semaines)

### Semaine 1 — Fondations ✅ TERMINÉ
- Stack Next.js 15 + Supabase + Tailwind + shadcn + next-intl
- AppShell + TopBar + BottomNav + Sidebar (mobile-first)
- Supabase magic link auth
- `proxy.ts` (session refresh + locale routing)
- CSS variables thémables (pas de couleur en dur)

### Semaine 2 — RBAC + Passeport joueur ✅ TERMINÉ
- Schéma `food_passport` complet sur Supabase partagé (vjulagaprzbnquynwjmt)
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
- **NB** : Pas de DeepL (Phase 2), pas d'upload photo article (Semaine 7), réorder par flèches up/down (pas de drag-and-drop)

### Semaine 4 — Commandes + validation nutri 🟡 EN COURS (90% fait)

#### ✅ Fait dans cette session
1. **Migration `fp360_06_harden_order_validation`** appliquée en prod Supabase :
   - `enforce_nutri_validation()` étendu : `BEFORE INSERT OR UPDATE` (pas seulement UPDATE)
   - Utilise `NEW.validated_by_nutri_at` (pas `OLD.`) → bloque même sur INSERT direct
   - Garde 7 statuts : `transmise_resto`, `validee_resto`, `transmise_cuisine`, `transmise_hotel`, `en_preparation`, `prete`, `livree`
   - Test direct : INSERT à `transmise_cuisine` sans validation → exception `23514 check_violation` ✓
   - Statuts pré-validation passent sans régression ✓
2. **`queries.ts` étendu** (+16 helpers nommés, pas de dispatcher générique) :
   - Joueur : `createOrder`, `submitOrder`, `cancelOrder`, `listMyOrders`, `getOrderWithItems`
   - Nutri : `listOrdersAwaitingNutri`, `validateOrderNutri`, `adjustOrderNutri`, `refuseOrderNutri`, `askPrecisionNutri`
   - Resto/Cuisine/Hotel : `transmitToResto`, `validateOrderResto`, `transmitToKitchen`, `transmitToHotel`, `markPrepStarted`, `markReady`, `markDelivered`
   - Audit : `getOrderValidationLogs`, `countOrdersAwaitingNutri`, `getPlayerNamesByIds`
   - **`FPOrderItem` corrigé** (vraies colonnes : `portion_g`, `player_note`, `nutri_note`, `removed_by_nutri`, `added_by_nutri`)
3. **Server Actions Joueur** (`/joueur/commander/actions.ts` + `/joueur/orders/[id]/actions.ts`)
   - `player_id` résolu côté serveur via `auth.uid()` → `getPlayerByProfileId`
   - `createOrderAction`, `submitOrderAction`, `cancelOrderAction`, `createAndSubmitOrderFormAction`
4. **Server Actions Nutri** (`/nutri/orders/[id]/actions.ts`)
   - `validateOrderNutriAction`, `adjustOrderNutriAction`, `refuseOrderNutriAction`, `askPrecisionNutriAction`
   - Validation côté serveur des champs obligatoires (`notes`, `reason`, `message`)
5. **UI Joueur** (3 routes, mobile-first, 3 taps max pour commander)
   - `/joueur/commander` : panier depuis menu du jour, sticky cart bar, bottom sheet de confirmation
   - `/joueur/orders` : liste + badge statut + ref + service + horaire
   - `/joueur/orders/[id]` : détail + raison refus + items marqués (ajustement nutri) + timeline + bouton annuler conditionnel
   - Composants : `OrderStatusBadge` (16 styles), `OrderCartItem`, `OrderBuilder`, `OrderListItem`, `OrderTimeline`, `PlayerOrderDetail`
6. **UI Nutri** (restructure + 2 routes)
   - `/nutri` → file de validation (anciennement liste joueurs)
   - `/nutri/players` → liste joueurs (déplacée)
   - `/nutri/orders/[id]` → détail + action bar sticky (4 boutons : Valider / Ajuster / Préciser / Refuser)
   - Composants : `NutriQueueView`, `NutriOrderQueueItem`, `NutriOrderDetail`, `ValidationModal`, `ArticlePicker` (réutilisable)
   - **Option B** (ajustement) : `ArticlePicker` modal qui pioche dans le catalogue filtré (validés + actifs + non-rupture)
7. **i18n FR** : nouveaux namespaces `commander.*`, `orders.*`, `nutriQueue.*`, `nutriQueue.modal.*`
   - **`orderStatus` aligné sur l'enum DB** : `soumise` → `envoyee_joueur` (était faux), ajout `probleme_signale`, suppression `consommee` (n'existait pas en DB)

#### 🟡 Reste à faire dans cette semaine
8. **i18n fallback FR** (option A décidée) : configurer `getMessageFallback` dans `src/i18n/request.ts` pour que les locales en/es/it/pt/ar (qui n'ont pas les nouvelles clés `commander.*`, `orders.*`, `nutriQueue.*`) retombent silencieusement sur FR. Sinon crash runtime en non-FR.
9. **Realtime Supabase** : hook `useOrderRealtime(orderId)` pour que le joueur voie son statut bouger en temps réel (post-validation nutri, mise en prépa, prête, livrée). Côté nutri : la file se rafraîchit à chaque nouvelle commande envoyée.
10. **Tests E2E Playwright** sur les 5 scénarios critiques de CLAUDE.md §5.7 :
    1. Joueur passe une commande → reste en `envoyee_joueur` (pas transmise cuisine)
    2. Nutri valide → cuisine voit, hôtel voit
    3. Nutri refuse → joueur notifié dans sa langue, cuisine ne voit pas
    4. Hôtel hors déplacement actif → 403
    5. Accès hôtel expiré → 403

### Semaines 5–8 (à venir)
- **Semaine 5** : Vue cuisine (kanban À produire / En cours / Prête), dashboard resto, mode impression
- **Semaine 6** : Déplacements (trips, hotels, rooming, hotel_access avec tokens signés)
- **Semaine 7** : Upload photo article (Storage Supabase) + preuve photo livraison + feedback
- **Semaine 8** : Notifications push (PWA), exports PDF/Excel, audit logs visibles super_admin, déploiement Vercel + Supabase prod

---

## Phase 2 (post-MVP)
- **DeepL API** pour traduction auto contenu (articles, notes, commentaires joueur)
- Chat Staff (messagerie entre rôles)
- IA recommandations (suggestions repas selon profil joueur)
- Drag-and-drop pour réorder menus (actuellement flèches up/down)

---

## État technique actuel

### Trigger DB clé
```sql
-- food_passport.enforce_nutri_validation (durci)
-- BEFORE INSERT OR UPDATE on food_passport.orders
-- Lève check_violation si NEW.status IN (
--   transmise_resto, validee_resto, transmise_cuisine, transmise_hotel,
--   en_preparation, prete, livree
-- ) AND NEW.validated_by_nutri_at IS NULL
```

### Architecture défense en profondeur (règle fondamentale)
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
  /joueur/commander  (panier — NEW)
  /joueur/orders     (liste — NEW)
  /joueur/orders/[id] (détail — NEW)
  /joueur/profile
/[locale]/nutri
  /nutri              (FILE DE VALIDATION — restructure)
  /nutri/players      (liste joueurs — déplacée)
  /nutri/players/[id] (fiche joueur)
  /nutri/articles     (file validation articles)
  /nutri/articles/[id]
  /nutri/orders/[id]  (détail commande + 4 actions — NEW)
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
4. **Ce fichier `docs/ROADMAP.md`** — section « Reste à faire dans cette semaine »

Puis enchaîner sur la **tâche 8 : i18n fallback FR** (option A déjà validée par le PO).

Tout build TS doit passer (`pnpm tsc --noEmit` clean).
Tout commit poussé sur `claude/audit-repo-structure-09qyE`.

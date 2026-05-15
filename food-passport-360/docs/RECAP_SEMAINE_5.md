# RECAP SEMAINE 5 — FOOD PASSPORT 360

> Branche mergée : `claude/audit-repo-structure-09qyE` → `main`
> Date : 2026-05-15
> Commits : `7599e70`, `0f7d006`

---

## 1. Kanban Cuisine (`/cuisine`)

### Ce qui a été livré

- **3 colonnes temps réel** : À produire (orange) / En préparation (bleu) / Prête (vert)
- **Boutons inline sur chaque carte** — le cuisinier ne quitte jamais le kanban :
  - "Démarrer" → `en_preparation`
  - "Prête ✓" → `prete`
  - "Livrée ✓" → `livree`
- **État pending optimiste** — le bouton se grise et affiche un spinner pendant la transition
- **Badges diététiques** — Halal et Sans gluten calculés à partir des articles actifs de la commande
- **Badge priorité** — URGENT (rouge) et important (orange) visibles au premier coup d'œil
- **Résumé articles** — liste des plats tronquée sur 2 lignes
- **Note joueur** — affichée si renseignée
- **Realtime Supabase** — `useKitchenRealtime` : la board se rafraîchit automatiquement sur tout INSERT/UPDATE sur `orders` (sans rechargement page)
- **Vide intelligent** — si aucune commande en cours pour la journée, message "Toutes les commandes du jour sont traitées"

### Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/app/[locale]/(cuisine)/cuisine/page.tsx` | Remplace le placeholder — server component, fetch `listKitchenOrders` |
| `src/app/[locale]/(cuisine)/cuisine/actions.ts` | Server actions : `markPrepStartedAction`, `markReadyAction`, `markDeliveredAction` |
| `src/components/domain/KitchenBoard.tsx` | Client component — 3 colonnes + `useKitchenRealtime` |
| `src/components/domain/KitchenOrderCard.tsx` | Carte individuelle + bouton CTA inline |
| `src/hooks/useOrderRealtime.ts` | Ajout `useKitchenRealtime()` |
| `src/lib/supabase/queries.ts` | Ajout `listKitchenOrders()`, types `KitchenOrder` / `KitchenStats` |

### Sécurité (défense en profondeur respectée)

Les transitions cuisine (`transmise_cuisine → en_preparation → prete → livree`) ne contournent pas le trigger DB `enforce_nutri_validation` : ces statuts sont en aval de la validation nutri, le trigger les autorise explicitement.

---

## 2. Dashboard Restauration (`/resto`)

### Ce qui a été livré

- **5 KPI cards** en haut de page :
  - Total validées nutri (toutes commandes du jour post-validation)
  - À produire (transmise_cuisine)
  - En préparation
  - Prêtes
  - Livrées
- **Table des commandes du jour** — joueur, service, heure, nombre de plats, statut live avec `OrderStatusBadge`
- **Realtime** — `useOrdersQueueRealtime` : les KPIs et la table se mettent à jour automatiquement
- **Bouton Imprimer** → lien vers `/resto/print`

### Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/app/[locale]/(resto)/resto/page.tsx` | Remplace le placeholder — fetch `getKitchenStats` + `listRestoOrdersToday` |
| `src/components/domain/RestoDashboard.tsx` | Client component — KPIs + table + realtime |
| `src/components/domain/RestoDashboardKpi.tsx` | Carte KPI avec variantes (warning/success/muted) |
| `src/lib/supabase/queries.ts` | Ajout `getKitchenStats()`, `listRestoOrdersToday()`, type `RestoOrder` |

---

## 3. Page d'impression Restauration (`/resto/print`)

### Ce qui a été livré

- **URL dédiée** `/resto/print` — accessible depuis le dashboard
- **Groupement par service** — chaque service (déjeuner, dîner, etc.) dans sa propre section avec tableau
- **Récap KPIs en tête de page** — total, à produire, en prépa, prêtes, livrées
- **Pied de page** — horodatage impression
- **CSS print propre** — `print:hidden` sur Sidebar, TopBar, BottomNav via AppShell : rien que le contenu à l'impression
- **Bouton "Imprimer"** (client component isolé `PrintButton.tsx`) — appelle `window.print()`
- **Bouton retour** vers `/resto` pour revenir au dashboard

### Fichiers créés

| Fichier | Action |
|---|---|
| `src/app/[locale]/(resto)/resto/print/page.tsx` | Server component print |
| `src/app/[locale]/(resto)/resto/print/PrintButton.tsx` | Client component bouton print |
| `src/components/shell/AppShell.tsx` | Ajout `print:hidden` sur les éléments chrome |
| `src/components/shell/TopBar.tsx` | Prop `className` acceptée |
| `src/components/shell/BottomNav.tsx` | Prop `className` acceptée |
| `src/components/shell/Sidebar.tsx` | Prop `className` acceptée |

---

## 4. Photo joueur — Upload + Storage (`/nutri/players/[id]`)

### Ce qui a été livré

- **Composant `PlayerPhotoUpload`** — remplace l'avatar initiales statique dans la fiche d'arrivée :
  - Click sur l'avatar → file picker (JPG, PNG, WebP)
  - **Resize canvas côté client** → 400×400 px center-crop → WebP 85 %
  - **Upload direct vers Supabase Storage** (bucket `player-photos`)
  - Cache-bust URL après upload (pas de photo périmée en cache)
  - Sauvegarde `photo_url` en base via `savePlayerAction` (server action existante)
  - Overlay caméra au hover, spinner pendant l'upload, message d'erreur inline
- **Migration Storage** — bucket `player-photos` :
  - Public (photos visibles cuisine + hôtel, données opérationnelles)
  - Limite 2 Mo (après resize, non atteinte en pratique)
  - Types autorisés : `image/jpeg`, `image/png`, `image/webp`
  - Policies RLS Storage : authenticated upload/update/delete, public SELECT

### Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `supabase/migrations/20260510000001_storage_player_photos.sql` | Bucket + policies Storage |
| `src/components/domain/PlayerPhotoUpload.tsx` | Composant upload complet |
| `src/components/domain/PlayerOnboardingForm.tsx` | Intégration dans l'onglet Identité |

### Action requise côté Supabase Studio (projet `sbkewkpemakactzfvbzz`)

```sql
-- Exécuter dans SQL Editor → New query
-- Fichier : supabase/migrations/20260510000001_storage_player_photos.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-photos', 'player-photos', true, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload player photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'player-photos');

CREATE POLICY "Authenticated users can update player photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'player-photos');

CREATE POLICY "Player photos are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'player-photos');

CREATE POLICY "Authenticated users can delete player photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'player-photos');
```

---

## 5. i18n

Ajout dans `messages/fr.json` (namespaces complets, fallback FR actif pour en/es/it/pt/ar) :

```json
"cuisine": {
  "title", "columnToPrepare", "columnInPrep", "columnReady",
  "columnEmpty", "startPrep", "markReady", "markDelivered",
  "updating", "emptyBoard", "emptyBoardDesc"
},
"restoDashboard": {
  "title", "print", "printTitle", "backToDashboard",
  "kpiTotal", "kpiToPrepare", "kpiInPrep", "kpiReady", "kpiDelivered",
  "ordersToday", "ordersCount", "noOrders"
}
```

---

## Checklist quality gates (CLAUDE.md §7)

- [x] TypeScript build sans `any` injustifié — `pnpm tsc --noEmit` propre
- [x] Aucune couleur hex en dur — tout via CSS variables / Tailwind tokens
- [x] Aucune chaîne en dur — tout dans `messages/fr.json`
- [x] RLS respectée — les transitions cuisine n'existent que côté post-validation nutri
- [x] Défense en profondeur non contournée — trigger DB + RLS + server actions + UI
- [x] Realtime sur les 2 vues critiques (cuisine + resto)
- [x] Composants Server par défaut, `"use client"` uniquement si interactivité
- [x] Audit trail intact — chaque transition écrit dans `order_validation_logs` via trigger

---

## Semaine 6 — prochaine étape

Selon `docs/ROADMAP.md` :

- Tables `trips`, `hotels`, `rooming`, `hotel_access` (dans le schéma, pas encore l'UI)
- Création déplacement (Team Manager)
- Génération accès hôtel temporaire (token signé, expiration auto)
- Portail hôtel limité (RLS stricte — déjà testée en S4/S5)

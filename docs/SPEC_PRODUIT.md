# SPEC_PRODUIT.md — FOOD PASSPORT 360
## Spécification produit complète

> Document de référence produit. Ne pas modifier sans validation du Product Owner (AMAR13).
> Toute évolution structurelle doit être reflétée dans `docs/ROADMAP.md`.

---

## CONTEXTE ET VISION

### Identité du projet

**Nom provisoire :** FOOD PASSPORT 360
**Sous-titre :** Interface alimentaire performance joueur / nutrition / restauration / hôtel
**Client :** API Restauration (API 05147) — contrat OM PRO

### Mission

Créer une application 360° qui relie les joueurs, le nutritionniste, la restauration, la cuisine, le team manager, les hôtels en déplacement, les responsables opérationnels et la direction (lecture seule).

L'application est à la fois :
- Un **passeport nutritionnel joueur** — fiche vivante, évolutive, multilingue
- Une **interface opérationnelle alimentaire** — menus, commandes, plans, validation, production
- Un **outil de coordination terrain** — déplacements, hôtels, chambre, traçabilité photo
- Un **hub de communication structurée** — messagerie contextuelle, traduction auto, feedback

### Positionnement UX

L'application doit s'inspirer de :
- **Uber Eats** — pour la fluidité de la commande
- **WHOOP / Oura** — pour la dimension performance/données
- **Notion** — pour la clarté de l'information
- **Airbnb** — pour la simplicité de l'expérience
- **WhatsApp** — pour la fluidité du chat, mais avec plus de structure
- **Dashboard SaaS haut de gamme** — pour l'administration

Elle doit être :
- **Simple pour le joueur** — 3 clics maximum pour commander
- **Puissante pour les admins** — dashboards riches, KPIs, exports
- **Claire pour la cuisine** — lisibilité en production, kanban, impression
- **Ultra limitée pour les hôtels** — accès temporaire, scope réduit
- **Multilingue dès la conception** — 6 langues, traduction automatique

---

## RÈGLE FONDAMENTALE (NON NÉGOCIABLE)

> **Toutes les commandes effectuées par un joueur doivent obligatoirement passer par validation du nutritionniste avant d'être transmises à la restauration, à la cuisine ou à l'hôtel.**
>
> Aucune commande joueur ne doit être envoyée directement à la cuisine, à l'hôtel ou au room service sans validation nutritionniste préalable.

Cette règle est enforcée à 4 niveaux :
1. **Base de données** : trigger Postgres bloquant (voir `SCHEMA_DB.sql`)
2. **RLS** : cuisine et hôtel ne voient que les commandes avec `validated_by_nutri_at IS NOT NULL`
3. **API / Server Actions** : vérification serveur avant tout `update`
4. **UI** : boutons « transmettre » désactivés sans validation nutri

---

## RÔLES UTILISATEURS

### Super Admin
- Accès total à toutes les fonctionnalités et données
- Gestion des utilisateurs, des rôles, des permissions
- Accès aux audit logs complets
- Peut déléguer le rôle nutritionniste temporairement
- Supervision des accès hôtels, expirations, révocations
- Tableaux de bord consolidés multi-modules

### Admin Restauration
- Gestion du catalogue articles (création, modification, activation, archivage)
- Soumission articles à validation nutritionniste
- Création et publication des menus du jour / semaine
- Réception des commandes validées par le nutritionniste
- Transmission aux cuisines ou à l'hôtel selon contexte
- Dashboard restauration avec KPIs (volumes, délais, satisfaction)
- Gestion des fiches hôtels et cahiers des charges
- Export PDF et Excel
- Accès lecture à la fiche joueur (données opérationnelles uniquement)

### Admin Nutritionniste
- Accès complet aux fiches joueurs (y compris données sensibles)
- Saisie et validation des fiches d'arrivée joueur
- Gestion des plans alimentaires et protocoles
- Validation / ajustement / refus des articles du catalogue
- File d'attente de validation des commandes joueurs
- Actions : Valider / Ajuster / Refuser / Demander précision
- Délégation de rôle (avec autorisation super admin)
- Notifications et alertes prioritaires

### Admin Team Manager
- Création et gestion des déplacements (trips)
- Gestion de la rooming list (joueur ↔ chambre ↔ hôtel)
- Génération des accès hôtels temporaires (token signé, expiration auto)
- Vue globale des commandes liées aux déplacements
- Coordination avec hôtels et restauration

### Cuisine
- Réception des commandes validées par le nutritionniste et transmises par la restauration
- Vue kanban : À produire / En cours / Prête
- Mise à jour des statuts de production en temps réel
- Mode impression optimisé
- Accès limité aux restrictions alimentaires du joueur (lecture uniquement, contexte commande)
- Aucune donnée sensible joueur (poids, objectifs, notes médicales)

### Hôtel
- Accès ultra limité, temporaire, lié à un déplacement précis
- Réception des demandes chambre validées par le nutritionniste
- Mise à jour des statuts (reçu, en cours, livré)
- Upload de photos de confirmation
- Aucun accès aux données joueur hors commande active
- Expiration automatique à la fin du déplacement

### Joueur
- Interface ultra simple, mobile-first, dans sa langue
- Consultation de son passeport nutritionnel (lecture)
- Remplissage de la fiche d'arrivée / préférences
- Passage de commandes repas (centre ou hôtel)
- Suivi de l'état de ses commandes en temps réel
- Feedback et satisfaction
- Messagerie avec le nutritionniste
- Changement de langue à tout moment

### Direction / Lecture seule
- Dashboards agrégés en lecture uniquement
- KPIs restauration, satisfaction, volumes
- Aucune action possible sur les données opérationnelles

---

## MULTILINGUE ET TRADUCTION AUTOMATIQUE

### Langues supportées
- 🇫🇷 Français (FR) — langue source de vérité
- 🇬🇧 Anglais (EN)
- 🇪🇸 Espagnol (ES)
- 🇮🇹 Italien (IT)
- 🇵🇹 Portugais (PT)
- 🇸🇦 Arabe (AR) — avec support RTL

### Deux niveaux de traduction

**Niveau 1 — Interface** (`next-intl`)
- Toutes les chaînes UI dans `messages/{lang}.json`
- FR comme langue source de vérité
- Fallback FR si traduction manquante
- Routes localisées : `/{locale}/...`

**Niveau 2 — Contenu saisi** (DeepL API, fallback Google Translate)
- Commentaires joueur → traduits dans la langue du nutritionniste
- Commentaires nutri → traduits dans la langue du joueur
- Messages de messagerie → traduits à la demande
- Feedback satisfaction → traduit pour lecture admin

### Modèle de données traduction (par message/contenu)
```
original_text       TEXT       -- texte original tel que saisi
original_lang       supported_lang  -- langue détectée
translated_text     TEXT       -- traduction automatique
target_lang         supported_lang  -- langue cible
auto_translated     BOOLEAN    -- true = auto, false = manuel
manual_correction   BOOLEAN    -- corrigé manuellement
created_at          TIMESTAMPTZ
module              TEXT       -- 'order', 'feedback', 'message', etc.
emitter_role        user_role
```

---

## MODULES PRINCIPAUX

### Module 1 — Passeport nutritionnel joueur

**Description :** Fiche vivante du joueur, son identité nutritionnelle complète.

**Données opérationnelles** (visibles par cuisine, hôtel, restauration) :
- Allergies et intolérances actives (avec niveau de sévérité)
- Aliments refusés / évités
- Préférences principales (halal, végétarien, etc.)
- Habitudes pratiques utiles à la cuisine

**Données sensibles** (nutritionniste uniquement) :
- Poids, taille, objectifs corporels
- Notes médicales privées
- Commentaires nutritionniste confidentiels
- Historique des modifications

**Vue joueur :** Lecture de ses propres données opérationnelles + accès fiche d'arrivée

**Implémentation :** Deux couches d'accès via RLS — table `players` (sensible) + vue `players_operational` (filtrée)

---

### Module 2 — Onboarding nutritionnel / Fiche d'arrivée joueur

**Description :** Questionnaire complet rempli à l'arrivée du joueur, enrichi en continu.

**Sections de la fiche :**

1. **Informations alimentaires générales**
   - Type de régime alimentaire
   - Rythme des repas habituel
   - Appétit le matin / après entraînement / après match
   - Aliments consommés régulièrement / rarement / refusés
   - Notes digestives particulières

2. **Hydratation**
   - Type d'eau préféré (plate, gazeuse, mixte)
   - Litres journaliers habituels
   - Boissons préférées / évitées
   - Tolérance aux boissons énergisantes
   - Habitudes café/thé
   - Besoins spécifiques en déplacement

3. **Préférences culturelles**
   - Cuisine(s) préférée(s)
   - Aliments de confort / réconfort
   - Aliments familiers vs difficiles
   - Textures refusées
   - Tolérance aux épices

4. **Plats préférés** (par contexte)
   - Au centre / Commanderie
   - Avant match
   - Après match
   - En déplacement
   - Room service
   - Dessert préféré
   - Boisson préférée

5. **Routine match** (vielle et jour de match)
   - Habitudes veille de match
   - Habitudes jour de match
   - Repas idéal avant match
   - Aliments évités avant match
   - Collation idéale pré-match
   - Boisson pré-effort
   - Temps de digestion pré-effort
   - Habitudes après match

6. **Hôtel** (déplacements)
   - Préférences petit-déjeuner hôtel
   - Préférences room service
   - Horaires habituels
   - Demandes fréquentes chambre
   - Aliments rassurants en déplacement
   - Aliments évités en déplacement
   - Besoins récupération spécifiques

7. **Feedback initial**
   - Ce que le joueur aime dans la restauration actuelle
   - Ce qu'il n'aime pas
   - Attentes vis-à-vis de la restauration
   - Attentes vis-à-vis du nutritionniste
   - Notes libres joueur
   - Remarques privées nutritionniste (invisible joueur)

**Statuts fiche :** brouillon → incomplète → à mettre à jour → complète → validée

**Audit :** Chaque modification tracée dans `player_onboarding_history`

---

### Module 3 — Diffusion menus

**Description :** Création et publication des menus par la restauration, visibles par joueurs selon leur langue.

**Fonctionnalités :**
- Création menu par date / service / lieu
- Services : Petit-déjeuner, Déjeuner, Collation pré, Collation post, Collation récup, Dîner, Room service, After match, Pré-match
- Localisation : centre, hôtel, déplacement, frigo intelligent
- Articles issus du catalogue validé nutri
- Traduction automatique des noms d'articles
- Heure limite de commande configurable
- Statuts : brouillon → publié → archivé
- Notification push à la publication (joueurs concernés)

---

### Module 4 — Plan alimentaire nutritionniste

**Description :** Plans personnalisés ou collectifs définis par le nutritionniste.

**Fonctionnalités :**
- Plan individuel (par joueur) ou collectif (groupe)
- Contexte : entraînement, repos, veille match, jour match, déplacement, récupération
- Dates de validité (début / fin)
- Articles autorisés / recommandés / bloqués avec portions recommandées
- Protocoles pré-match / post-match / récupération / déplacement
- Visible par le nutritionniste lors de la validation d'une commande

---

### Module 5 — Base d'articles modifiable

**Description :** Catalogue centralisé des articles disponibles à la commande.

**Champs article :**
- Nom (FR + traductions auto)
- Catégorie / sous-catégorie
- Photo
- Description courte
- Portion standard (grammes)
- Allergènes associés
- Régimes : halal, végétarien, vegan, sans gluten, sans lactose
- Disponibilité : centre, hôtel, chambre, frigo intelligent, jour match, veille match, récupération
- Validation nutritionniste (validé / bloqué + commentaire)
- Commentaire restauration
- Prix / coût / fournisseur
- Statut : actif, rupture, archivé

**Workflow de validation article :**
1. Restauration crée/modifie l'article
2. Article en attente de validation nutri
3. Nutritionniste valide, commente ou bloque
4. Si validé → disponible à la commande joueur

---

### Module 6 — Commande repas joueur avec workflow validation

**Description :** Le cœur opérationnel de l'application.

**Workflow complet :**

```
1.  Joueur passe commande dans sa langue
    → Statut : "brouillon"
    
2.  Joueur soumet la commande
    → Statut : "envoyée joueur"
    
3.  Commande reçue par le nutritionniste
    → Statut : "en attente nutri"
    → Notification nutri
    
4.  Nutritionniste consulte commande avec contexte :
    - Fiche joueur complète
    - Allergies et restrictions actives
    - Plan alimentaire actif
    - Protocole du jour (veille match, jour match, etc.)
    - Historique commandes récentes
    
5a. Nutritionniste VALIDE
    → Statut : "validée nutri"
    → Notification joueur (commande validée)
    → Transmise automatiquement à Admin Restauration
    → Statut : "transmise resto"
    
5b. Nutritionniste AJUSTE (modifie des articles)
    → Statut : "ajustée nutri"
    → Note d'ajustement visible joueur
    → Notification joueur
    → Transmise à Admin Restauration
    
5c. Nutritionniste REFUSE
    → Statut : "refusée nutri"
    → Raison du refus visible joueur (traduite)
    → Notification joueur
    → Joueur peut soumettre une nouvelle commande
    
5d. Nutritionniste DEMANDE PRÉCISION
    → Statut : "précision demandée"
    → Message au joueur (traduit)
    → Joueur répond et remet en attente nutri
    
6.  Admin Restauration reçoit commande validée
    → Statut : "validée resto" après vérification faisabilité
    
7a. Transmission cuisine
    → Statut : "transmise cuisine"
    → Notification cuisine
    
7b. Transmission hôtel (si déplacement)
    → Statut : "transmise hôtel"
    → Notification hôtel
    
8.  Production
    → Statut : "en préparation"
    → Statut : "prête"
    
9.  Livraison
    → Statut : "livrée"
    → Notification joueur
    → Déclenchement invitation feedback
    
États exceptionnels :
    → "annulée" (par joueur si encore brouillon, ou par nutri/admin)
    → "problème signalé" (signalement par tout acteur)
```

**Statuts complets (16) :**
brouillon, envoyée_joueur, en_attente_nutri, validée_nutri, ajustée_nutri, refusée_nutri, précision_demandée, transmise_resto, validée_resto, transmise_cuisine, transmise_hôtel, en_préparation, prête, livrée, annulée, problème_signalé

---

### Module 7 — Demandes chambre déplacement

**Description :** Commandes room service lors des déplacements, intégrées au workflow de validation nutri.

**Fonctionnalités :**
- Commande depuis l'interface joueur avec sélection déplacement actif
- Numéro de chambre automatique (via rooming list)
- Soumis au même workflow de validation nutri que les commandes centre
- Transmis à l'hôtel (profil hôtel avec accès temporaire actif)
- Suivi statut temps réel joueur
- Historique des demandes par déplacement

---

### Module 8 — Portail hôtel

**Description :** Interface ultra limitée pour le personnel hôtel en déplacement.

**Fonctionnalités :**
- Accès par token signé + expiration automatique
- Réception des commandes chambre validées (nutri + resto)
- Mise à jour statuts : reçu → en préparation → livré
- Upload photo de confirmation (plateau servi)
- Vue rooming list (noms + chambres uniquement)
- Aucune donnée médicale ou sensible visible
- Expiration automatique à la fin du déplacement
- Révocation possible par team manager

---

### Module 9 — Cahier des charges hôtel

**Description :** Référentiel qualité lié à chaque hôtel partenaire.

**Contenu :**
- Lien document PDF
- Standards petit-déjeuner
- Standards déjeuner / dîner
- Standards collations
- Protocole veille match
- Protocole jour match
- Protocole after match
- Exigences halal
- Gestion des allergènes
- Règles de température
- Règles de traçabilité
- Règles de livraison chambre
- Règles de présentation

**Accès :** Admin Restauration, Team Manager, Super Admin

---

### Module 10 — Satisfaction et feedback

**Description :** Système de feedback multilingue post-livraison.

**Fonctionnalités :**
- Déclenchement automatique après livraison (statut "livrée")
- Évaluation globale 1-5 étoiles / smileys
- Tags thématiques : qualité, quantité, température, goût, délai, présentation
- Commentaire libre (traduction automatique pour admin)
- Lié à la commande, au déplacement, à l'hôtel si applicable
- Dashboard KPI satisfaction : par joueur, par service, par hôtel, par période
- Export CSV/Excel

---

### Module 11 — Messagerie contextuelle multilingue

**Description :** Échanges structurés liés à un contexte précis (commande, fiche, article…).

**Fonctionnalités :**
- Conversations liées à une entité (commande, trip, article…)
- Traduction automatique message par message
- Chaque message conserve : original, langue source, traduction, langue cible
- Statuts de lecture (lu / non lu)
- Notifications temps réel
- Filtres par module et par rôle

**Phase 2** : messagerie élargie avec fils de discussion avancés

---

### Module 12 — Chat Staff / Coordination opérationnelle

**Description :** Messagerie interne entre membres du staff (hors joueurs).

**Phase 2** — non inclus MVP.

**Fonctionnalités planifiées :**
- Canaux par rôle / équipe
- Messages épinglés
- Partage de fichiers
- Traduction auto inter-staff
- Notifications configurables

---

### Module 13 — Preuve photo / Validation visuelle

**Description :** Upload et validation de photos pour garantir la conformité opérationnelle.

**Contextes :**
- Plateau chambre hôtel livré
- Mise en place cuisine
- Traçabilité températures
- Feedback visuel joueur
- Vérification cahier des charges hôtel

**Workflow :**
1. Acteur autorisé uploade photo (compression côté client avant envoi)
2. Photo stockée dans Supabase Storage bucket `photos` (privé)
3. Statut : demandée → en attente → validée / refusée / non conforme
4. Validateur : Nutri / Resto / Team Manager selon contexte
5. Commentaire de validation

**Logs :** Chaque action tracée dans `photo_validation_logs`

---

## DASHBOARDS

### Dashboard Nutritionniste
- File d'attente de validation (commandes en attente)
- Indicateurs : nombre en attente, délai moyen traitement, taux validation
- Accès rapide fiches joueurs (filtres actif / blessé / déplacement)
- Plans actifs du jour
- Protocoles du jour
- Alertes (allergies détectées, restrictions non respectées)

### Dashboard Restauration
- Vue temps réel des commandes par service
- KPIs : volumes, délais de production, satisfaction moyenne
- Gestion catalogue articles
- Publication menus
- Coordination déplacements actifs
- Alertes rupture stock / articles bloqués

### Dashboard Team Manager
- Déplacements actifs et à venir
- Rooming lists
- Statut des accès hôtels
- Commandes chambre en cours par déplacement
- Photos de confirmation

### Dashboard Cuisine
- Kanban : À produire / En cours / Prête
- Filtres par service, par heure
- Vue allergènes par commande (lecture seule)
- Mode impression optimisé (A4, sans UI)
- Statuts de production mis à jour en temps réel

### Dashboard Super Admin
- Vue consolidée tous modules
- Gestion utilisateurs et rôles
- Audit logs
- KPIs globaux
- Délégations actives

---

## NOTIFICATIONS

Événements déclenchant une notification (multilingue, dans la langue du destinataire) :

| Événement | Destinataire |
|---|---|
| Commande soumise joueur | Nutritionniste |
| Commande validée nutri | Joueur + Admin Resto |
| Commande ajustée nutri | Joueur + Admin Resto |
| Commande refusée nutri | Joueur |
| Précision demandée | Joueur |
| Commande transmise cuisine | Cuisine |
| Commande transmise hôtel | Hôtel |
| Commande prête | Joueur |
| Commande livrée | Joueur |
| Problème signalé | Admin Resto + Nutri |
| Nouveau menu publié | Joueurs concernés |
| Article soumis à validation | Nutritionniste |
| Photo demandée | Destinataire concerné |
| Accès hôtel créé | Profil hôtel |
| Accès hôtel expiré | Team Manager |
| Feedback reçu | Admin Resto |

**Format notification :** `title_key` + `body_key` (clés i18n) + `body_params` (JSONB pour interpolation dynamique)

---

## ARCHITECTURE TECHNIQUE

### Stack imposée (voir CLAUDE.md §3 pour détail)

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS variables |
| UI primitives | shadcn/ui |
| Icônes | lucide-react |
| Animations | Framer Motion |
| Backend | Supabase (Auth + DB + Storage + Realtime) |
| Multilingue UI | next-intl |
| Traduction contenu | DeepL API (fallback Google Translate) |
| State serveur | TanStack Query |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| PDF / Excel | react-pdf + SheetJS |
| Tests | Vitest + Playwright |
| Déploiement | Vercel |
| PWA | next-pwa |

### Variables CSS obligatoires (jamais de couleur en dur)

```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--secondary
--secondary-foreground
--accent
--accent-foreground
--muted
--muted-foreground
--success
--warning
--danger
--border
--input
--ring
--radius
```

### Tables Supabase principales

```
users, profiles, roles, permissions,
user_language_preferences, translations, translation_logs,
players, player_onboarding_forms,
player_breakfast_preferences, player_lunch_preferences,
player_dinner_preferences, player_snack_preferences,
player_match_routines, player_hotel_preferences,
player_food_restrictions, player_onboarding_history,
allergens, dietary_restrictions,
menus, menu_translations, menu_items,
articles, article_translations, article_categories,
article_availability, article_nutrition_validation,
nutrition_plans, nutrition_protocols, approved_items,
orders, order_items, order_validation_logs,
nutrition_validation_queue, order_comment_translations,
trips, hotels, hotel_contacts, rooms, rooming,
hotel_access, hotel_specifications,
feedbacks, feedback_translations,
notifications, notification_translations,
audit_logs,
conversations, messages, message_translations,
action_photos, photo_validation_logs
```

*(Schéma complet dans `docs/SCHEMA_DB.sql`)*

---

## SÉCURITÉ

### Séparation données sensibles / opérationnelles

**Données sensibles** (nutritionniste uniquement) :
- Poids, taille, IMC, objectifs corporels
- Notes médicales, historique blessures alimentaires
- Commentaires privés nutritionniste
- Objectifs de composition corporelle

**Données opérationnelles** (cuisine, hôtel, restauration) :
- Allergies actives avec niveau de sévérité
- Aliments refusés / préférences pratiques
- Régimes actifs (halal, végétarien…)
- Habitudes utiles à la préparation

Implémentation : **deux couches d'accès** — table `players` (RLS nutri uniquement) + vue `players_operational` (colonnes filtrées)

### Accès hôtel

- Token signé, hashé côté DB
- Expiration automatique (`expires_at`)
- Révocation manuelle possible (`revoked_at`)
- Accès limité à UN déplacement précis
- Aucune donnée sensible visible
- Function RLS `hotel_has_active_access(trip_id)` vérifiée à chaque requête

### Audit trail

- `order_validation_logs` — chaque changement de statut commande
- `player_onboarding_history` — chaque modification fiche joueur
- `photo_validation_logs` — chaque action sur une photo
- `audit_logs` — log général toutes entités sensibles
- **Aucune suppression définitive** — archivage uniquement (`archived_at`)

### Principes généraux

- RLS Supabase activée sur toutes les tables sensibles
- Aucune commande sans validation nutri (trigger + RLS + API + UI)
- Accès joueur limité à ses propres données
- Secrets et clés API jamais dans le code source (`.env.local` uniquement)
- Sessions expirées révoquées côté Supabase Auth

---

## EXIGENCES UX

- **3 clics maximum** pour passer une commande (joueur)
- **Lecture immédiate des allergènes** sur chaque commande (toutes interfaces)
- **Dashboard clair** avec KPIs visibles sans scroll sur desktop
- **Accès hôtel ultra simple** — connexion par lien, interface épurée
- **Cuisine lisible en production** — grandes cartes, contraste élevé, impression propre
- **Joueur jamais perdu** — navigation simple, retour toujours accessible
- **Changement de langue en 1 clic** — sélecteur toujours visible
- **Messagerie structurée** — contexte toujours visible, traduction en un tap
- **Validation nutritionniste rapide** — toutes les infos sur une page, actions en haut
- **Validation photo en un clic** — prévisualisation + bouton validé / refusé
- **Fiche d'arrivée claire** — progression visible, sections claires, aide contextuelle

---

## ROADMAP MVP

### Phase 1 — MVP (Semaines 1 à 8)

**Inclus :**
- Authentification (magic link Supabase)
- RBAC complet (8 rôles)
- Choix de langue utilisateur
- Interface multilingue complète (6 langues)
- Traduction automatique des commentaires (DeepL)
- Fiches joueurs (données sensibles + opérationnelles)
- Onboarding nutritionnel complet
- Base articles avec validation nutri
- Diffusion menus du jour
- Commande joueur avec workflow validation nutri obligatoire (16 statuts)
- File d'attente nutritionniste
- Dashboard restauration
- Dashboard nutritionniste
- Création déplacement (trips + rooming)
- Demandes chambre validées nutri
- Portail hôtel avec accès temporaire
- Export PDF / Excel
- Feedback satisfaction multilingue
- Preuve photo simple (upload + validation)
- Notifications temps réel (Supabase Realtime)
- RLS complète pour tous les rôles
- Audit logs

### Phase 2 — Post-MVP

- Notifications push (PWA installable)
- Statistiques avancées et KPIs enrichis
- Messagerie contextuelle complète (Module 11)
- Chat Staff / Coordination (Module 12)
- Preuves photos avancées (galerie, commentaires, workflow étendu)
- Délégation nutritionniste configurable
- Gestion multi-sites (plusieurs centres)

### Phase 3 — IA et Intelligence

- Recommandations IA basées sur historique joueur
- Détection automatique des habitudes et anomalies
- Corrélation satisfaction / performance sportive
- Scoring nutritionnel par joueur
- Analyse qualité photos (conformité cahier des charges)
- Prédiction ruptures de stock

---

## DIRECTION ARTISTIQUE (préparation pour Claude Design)

### Principes

- **Mobile-first** — toutes les vues conçues d'abord pour 375px
- **Pas de couleur figée** — Claude Design finalise la charte visuelle
- **Variables CSS uniquement** — aucun hex en dur dans les composants
- **Premium et futuriste** — inspiré des meilleures apps SaaS 2024-2025
- **Transitions fluides** — Framer Motion pour toutes les micro-interactions
- **Thématisable en 1 fichier** — `globals.css` suffit pour changer toute la palette

### Ce que Claude Design finalisera (Phase post-MVP)

- Palette de couleurs définitive (primary, accent, gradients)
- Effets visuels avancés (glassmorphism, blur, glow)
- Animations d'onboarding
- Thème clair / thème sombre
- Illustrations et icônes custom
- Typographie finale

### Ce que le dev prépare dès maintenant

- Structure CSS variables propre et complète
- Composants shadcn/ui personnalisés mais non colorés
- Animations Framer Motion paramétrées via variables
- Design tokens centralisés dans `tokens.css`
- Responsivité testée 375px → 1440px

---

## CONTRAINTES OPÉRATIONNELLES

### Données réelles vs données de démo
- **Seed de démo** : noms fictifs uniquement (jamais de données joueurs réels)
- **Environnement prod** : données réelles avec RLS stricte
- Aucune donnée joueur réel dans les fichiers de test ou seed

### Performance
- Pages joueur : < 2s LCP sur 4G
- Dashboard admin : < 3s LCP
- Commande : < 1s de réponse après soumission
- Notification : < 5s de délai Supabase Realtime

### Accessibilité
- Contrast ratio WCAG AA minimum
- Support RTL pour l'arabe
- Taille de police minimum 16px sur mobile
- Zones de touch minimum 44px

---

*Dernière mise à jour : initialisation projet — toute modification structurante doit être loguée dans `docs/ROADMAP.md`.*

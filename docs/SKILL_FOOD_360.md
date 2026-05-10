# SKILL_FOOD_360.md — Direction artistique UI/UX
## FOOD PASSPORT 360 — Guide de style et d'expérience premium

> Ce document définit la direction artistique, les principes UX et les conventions
> de composants. Il est lu AVANT tout travail de design ou de code interface.
> **La palette de couleurs définitive est réservée à Claude Design** — aucune valeur
> hex ne doit être figée dans le code.

---

## 1. PHILOSOPHIE DESIGN

### Positionnement

FOOD PASSPORT 360 est une application **professionnelle premium** pour un club de football
de haut niveau. Elle n'est pas une app grand public, mais elle doit être **aussi fluide
et intuitive** que les meilleures apps consumer.

Le design doit transmettre :
- **Confiance et sérieux** — données sensibles, santé des joueurs
- **Efficacité opérationnelle** — chaque seconde compte en production cuisine
- **Modernité premium** — digne d'un club Ligue 1 / Champions League
- **Accessibilité universelle** — du joueur de 19 ans au chef cuisinier de 55 ans

### Références visuelles

| Référence | Ce qu'on en prend |
|---|---|
| **Linear** | Densité d'information sans surcharge, typographie propre |
| **Vercel Dashboard** | Dark mode élégant, métriques lisibles |
| **Luma** | Cartes fluides, transitions premium |
| **Uber Eats** | Rapidité de commande, hiérarchie visuelle des articles |
| **WHOOP** | Données de performance, iconographie sport |
| **Notion** | Clarté de la hiérarchie, lisibilité dense |
| **Stripe** | Tables de données propres, états vides élégants |

---

## 2. PRINCIPES UX NON NÉGOCIABLES

### 2.1 Mobile-first absolu

- Toute vue est conçue d'abord pour **375px de large** (iPhone SE)
- Ensuite adaptée tablet (768px) puis desktop (1280px+)
- Jamais l'inverse
- Zones de touch **minimum 44×44px** partout
- Pas de hover-only interaction sur mobile

### 2.2 Hiérarchie des 3 clics

Pour le joueur : **3 actions maximum** pour accomplir la tâche principale (passer une commande).

```
Tap 1 → Ouvrir menu du jour
Tap 2 → Sélectionner article(s)
Tap 3 → Confirmer commande
```

Pour les admins : **actions critiques toujours en haut**, jamais après scroll.

### 2.3 États de l'interface — toujours définis

Chaque composant doit gérer ses 5 états :

| État | Description |
|---|---|
| **Empty** | Vue sans données — illustration + message + CTA |
| **Loading** | Skeleton animé (jamais de spinner plein écran) |
| **Error** | Message clair + action de récupération |
| **Partial** | Données incomplètes — indicateur de progression |
| **Success** | Confirmation visuelle brève, non bloquante |

### 2.4 Feedback immédiat

- Toute action utilisateur : réponse visuelle en **< 100ms**
- Optimistic UI : mise à jour UI avant confirmation serveur
- Toast non bloquant en bas d'écran (auto-dismiss 3s)
- Erreurs : inline sur le champ, jamais en modal seul

### 2.5 Lisibilité en conditions réelles

La cuisine lit l'interface en lumière directe, les mains humides, sous pression.

- Taille de police **minimum 16px** sur mobile
- Contraste WCAG AA **minimum**, AAA recommandé pour la cuisine
- **Pas de texte sur fond dégradé** sans garantie de contraste
- Cartes cuisine : grande typographie, couleurs statut très distinctes

---

## 3. SYSTÈME DE DESIGN

### 3.1 Variables CSS (jamais de valeur en dur)

```css
/* Fichier : src/styles/globals.css */

:root {
  /* Fond et surfaces */
  --background: /* à définir par Claude Design */;
  --foreground: /* à définir */;
  --card: /* à définir */;
  --card-foreground: /* à définir */;

  /* Couleurs fonctionnelles */
  --primary: /* couleur action principale */;
  --primary-foreground: /* texte sur primary */;
  --secondary: /* action secondaire */;
  --secondary-foreground: /* texte sur secondary */;
  --accent: /* mise en valeur */;
  --accent-foreground: /* texte sur accent */;
  --muted: /* éléments atténués */;
  --muted-foreground: /* texte muted */;

  /* Statuts */
  --success: /* validé, livré */;
  --success-foreground: /* texte sur success */;
  --warning: /* en attente, ajusté */;
  --warning-foreground: /* texte sur warning */;
  --danger: /* refusé, erreur, urgent */;
  --danger-foreground: /* texte sur danger */;
  --info: /* informatif neutre */;
  --info-foreground: /* texte sur info */;

  /* Bordures et focus */
  --border: /* séparateurs */;
  --input: /* fond des inputs */;
  --ring: /* outline focus */;

  /* Géométrie */
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;
}
```

### 3.2 Design tokens centralisés

```css
/* Fichier : src/styles/tokens.css */

:root {
  /* Typographie */
  --font-sans: /* défini par next/font */;
  --font-mono: /* pour codes et données */;

  /* Tailles de police */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Espacement */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Ombres */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Durées d'animation */
  --duration-fast: 100ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  /* Easings */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 3.3 Couleurs de statut commande

Les statuts de commande ont des couleurs sémantiques invariables (via variables) :

| Statut | Variable | Intention |
|---|---|---|
| brouillon | `--muted` | Neutre, non soumis |
| envoyée_joueur | `--info` | En transit |
| en_attente_nutri | `--warning` | Requiert action |
| validée_nutri | `--success` | Approuvé |
| ajustée_nutri | `--warning` | Modifié |
| refusée_nutri | `--danger` | Bloqué |
| précision_demandée | `--warning` | Dialogue requis |
| transmise_resto | `--info` | En route |
| transmise_cuisine | `--info` | En production |
| transmise_hôtel | `--info` | Hôtel notifié |
| en_préparation | `--primary` | Actif |
| prête | `--success` | Livrable |
| livrée | `--success` | Terminé |
| annulée | `--muted` | Inactif |
| problème_signalé | `--danger` | Urgent |

---

## 4. COMPOSANTS CLÉS

### 4.1 AppShell

Structure commune à toutes les vues :

```
┌─────────────────────────────────┐
│  TopBar                         │  ← Logo + titre page + avatar + langue
├─────────────────────────────────┤
│                                 │
│  <children />                   │  ← Contenu principal (scroll)
│                                 │
├─────────────────────────────────┤
│  BottomNav (mobile uniquement)  │  ← 4-5 onglets selon le rôle
└─────────────────────────────────┘
```

**Desktop :** Sidebar à gauche (240px), TopBar sans BottomNav.

### 4.2 TopBar

- Hauteur : 56px mobile / 64px desktop
- Gauche : bouton retour (si sous-page) ou logo
- Centre : titre de la page courante
- Droite : sélecteur langue + avatar + menu utilisateur
- Fond : `var(--card)` avec bordure basse `var(--border)`
- **Sticky** — reste visible au scroll

### 4.3 BottomNav (mobile)

- Hauteur : 64px + safe-area-inset-bottom
- 4 à 5 onglets selon le rôle
- Icône lucide-react + label court
- Indicateur actif : couleur `var(--primary)`, trait ou fond pill
- Transitions : `var(--duration-fast)` sur le changement d'onglet

**Onglets par rôle :**

| Rôle | Onglets |
|---|---|
| Joueur | Accueil · Menu · Commander · Commandes · Profil |
| Nutritionniste | File d'attente · Joueurs · Plans · Menus · Profil |
| Restauration | Dashboard · Articles · Menus · Commandes · Profil |
| Cuisine | Kanban · En cours · Prête · Profil |
| Hôtel | Commandes · Confirmation · Profil |
| Team Manager | Déplacements · Rooming · Accès · Profil |

### 4.4 Cards

**3 variantes :**

```tsx
// Standard — contenu général
<Card>
  <CardHeader>
    <CardTitle />
    <CardDescription />
  </CardHeader>
  <CardContent />
  <CardFooter />
</Card>

// Commande — dense, avec badge statut
<OrderCard
  status={order.status}
  player={order.player}
  service={order.service}
  scheduledAt={order.scheduled_at}
  items={order.items}
/>

// Production — grande lisibilité cuisine
<ProductionCard
  reference={order.reference}
  allergens={order.allergens}
  items={order.items}
  status={order.status}
/>
```

### 4.5 StatusBadge

```tsx
<StatusBadge status="validee_nutri" />
// → Pill coloré via var(--success), texte traduit via next-intl
// → Jamais de couleur hex dans le composant
```

### 4.6 ValidationModal (nutritionniste)

Modal plein écran sur mobile, dialogue centré sur desktop.

Sections :
1. **Identité** — Joueur, service, heure
2. **Articles commandés** — liste avec portions
3. **Contexte** — allergies actives, plan du jour, protocole
4. **Historique récent** — 3 dernières commandes
5. **Actions** — Valider / Ajuster / Refuser / Demander précision
6. **Note** — champ texte traduit automatiquement

### 4.7 QueueCard (file nutri)

Carte compacte dans la file d'attente nutritionniste :

```
┌──────────────────────────────────────┐
│ 🟡  #C-002841 · Dîner · 19h30        │
│     Kylian D. · Attaque              │
│     ⚠ Sans lactose · Halal           │
│     3 articles · Soumis il y a 8 min │
│                    [Voir →]          │
└──────────────────────────────────────┘
```

### 4.8 Sélecteur de langue

- Accessible depuis TopBar (drapeau + code langue)
- Dropdown avec les 6 langues supportées
- Changement instantané, persisté en base (`profiles.preferred_lang`)
- Support RTL automatique pour `ar` (direction HTML + classes Tailwind)

---

## 5. ANIMATIONS (Framer Motion)

### 5.1 Principes

- Animations **fonctionnelles** — elles aident la compréhension, pas le spectacle
- Durées courtes : **100-300ms** pour les transitions UI
- `var(--ease-out)` pour apparitions, `var(--ease-in-out)` pour transitions
- **Respect de `prefers-reduced-motion`** — toujours

```tsx
// Wrapper réutilisable
// src/components/motion/FadeIn.tsx
const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);
```

### 5.2 Transitions de page

```tsx
// Layout animation entre routes
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 5.3 Micro-interactions clés

| Interaction | Animation |
|---|---|
| Bouton tap | Scale 0.97, duration 100ms |
| Card hover | Élévation légère (shadow-md), duration 200ms |
| Modal open | Scale 0.95→1 + fade in, duration 200ms |
| Toast apparition | Slide up depuis le bas, duration 300ms |
| Statut commande change | Flash couleur + scale pill, duration 300ms |
| Swipe action (mobile) | Translate X avec spring |
| Skeleton loading | Shimmer animé via CSS (pas JS) |

### 5.4 Ce que Claude Design ajoutera (Phase post-MVP)

- Animations d'onboarding (lottie ou Framer complexe)
- Transitions entre les 5 vues principales
- Effets de glassmorphism / blur sur les surfaces
- Particules / gradient animé pour les états succès
- Loading screen premium avec logo animé

---

## 6. TYPOGRAPHIE

### Principes

- **Police principale :** Inter (via `next/font/google`) — lisible, neutre, premium
- **Police secondaire :** non définie — Claude Design choisit
- **Hiérarchie stricte** — 4 niveaux max par écran

### Hiérarchie mobile

```
H1 (page title)     : 24px / font-bold  / leading-tight
H2 (section)        : 18px / font-semibold
H3 (sous-section)   : 16px / font-medium
Body                : 16px / font-normal / leading-relaxed
Body small          : 14px / font-normal
Caption / label     : 12px / font-medium / uppercase tracking-wide
```

### Règles

- Pas de texte en dessous de **12px**
- Labels formulaires : toujours au-dessus du champ (jamais placeholder seul)
- Erreurs : rouge (`var(--danger)`) + icône + texte court
- Aide contextuelle : muted (`var(--muted-foreground)`) + icône info

---

## 7. ICONOGRAPHIE

### Bibliothèque : lucide-react (exclusive)

- Taille standard : **20px** (stroke-width 1.5)
- Taille compacte : **16px** (dans badges, labels)
- Taille hero : **24px** (dans BottomNav)
- Couleur : toujours via `currentColor` (héritée du parent)
- **Jamais d'icône PNG ou SVG inline** — lucide uniquement

### Icônes clés par module

| Module | Icônes utilisées |
|---|---|
| Commandes | `ShoppingBag`, `Clock`, `CheckCircle`, `XCircle`, `AlertCircle` |
| Nutrition | `Heart`, `Leaf`, `Apple`, `Scale`, `FileText` |
| Cuisine | `ChefHat`, `UtensilsCrossed`, `Flame`, `Timer` |
| Hôtel | `Building`, `BedDouble`, `Key`, `Lock` |
| Déplacements | `Plane`, `MapPin`, `Calendar`, `Users` |
| Photos | `Camera`, `Image`, `Upload`, `CheckSquare` |
| Messages | `MessageCircle`, `Send`, `Languages`, `Bell` |
| Navigation | `Home`, `Menu`, `User`, `Settings`, `ChevronRight` |

---

## 8. FORMULAIRES

### Règles

- Labels toujours visibles (pas de placeholder seul)
- Validation en temps réel dès que le champ a été touché (`onBlur`)
- Message d'erreur inline, sous le champ, en `var(--danger)`
- Champs obligatoires marqués avec `*` rouge
- Sauvegarde automatique sur les longues fiches (debounce 2s)

### Composants formulaire

```tsx
// Tous via shadcn/ui + react-hook-form + zod

<FormField
  control={form.control}
  name="diet_type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t("form.diet_type")}</FormLabel>
      <FormControl>
        <Select {...field}>
          <SelectTrigger />
          <SelectContent>...</SelectContent>
        </Select>
      </FormControl>
      <FormMessage /> {/* erreur zod traduite */}
    </FormItem>
  )}
/>
```

### Fiche d'arrivée joueur — UX spécifique

- Navigation par sections avec barre de progression en haut
- Chaque section sauvegardée indépendamment
- Indicateur `% complété` visible en permanence
- Possibilité de sauter une section et y revenir
- Aide contextuelle au tap sur l'icône `?`

---

## 9. VUES PRINCIPALES — STRUCTURE

### Vue Joueur — Accueil

```
┌─────────────────────────────────┐
│ TopBar : Bonjour Kylian · 🇬🇧   │
├─────────────────────────────────┤
│  Prochaine commande             │
│  ┌──────────────────────────┐   │
│  │ Dîner · 19h30 · Validée ✓│   │
│  └──────────────────────────┘   │
│                                 │
│  Menu du jour                   │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │     │ │     │ │     │       │
│  │ Art │ │ Art │ │ Art │       │
│  └─────┘ └─────┘ └─────┘       │
│                                 │
│  Mes commandes récentes         │
│  ──────────────────────────     │
│  [Voir tout]                    │
├─────────────────────────────────┤
│ 🏠 Menu  🛒 Commander  📋  👤   │
└─────────────────────────────────┘
```

### Vue Nutritionniste — File d'attente

```
┌─────────────────────────────────┐
│ File d'attente  🔴 3 en attente │
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │
│ │ 🟡 #C-002841 · Dîner     │    │
│ │    Kylian D. · ⚠ Lactose │    │
│ │    8 min                 [→]  │
│ └──────────────────────────┘    │
│ ┌──────────────────────────┐    │
│ │ 🟡 #C-002842 · Déjeuner  │    │
│ │    Marcus T. · Halal     │    │
│ │    23 min               [→]   │
│ └──────────────────────────┘    │
├─────────────────────────────────┤
│ 📋 File  👥 Joueurs  📊  👤    │
└─────────────────────────────────┘
```

### Vue Cuisine — Kanban production

```
┌──────────┬──────────┬──────────┐
│ À PRODUIRE│ EN COURS │  PRÊTE   │
│    (4)   │   (2)    │   (1)    │
├──────────┼──────────┼──────────┤
│ C-002841 │ C-002839 │ C-002837 │
│ Dîner    │ Déjeuner │ Dîner    │
│ 19h30    │          │ ✓ Prête  │
│ ⚠ Halal  │          │          │
│ [Démarrer│[Terminer]│[Livrer]  │
└──────────┴──────────┴──────────┘
```

### Vue Hôtel — Commandes chambre

```
┌─────────────────────────────────┐
│ Hôtel Marriott · Déplacement    │
│ Paris · 15-16 mai 2025          │
├─────────────────────────────────┤
│ ┌──────────────────────────┐    │
│ │ 🟠 Chambre 412           │    │
│ │    Room service · 21h00  │    │
│ │    3 articles            │    │
│ │         [Confirmer →]    │    │
│ └──────────────────────────┘    │
│ ┌──────────────────────────┐    │
│ │ ✅ Chambre 308 · Livré   │    │
│ │    [Photo] [Détail]      │    │
│ └──────────────────────────┘    │
├─────────────────────────────────┤
│ 📋 Commandes  📷 Confirmations  │
└─────────────────────────────────┘
```

---

## 10. RESPONSIVE

### Breakpoints

```css
/* Tailwind defaults utilisés */
sm:  640px   /* téléphone paysage */
md:  768px   /* tablette portrait */
lg:  1024px  /* tablette paysage / laptop */
xl:  1280px  /* desktop */
2xl: 1536px  /* grand écran */
```

### Adaptations par breakpoint

| Élément | Mobile (< 768px) | Tablet (768-1024px) | Desktop (> 1024px) |
|---|---|---|---|
| Navigation | BottomNav (5 onglets) | BottomNav ou mini-sidebar | Sidebar fixe 240px |
| Cards | Pleine largeur | 2 colonnes | 3-4 colonnes |
| Kanban cuisine | Swipe horizontal | 2 colonnes | 3 colonnes fixes |
| Modal validation | Plein écran | Dialogue centré 80% | Dialogue centré 600px |
| Table dashboard | Scroll horizontal | 2 colonnes | Tableau complet |
| Menu latéral | Drawer depuis la gauche | Drawer | Sidebar permanente |

---

## 11. ACCESSIBILITÉ

### Règles obligatoires

- **WCAG 2.1 niveau AA** minimum sur tout le produit
- **WCAG AAA** sur les interfaces cuisine et hôtel (conditions difficiles)
- Tous les éléments interactifs accessibles au **clavier**
- **Focus visible** sur tous les éléments (outline `var(--ring)`)
- Textes alternatifs sur toutes les images fonctionnelles
- Formulaires liés par `htmlFor` / `aria-labelledby`
- Statuts de commande annoncés au lecteur d'écran (`aria-live`)

### Support RTL (arabe)

```tsx
// layout.tsx — direction automatique selon locale
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>

// Tailwind RTL via plugin ou classes conditionnelles
className={cn("ml-4", locale === 'ar' && "mr-4 ml-0")}
// ou via le plugin @tailwindcss/forms avec rtl: variant
```

---

## 12. PÉRIMÈTRE CLAUDE DESIGN (Phase post-MVP)

Ce que le design de développement **prépare** mais ne finalise pas :

### Structure préparée, esthétique réservée

| Préparé en dev | Finalisé par Claude Design |
|---|---|
| Variables CSS vides nommées | Valeurs exactes des couleurs |
| Tokens de rayon, ombres | Effets glassmorphism, blur, glow |
| Composants shadcn basiques | Personnalisation avancée et effets |
| Animations Framer simples | Transitions et onboarding premium |
| Squelette typographique | Police secondaire, poids, espacements fins |
| Icônes lucide standards | Icônes custom si nécessaire |

### Livrables attendus de Claude Design

1. **Palette complète** — primary, accent, gradients, surfaces light/dark
2. **Thème clair et thème sombre** — variables CSS pour les deux
3. **Onboarding screens** — 3 à 5 écrans d'introduction
4. **Illustration système** — états vides, succès, erreurs
5. **Animations avancées** — transitions signature de l'app
6. **Moodboard** — ambiance générale, photos de référence

---

*Dernière mise à jour : initialisation projet. Ce document vit avec le produit.*
*Toute modification structurante → noter dans `docs/ROADMAP.md`.*

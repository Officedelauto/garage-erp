# Garage ERP

Gestion de garage automobile : clients, véhicules, stock, devis/factures conformes, tableau de bord, et SAV intelligent (DeepSeek).

## Stack

Next.js 16 (App Router) + TypeScript, PostgreSQL + Prisma, Tailwind CSS.

## Installation locale

### 1. Prérequis

- Node.js 20.9+ (idéalement 22+)
- PostgreSQL (local ou distant)

### 2. Dépendances

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` contourne un bug connu de `npm install` sur certains graphes de dépendances (Arborist). Sans ce flag, l'installation peut échouer avec `Cannot read properties of null (reading 'edgesOut')`.

### 3. Variables d'environnement

Copier `.env.example` vers `.env` (à créer si absent) et renseigner :

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/garage_erp?schema=public"
SESSION_SECRET="<générer avec: openssl rand -base64 32>"
DEEPSEEK_API_KEY="sk-..."   # optionnel, requis pour le module SAV intelligent
```

### 4. Base de données

```bash
npx prisma migrate deploy   # applique les migrations
npm run seed                # crée un compte admin + une entreprise par défaut
```

Compte créé par le seed : `admin@garage.local` / `changeme123` (à changer après connexion — pas d'écran dédié pour l'instant, à mettre à jour directement en base ou via une future page profil).

### 5. Lancer le projet

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Points de vigilance / travail restant

- **Facturation électronique (réforme France 2026-2027)** : les factures générées sont légalement correctes (mentions obligatoires, numérotation séquentielle, PDF) mais **ne sont pas encore connectées à une PDP** (Plateforme de Dématérialisation Partenaire) ni au format Factur-X. À faire avant l'échéance réglementaire applicable à l'entreprise.
- **Réglages entreprise** (`/parametres`) : à compléter avec les vraies informations (SIRET, TVA, IBAN) avant d'émettre de vraies factures — ces informations sont figées sur chaque document au moment de sa finalisation.
- **SAV intelligent** (`/sav`) : nécessite une clé API DeepSeek valide (`DEEPSEEK_API_KEY`) pour fonctionner.
- **Commande vocale** : non implémentée.

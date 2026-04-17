# Vacances entre amis (React + Vite + Supabase)

Application V1 pour organiser les vacances d’un groupe fixe sur juillet/août :
- disponibilités des personnes
- vacances déjà prévues
- lieux/maisons disponibles
- meilleures dates classées automatiquement
- filtres + export CSV du récap
- notes locales et marquage des dates incontournables/impossibles

## Stack
- React + Vite
- Supabase (Postgres + RPC)
- GitHub Pages (déploiement auto via GitHub Actions)

## Installation

```bash
npm install
```

## Configuration

1. Créer un projet Supabase.
2. Exécuter le SQL : `supabase/schema.sql`.
3. Copier `.env.example` en `.env` et renseigner :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Lancement local

```bash
npm run dev
```

## Build local

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test
```

## Déploiement GitHub Pages

1. Pousser sur `main`.
2. Ajouter les secrets GitHub du repo :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Activer **GitHub Pages** > Source: **GitHub Actions**.
4. Le workflow `.github/workflows/deploy.yml` déploie automatiquement.

## Choix techniques (bref)

- **Prénom uniquement** via RPC SQL : usage ultra simple pour un groupe privé.
- **RPC SECURITY DEFINER** pour les écritures : évite d’ouvrir les tables en écriture.
- **Juillet/Août au niveau DB** (check constraints) : robustesse des données.
- **UI simple et responsive** pour usage mobile facile.

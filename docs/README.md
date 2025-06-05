# 🥊 Sparring RESTful API

API REST sécurisée et robuste pour la gestion de sparrings, utilisateurs, sessions, profils, et plus encore.

---

## 🚀 Présentation

Sparring RESTful API est un backend moderne construit avec :

- **Node.js**, **Express.js**
- **TypeScript**
- **PostgreSQL** via Prisma ORM
- **Authentification JWT**
- **Validation Zod**
- **Documentation Swagger**
- **Observabilité Prometheus**
- **Logs Winston, Morgan**

---

## ⚡ Démarrage rapide

### ✅ Prérequis

- Node.js v20+
- npm v9+
- PostgreSQL
- (Optionnel) Docker

---

### 🛠️ Installation

```bash
git clone https://github.com/salemshah/workshop-mds-saparring-finder.git
cd workshop-mds-saparring-finder
cp .env.example .env
# Modifier .env selon votre configuration
npm install
```

---

### 🚧 Lancer en développement

```bash
npm run dev
# Serveur sur http://localhost:8000
```

---

### 📦 Lancer en production

```bash
npm run build
npm start
```

---

### 🐳 Lancer avec Docker

```bash
docker compose up --build
```

---

## 🧠 Fonctionnement général

- **Express.js** : Gestion des routes et de la logique serveur
- **Prisma** : ORM pour PostgreSQL
- **JWT** : Authentification sécurisée
- **Zod** : Validation de données
- **Swagger** : Documentation interactive
- **Winston & Morgan** : Logging
- **Prometheus** : Monitoring et métriques

---

## 🗂️ Structure du projet

```
src/
│
├── controllers/     → Logique des endpoints (user, profile, sparring, etc.)
├── services/        → Logique métier (UserService, etc.)
├── routes/          → Définition des routes Express
├── middlewares/     → Auth, validation, gestion des erreurs
├── prisma/          → Schéma et client Prisma
├── config/          → Chargement de la configuration .env
├── utils/           → Fonctions utilitaires, helpers, logger
├── loaders/         → Initialisation des middlewares, Swagger, Prometheus
├── docs/            → Documentation Swagger (swagger.yaml)
└── server.ts        → Point d'entrée de l'application
```

---

## 🔐 Principales fonctionnalités

- ✅ Authentification JWT (Inscription, Connexion, Email Verification, Reset Password)
- 🧍‍♂️ Gestion de profils utilisateurs
- 📅 Gestion des disponibilités
- 🥊 Création et gestion des sessions de sparring
- 📩 Notifications email via Nodemailer
- 📊 Métriques Prometheus
- 📜 Documentation Swagger
- 🧪 Tests (Jest, Supertest)
- 🔒 Sécurité via Helmet & CORS

---

## 📌 Routes principales

| Méthode | Route                              | Description                           |
|---------|------------------------------------|---------------------------------------|
| POST    | `/api/user/register`               | Inscription                           |
| POST    | `/api/user/login`                  | Connexion                             |
| POST    | `/api/user/verify-email`           | Vérification d’email                  |
| POST    | `/api/user/resend-verification`    | Renvoi code de vérification           |
| POST    | `/api/user/forgot-password`        | Demande de reset du mot de passe      |
| PUT     | `/api/user/reset-password`         | Réinitialisation du mot de passe      |
| CRUD    | `/profile`                         | Gestion du profil utilisateur         |
| CRUD    | `/availability`                    | Gestion des disponibilités            |
| CRUD    | `/sparring`                        | Gestion des sparrings                 |

---

- 📚 **Documentation complète via Swagger** : [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- 📈 **Métriques Prometheus** : [http://localhost:8000/metrics](http://localhost:8000/metrics)

---

## 📦 Librairies clés

| Fonction           | Librairies                           |
|--------------------|--------------------------------------|
| Serveur & routes   | express, express-async-errors        |
| ORM & DB           | prisma, @prisma/client               |
| Authentification   | jsonwebtoken, bcrypt                 |
| Validation         | zod                                  |
| Logs               | winston, morgan                      |
| Emails             | nodemailer                           |
| Documentation      | swagger-ui-express                   |
| Monitoring         | prom-client                          |
| Tests              | jest, supertest                      |
| DI (Injection)     | typedi                               |

---

## ⚙️ Variables d’environnement

À configurer dans `.env` :

| Variable                | Description                                   |
|-------------------------|-----------------------------------------------|
| PORT                    | Port du serveur (ex: 8000)                    |
| DATABASE_URL            | URL PostgreSQL                                |
| ACCESS_TOKEN_SECRET     | Secret JWT                                    |
| REFRESH_TOKEN_SECRET    | Secret JWT Refresh                            |
| EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM | SMTP        |
| FRONTEND_URL_VERIFY_EMAIL      | URL de redirection après vérification    |
| FRONTEND_URL_FORGOT_PASSWORD   | URL de redirection après reset password  |

---

## 🛠️ Scripts utiles

| Commande                | Description                                   |
|-------------------------|-----------------------------------------------|
| `npm run dev`           | Démarre le serveur en dev avec nodemon        |
| `npm run build`         | Compile le projet TypeScript                  |
| `npm start`             | Démarre le serveur en production              |
| `npm run prisma:migrate`| Applique les migrations Prisma                |
| `npm run test`          | Exécute les tests unitaires                   |
| `npm run lint`          | Lint du code avec ESLint                      |

---

## 🧩 Comment ça fonctionne ?

1. L’utilisateur s’inscrit via `/register`.
2. Il reçoit un code de vérification par email.
3. Une fois vérifié, il peut se connecter (`/login`) et reçoit un JWT.
4. Il peut gérer son profil, ses disponibilités et participer à des sessions.
5. Toutes les routes sont sécurisées, validées (Zod) et loguées (Winston).

---

## 📚 Documentation

- **Swagger** : [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
- **Prometheus** : [http://localhost:8000/metrics](http://localhost:8000/metrics)
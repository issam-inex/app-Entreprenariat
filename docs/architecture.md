# Architecture cible

## Monorepo

| Emplacement | Responsabilité |
| --- | --- |
| `frontend/` | React en JavaScript et JSX avec Vite. Routes et layouts par espace avec React Router. Tailwind CSS reprend les couleurs existantes. TanStack Query gère les données distantes. Axios gère HTTP. React Hook Form et Zod structurent les formulaires. |
| `backend/` | Laravel REST, PHP stable compatible, MySQL et Eloquent. Laravel 13 est la base proposée pour conserver la compatibilité du prototype. Épingler les versions supportées et vérifier les extensions au démarrage de la Phase 1. |
| `docs/` | Produit, architecture, ERD, contrat API, décisions et roadmap |
| `infrastructure/` | Docker Compose local, services PHP, MySQL, stockage de développement, mail de test, worker et scheduler. Redis si le volume ou le déploiement le justifie. |
| `.github/workflows/` | CI séparée frontend et backend, avec intégration MySQL et contrôle du contrat OpenAPI |

Chaque application a son manifeste, son verrou de dépendances et ses commandes. Le frontend organise son code par fonctionnalités `auth`, `missions`, `applications`, `deliverables` et `admin`, avec des composants et clients partagés. Invalider le cache après mutation, le vider à la déconnexion ou au changement de compte et éviter de persister les données privées de TanStack Query.

## Laravel

- Controllers fins, Form Requests pour valider et API Resources pour projeter les champs JSON par audience. Les Policies couvrent la propriété et les actions par ressource. Les Gates couvrent les opérations administratives transversales.
- Models Eloquent pour les relations. Enums PHP pour les rôles et les états. Services pour la vérification, l’attribution, la réception et la revue des livrables. Migrations, Factories, Seeders et Tests suivent la structure native Laravel.
- Middleware pour Sanctum, e-mail vérifié, limites de débit et contrôles transversaux. Les Policies gardent la décision métier, y compris l’état vérifié de l’entreprise.
- Events et Listeners après commit pour les transitions et Laravel Notifications pour les e-mails et notifications internes. Jobs et Queues pour l’analyse des fichiers, les notifications externes et, ultérieurement, les évaluations. MVP possible avec une file MySQL. Redis est une option pour les files, le cache ou les limites distribuées.
- Laravel Scheduler pour les relances et purges selon la politique de conservation approuvée, avec anti-chevauchement. Surveiller les jobs échoués et prévoir reprises et clés d’idempotence.

## Sessions et données privées

Origine unique recommandée en production, avec reverse proxy vers React et Laravel. Sur des sous-domaines apparentés, déclarer uniquement les origines frontend exactes dans CORS, autoriser les credentials et renseigner les hôtes et ports stateful Sanctum. Déclarer le middleware stateful dans la pile API. Axios initialise `GET /sanctum/csrf-cookie`, envoie les cookies et transmet `X-XSRF-TOKEN` pour les mutations. Cookie de session HttpOnly, Secure sous HTTPS en production et SameSite=Lax comme base à tester. Le cookie XSRF est lisible par Axios. Régénérer la session à la connexion et l’invalider à la déconnexion. Aucune authentification navigateur par jeton dans le stockage local. [Documentation Sanctum](https://laravel.com/framework/docs/13.x/sanctum)

Vérification e-mail via lien signé et limité dans le temps, réinitialisation via le broker Laravel avec réponses neutres, expiration et révocation des sessions après réinitialisation. Limites par IP et compte selon l’opération. MFA proposé pour les administrateurs. Les rôles sont déterminés côté serveur. Un compte Admin est provisionné par une procédure interne et ne peut être créé via l’inscription.

Justificatifs et livrables utilisent un disque privé, des clés opaques et des métadonnées en MySQL. Prévoir limites de taille, liste blanche de formats, contrôle MIME réel, quarantaine et analyse avant accès, puis téléchargement derrière une Policy. Pas d’URL publique permanente. Les clés, jetons, fichiers et données personnelles sensibles sont exclus des journaux. Journaliser décisions, consultations de justificatifs, changements de privilèges et opérations sensibles avec acteur, cible, date et référence de requête.

## IA après le MVP

`AIService` orchestre un contrat fournisseur interchangeable. Un job identifie une version saine et autorisée, transmet uniquement le contenu approuvé, traite les erreurs et stocke résultat, fournisseur et version de l’évaluation. Le résultat reste une proposition jusqu’à la revue humaine. L’évaluation traite les fichiers comme des données. Le serveur et ses workers Laravel n’exécutent jamais le code étudiant. Tout éventuel environnement d’exécution isolé fera l’objet d’une décision séparée.

## Qualité

GitHub Actions cible ESLint, Prettier, build Vite et tests frontend, puis PHPUnit, Pint, Larastan et migrations sur MySQL. Valider le fichier OpenAPI et vérifier les chemins et réponses principaux avec les tests d’intégration. Prévoir des tests navigateur sur la connexion, la validation d’entreprise, la publication et le dépôt privé. Les stratégies de déploiement, de stockage et de sauvegarde restent soumises à validation.

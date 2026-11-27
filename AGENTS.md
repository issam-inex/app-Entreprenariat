# Instructions pour StageLik

- Respecter le périmètre approuvé. La Phase 0 autorise uniquement la documentation. Attendre la validation explicite avant toute migration, installation de dépendance, modification applicative ou création de workflow CI.
- Lire [la roadmap](docs/roadmap.md) et les décisions ouvertes avant de modifier une fonctionnalité. Documenter les changements de contrat API, de droits ou de modèle de données.
- Utiliser React en JavaScript et JSX avec Vite dans `frontend/`, Laravel et MySQL dans `backend/`, la documentation dans `docs/` et Docker dans `infrastructure/`.
- Préserver le thème StageLik, le français, la navigation mobile et l’accessibilité. Utiliser React Router, TanStack Query, Axios, Tailwind CSS, React Hook Form et Zod.
- Préférer Eloquent aux repositories génériques. Utiliser Form Requests, API Resources, Policies et Gates. Réserver les Services aux opérations métier qui coordonnent transitions, transactions ou effets externes.
- Vérifier les rôles, états et propriétaires dans Laravel pour chaque opération. Utiliser les sessions Sanctum et CSRF. Aucun jeton d’authentification dans localStorage.
- Toute entreprise est en attente à la création. Seul un administrateur autorisé prend une décision de vérification. Contrôler le statut à chaque accès privé et publication. Tester les refus et les tentatives de modification de champs serveur.
- Garder justificatifs et livrables privés. Préserver les secrets et exclure les données réelles des fixtures, des journaux et du dépôt. Ne jamais exécuter de code étudiant sur le serveur Laravel.
- Vérifier les changements avec PHPUnit, Pint, Larastan, ESLint, Prettier et les tests frontend concernés dès que ces outils sont configurés. Conserver le contrat OpenAPI à jour.

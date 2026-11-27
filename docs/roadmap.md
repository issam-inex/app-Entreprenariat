# Roadmap et décisions

| Phase | Livrables | Critère de passage |
| --- | --- | --- |
| 0 · Conception | Besoins, MVP, architecture, MySQL, ERD, contrat REST, droits, workflows et risques | Validation explicite de la conception et des décisions qui bloquent la Phase 1 |
| 1 · Fondations | React JavaScript et JSX dans `frontend/`, Laravel, migrations, Docker, OpenAPI et CI. Sanctum, rôles, vérification e-mail et récupération. | Exécution locale reproductible, CI verte, tests cookies, CSRF, CORS et accès |
| 2 · Vérification | Dossiers et pièces privées, contrôles opérateur, interface admin, décisions, historique et notifications | Chaîne de vérification testée et contournements bloqués |
| 3 · Missions | Brouillons, publication, recherche, filtres, candidatures et sélection | Publication réservée aux entreprises vérifiées et accès strictement propriétaire |
| 4 · Livrables et pilote MVP | Dépôt privé, versions, analyse, revue humaine, audit, sauvegarde et recette | Parcours complet testé, revue sécurité et conformité avant ouverture |
| 5 · Évolutions | Évaluation assistée par IA, jobs, mode de revue humaine et extensions priorisées | Validation des données envoyées au fournisseur et validation humaine documentée |

## Décisions à valider

| Sujet | Proposition et point ouvert | Avant |
| --- | --- | --- |
| Dossier marocain | Fixer les pièces admissibles, leur fraîcheur, la référence du greffe, la gestion des doublons et le budget d’obtention de preuves officielles. Valider l’usage manuel OMPIC / DirectInfo. | Phase 2 |
| Administration | Nommer les opérateurs et leurs suppléants, définir MFA, délais de revue, motifs, procédure de recours et qui peut suspendre ou rouvrir. | Phase 2 |
| Confidentialité | Confirmer avec le responsable compétent les données strictement requises, les formalités CNDP, la conservation, le lieu d’hébergement et les transferts éventuels. [CNDP](https://www.cndp.ma/notifier-un-traitement/) | Avant collecte réelle, choix de stockage en Phase 1 |
| Règles de mission | Valider un seul étudiant par mission, dates limites, règles de correction après candidatures, annulation et traitement d’une suspension en cours de mission. | Phase 3 |
| Échanges et contact | Valider le suivi par notifications et demandes de correction pour le MVP, puis le périmètre, le consentement et les coordonnées éventuellement visibles. | Phase 3 |
| Livrables | Approuver les types et tailles de fichiers, l’analyse en quarantaine, la durée de rétention et le traitement des archives. | Phase 4 |
| Données du prototype | Proposer de n’importer que des jeux fictifs identifiés. Définir explicitement si une reprise réelle est nécessaire. Ne jamais promouvoir les anciens statuts sur la seule base d’un `approved` de démonstration. | Phase 1 |
| Déploiement | Valider domaine, topologie origine unique, versions, sauvegardes et procédure de restauration. | Phase 1 |
| IA | Choisir le fournisseur, les données autorisées, le budget, les conditions de conservation et les critères de validation humaine. | Phase 5 |

## Risques et contrôles

| Risque | Contrôle et validation |
| --- | --- |
| Fausse entreprise, document falsifié ou représentant non habilité | Rapprochement manuel via sources officielles, preuve de mandat, contrôles consignés et revue des cas douteux |
| Fuite de documents ou d’identités étudiantes | Stockage privé, filtrage des réponses, autorisation au téléchargement, audit et tests d’accès croisé |
| Actions après suspension | Lecture du statut courant côté Laravel, verrouillage des transitions, retrait du catalogue et tests de session préexistante |
| Duplications, décisions concurrentes et notifications répétées | Unicité MySQL, transactions, verrouillage et effets après commit idempotents |
| Panne de queue, perte ou fuite de données | Suivi des jobs, restauration testée, séparation des secrets et accès au stockage |
| Délais de vérification manuelle | File filtrable, délai cible, motifs réutilisables et suivi du stock |
| Fichiers hostiles ou résultats IA erronés | Quarantaine et revue humaine. Aucun code étudiant exécuté sur Laravel. |

La recette de sécurité comprend des tests PHPUnit de rôle, de propriété, de transitions, de refus de champs serveur, de concurrence et de réémission de demandes. Elle inclut des tests d’intégration MySQL pour les contraintes et des tests navigateur des cookies, de l’interface admin et des parcours critiques.

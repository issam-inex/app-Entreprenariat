# Produit et MVP

StageLik met en relation des étudiants et des entreprises marocaines autour de missions courtes avec un objectif, une échéance et un livrable identifiables.

| Acteur | Besoin | Parcours MVP |
| --- | --- | --- |
| Visiteur | Comprendre le service et choisir un parcours | Accueil, inscription étudiant ou entreprise, connexion commune |
| Étudiant | Trouver une mission et prouver sa contribution | Vérifier son e-mail, filtrer les missions, consulter le détail, postuler, suivre sa candidature, déposer un livrable |
| Représentant | Trouver un étudiant et recevoir un résultat | S’inscrire, constituer le dossier, préparer des brouillons, publier après validation, examiner les candidatures et valider le livrable |
| Administrateur | Réduire les abus et traiter les dossiers | Consulter la file, vérifier les preuves, décider, suspendre et consulter l’historique |

Le MVP comprend un représentant et un étudiant retenu par mission. La sélection et les demandes de correction structurées suffisent au suivi opérationnel. Messagerie temps réel, paiements, comptes entreprise multi-utilisateurs, notation publique et évaluation IA automatisée sont à programmer après le MVP. Le bouton de contact du prototype n’implique aucune exposition automatique des coordonnées. Toute fonctionnalité de contact ultérieure devra être réservée aux entreprises vérifiées et aux étudiants liés à leurs missions, selon un consentement et un périmètre approuvés.

## Workflow proposé

| Objet | Transition | Condition |
| --- | --- | --- |
| Mission | `draft → published` | Entreprise propriétaire vérifiée, e-mail confirmé, fiche complète |
| Mission | `published → in_progress` | Sélection atomique d’une candidature reçue. Les autres candidatures sont refusées et la mission sort du catalogue. |
| Mission | `in_progress → completed` | Acceptation humaine d’un livrable soumis |
| Mission | `draft/published → cancelled` | Entreprise propriétaire, motif et notification aux candidats si nécessaire |
| Candidature | `submitted → withdrawn` | Étudiant auteur avant sélection |
| Candidature | `submitted → accepted/rejected` | Entreprise vérifiée et propriétaire, acceptation unique |
| Livrable | `submitted → changes_requested/accepted` | Entreprise vérifiée et propriétaire, fichier déclaré sain |
| Livrable | Nouvelle version `submitted` | Étudiant retenu, mission en cours, version précédente à corriger |

Modifier un brouillon reste libre pour son propriétaire. Après la première candidature, réserver les modifications aux corrections mineures sans effet sur la durée, le périmètre ni les compétences. Annuler et republier si les conditions changent substantiellement. La suspension retire les missions ouvertes du catalogue et bloque l’accès privé de l’entreprise immédiatement. L’administration organise ensuite le traitement des missions en cours avec les étudiants concernés. Les règles de reprise sont à valider.

## Recette produit

- Un étudiant retrouve ses candidatures après reconnexion et ne postule qu’une fois à une mission ouverte.
- Un représentant non vérifié peut préparer un brouillon. Sa publication et la consultation des candidatures sont refusées côté serveur.
- Une entreprise vérifiée voit uniquement les candidats à ses missions. Un étudiant retenu dépose un livrable privé et reçoit la décision.
- L’administration retrouve chaque décision de vérification et son auteur. L’entreprise reçoit un résultat compréhensible, avec les corrections attendues en cas de refus.
- L’interface conserve le thème bleu, vert et fond clair, fonctionne sur mobile et au clavier, et présente les chargements, erreurs, états vides et confirmations en français.

# Données et endpoints nécessaires aux prochains lots UI

Le lot design system, navigation et accueil utilise les parcours et endpoints déjà présents. Il ne requiert aucune modification Laravel. Les exemples de catégories et l’aperçu d’accueil sont identifiés comme illustrations.

| Besoin UI | Données ou opération disponibles | Proposition à valider côté Laravel |
| --- | --- | --- |
| Catalogue et carte enrichie | Mission, intitulé, description, durée libre, compétences, statut et nom de l’entreprise. Le catalogue étudiant impose une entreprise vérifiée. | Ajouter un logo facultatif autorisé à la publication, la difficulté, une échéance de candidature et, si utile au filtrage, une durée structurée et une catégorie. |
| Recherche à grande échelle | Liste authentifiée actuelle sans pagination côté serveur | Définir le catalogue paginé avec recherche, filtres et tri validés. Préserver les règles de visibilité et les ressources publiques prévues dans le contrat. |
| Détail d’une mission | Description, objectifs, consignes, livrables attendus et critères d’évaluation. Les quatre derniers champs sont facultatifs. | Prévoir un endpoint détail qui applique les mêmes droits que le catalogue. |
| Suivi étudiant | Identifiants des missions auxquelles le compte a postulé | Ajouter une liste privée des candidatures avec date, statut et résumé de mission. Les missions en cours et les échéances demandent le workflow d’attribution. |
| Suivi entreprise | Missions propres et candidatures reçues d’une entreprise vérifiée | Ajouter les transitions de sélection et de clôture prévues. Les talents identifiés supposent un mécanisme de sélection ou de liste approuvé. |
| Livrables, évaluations et compétences | Données indisponibles | Réaliser le dépôt privé et la revue humaine avant d’exposer les statuts, l’historique ou des indicateurs de compétences. |
| Dossier de vérification pas à pas | Soumission multipart unique, historique paginé et décisions administratives | Conserver la saisie par étapes dans le frontend jusqu’à soumission. Un brouillon repris sur un autre appareil demanderait un stockage serveur et des droits supplémentaires. |

Voir le [contrat API v1](api-v1.md) et la [roadmap](roadmap.md) pour les transitions et les décisions ouvertes.

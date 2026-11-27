# Rôles et permissions

Les rôles `student`, `company` et `admin` sont exclusifs au MVP. Sanctum identifie le compte. Les Policies déterminent les opérations selon le rôle, la propriété, l’état métier et la confirmation e-mail requise. React utilise les droits retournés par l’API pour adapter la navigation et l’affichage.

| Opération | Visiteur | Étudiant | Entreprise non vérifiée | Entreprise vérifiée | Admin habilité |
| --- | --- | --- | --- | --- | --- |
| Consulter le catalogue public | Oui | Oui | Oui | Oui | Oui |
| Consulter ou modifier son profil | — | Propre profil | Propre profil | Propre profil | Propre compte |
| Soumettre un dossier de vérification | — | — | Propre dossier, e-mail confirmé | Recontrôle selon transition | Consulte et instruit |
| Accéder à un justificatif sain | — | — | Propre dossier | Propre dossier | Dossier à traiter |
| Rendre une décision de vérification | — | — | — | — | Selon état, contrôle et habilitation |
| Préparer une mission | — | — | Brouillon propre | Brouillon propre | — |
| Publier, modifier ou annuler une mission publiée | — | — | — | Propre mission selon son état | — |
| Postuler ou retirer une candidature | — | Propre candidature, e-mail confirmé, transition valide | — | — | — |
| Voir ou sélectionner les candidats | — | Ses candidatures uniquement | — | Missions propres, e-mail confirmé | — |
| Déposer ou consulter un livrable privé | — | Étudiant retenu, accès propre | — | Consultation des missions propres | — |
| Valider ou demander une correction | — | — | — | Mission propre, fichier sain | — |

Les ressources publiques masquent les identités et données privées. Le statut `verified` est relu au moment d’une opération protégée et contrôlé en transaction pour les transitions critiques. La modération générale des missions requiert une habilitation distincte à définir.

# Vérification des entreprises au Maroc

## Dépôt et contrôle

1. Le représentant crée un compte Company. Le serveur attribue `pending`. L’inscription recueille la raison sociale, l’ICE, le numéro de registre du commerce, la ville d’immatriculation, l’e-mail professionnel, le nom et la fonction du représentant et un justificatif légal. Les pièces sont chargées après création du compte via un formulaire privé, dans le même parcours d’inscription.
2. Le représentant confirme son adresse via un lien signé. Le dossier ne peut être soumis qu’avec un e-mail confirmé, les champs requis et des pièces saines. Un domaine professionnel aide au contrôle. Il ne prouve pas le lien du représentant avec l’entreprise.
3. L’administrateur recherche l’entité au Registre Central du Commerce via les services OMPIC dont DirectInfo. Il rapproche la raison sociale, l’ICE lorsque disponible, le RC et le greffe ou la ville. Il examine l’existence et la situation de l’entreprise à partir des sources et pièces officielles. Il peut commander un document disponible ou demander une preuve complémentaire selon la procédure approuvée. Aucun accès à une API OMPIC n’est présumé ni requis. [Services du RCC de l’OMPIC](https://www.ompic.ma/fr/services-rcc)
4. L’administrateur vérifie que le représentant apparaît sur une pièce officielle ou dispose d’un mandat signé par une personne habilitée. En cas de doute, demander une confirmation par un canal professionnel obtenu indépendamment du dossier. Consigner les contrôles, références, date et résultat sans recopier inutilement les pièces.
5. L’administrateur rend une décision motivée dans l’interface. La transaction enregistre la décision et l’audit puis déclenche la notification après commit. Le refus contient un motif compréhensible et les corrections attendues. Un dossier inconclusif reste en attente de preuves.

## États et droits

| État | Capacités entreprise | Transition |
| --- | --- | --- |
| `pending` | Profil, pièces du dossier et brouillons. Aucune publication, donnée privée étudiante ou prise de contact. | Admin vers `verified` ou `rejected` sur dossier soumis |
| `verified` | Badge « Entreprise vérifiée » et opérations autorisées sur ses propres missions | Admin vers `rejected` ou `suspended` avec motif |
| `rejected` | Corriger le profil et préparer une nouvelle demande | Nouvelle soumission vers `pending`, ou révision par un admin vers `verified` sur le dossier courant avec motif et contrôles confirmés |
| `suspended` | Capacités limitées au profil, dossier et brouillons. Badge retiré et accès privé bloqué immédiatement. | Réouverture par un admin vers `pending`, puis nouveau contrôle |

Un dossier en préparation peut être modifié. Après soumission, son instantané est figé. Une demande de complément peut clôturer le dossier avec motif de correction et ouvrir une nouvelle tentative. Sous réserve de validation, un changement d’identité légale, de représentant ou d’adresse vérifiée déclenche un nouveau contrôle et retire temporairement les droits associés. Les valeurs du statut, du rôle, du propriétaire et des décisions viennent toujours du serveur. Des conflits d’ICE ou de RC sont signalés à l’administration avec un message neutre au demandeur.

## Interface d’administration

File filtrable par état, ville et date. Détail avec comparaison des données, téléchargement contrôlé des pièces propres au dossier, checklist e-mail, existence et représentant, historique des tentatives et décisions. Actions de validation, refus et suspension avec motif et confirmation. Aucune décision concurrente contradictoire. Journaliser l’accès aux pièces avec l’identifiant du dossier et de l’opérateur.

Les justificatifs sont privés. Le déposant accède à ses propres pièces autorisées, et seuls les administrateurs habilités accèdent aux pièces nécessaires au contrôle. Pas de lien public ni d’accès par identifiant seul. Le badge public contient uniquement l’état déduit par Laravel. Les canaux, formats et durées de conservation doivent être validés avec le responsable de la protection des données. [CNDP, démarches de notification](https://www.cndp.ma/notifier-un-traitement/)

## Tests bloquants prévus

- Inscription avec rôle admin ou statut imposé, changement d’état via PATCH, e-mail non confirmé, et soumission avec champs ou preuves manquants.
- Tentative directe de publication, d’accès aux candidats et au contact dans chaque état non vérifié, y compris avec une session créée avant suspension.
- Accès interentreprises aux dossiers et justificatifs, téléchargement sans session ou sans autorisation, fichier hors format ou limite et fichier en quarantaine.
- Décision par un non-admin, décision sans contrôle requis, double décision simultanée, rejeu de notification et rejet suivi d’une demande corrigée.
- Mise à jour du badge et du catalogue après suspension, protection des données privées dans les ressources JSON, et conservation des décisions antérieures.

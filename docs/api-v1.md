# Contrat REST v1

Contrat cible. Les routes ci-dessous sont relatives à `/api/v1`, sauf l’initialisation CSRF Sanctum. Toutes les mutations SPA exigent une session compatible Sanctum et la protection CSRF, y compris la connexion et l’inscription. Les routes publiques ne renvoient aucune donnée privée.

Le premier incrément expose une inscription commune `POST /auth/register` avec un rôle public `student` ou `company`. Le lien signé de confirmation est servi par Laravel via `/email/verify/{id}/{hash}`. Les missions utilisent actuellement `GET/POST /missions`, `PATCH /missions/{id}` et `POST /missions/{id}/publish`; la liste est filtrée par rôle et la création produit un brouillon. Le dossier est soumis en un seul POST multipart avec les informations légales et le PDF. Les décisions administratives, suspension et réouverture passent par `POST /admin/verifications/{verification}/decisions`. La liste de vérification est paginée. Les autres routes du tableau restent des cibles de la roadmap.

## Authentification et profils

| Méthode et route | Accès | Entrée et réponse nominale |
| --- | --- | --- |
| `GET /sanctum/csrf-cookie` | Public, hors préfixe v1 | Initialise les cookies, 204 |
| `POST /auth/register/student` | Public, limité | Nom, e-mail, mot de passe confirmé, établissement optionnel. 201 avec compte Student. |
| `POST /auth/register/company` | Public, limité | Raison sociale, ICE, RC, ville, e-mail pro, représentant, mot de passe confirmé. 201 avec profil `pending`. Pièces déposées dans le même parcours via le dossier privé. |
| `POST /auth/login` | Public, limité | E-mail, mot de passe. 200 avec profil de session. |
| `POST /auth/logout` | Connecté | Invalide la session, 204 |
| `GET /auth/me` | Connecté | 200 avec identité, rôle, confirmation e-mail et statut entreprise le cas échéant |
| `POST /auth/email/resend` | Connecté, limité | 202, déclenche l’envoi si nécessaire |
| `GET /auth/email/verify/{id}/{hash}` | Session du titulaire, signature valide, limité | 204 après confirmation. Le lien e-mail peut passer par un écran frontend de confirmation. |
| `POST /auth/password/forgot` | Public, limité | E-mail. Réponse neutre 202. |
| `POST /auth/password/reset` | Public, limité | E-mail, jeton expirant, nouveau mot de passe confirmé. 204. |
| `GET /student/profile` | Étudiant titulaire | Bio, compétences, liens professionnels, `photo_url` et `complete`. Le profil est complet quand la bio et les compétences sont renseignées. |
| `PATCH /student/profile` | Étudiant titulaire | Met à jour la bio, les compétences et `links`, une liste de 0 à 10 objets `{name, url}` HTTP(S). Pour une photo, envoyer `POST` multipart avec `_method=PATCH`, `photo` et la liste `links` encodée en JSON. `remove_photo` permet de retirer la photo. |
| `GET /student/profile/photo` | Étudiant titulaire | Photo privée du compte courant, 404 si absente. |
| `GET /missions/{mission}/applications/{student}/profile` | Entreprise propriétaire vérifiée | Profil du candidat ayant postulé à cette mission. Retourne le nom, la bio, les compétences, les liens et l’adresse de la photo. |
| `GET /missions/{mission}/applications/{student}/profile/photo` | Entreprise propriétaire vérifiée | Photo du candidat, sous les mêmes conditions. |
| `GET/PUT /company/profile` | Entreprise titulaire | Profil de présentation, 200. Champs facultatifs `city`, `sector`, `description`, `website`. La liste étudiante `GET /missions` expose ces champs uniquement pour les entreprises vérifiées dont l’e-mail est confirmé. |
| `GET /companies/{company}/photo` | Entreprise titulaire ou étudiant si l’entreprise est vérifiée | Photo de l’entreprise. Le profil et l’annuaire renvoient `photo_url`. Téléversement via `POST /company/profile` multipart avec `_method=PUT`, `photo` (JPG, PNG ou WebP, 2 Mo) ou `remove_photo`. |

## Vérification

| Méthode et route | Accès | Entrée et réponse nominale |
| --- | --- | --- |
| `GET/POST /company/verifications` | Entreprise titulaire | Liste paginée 200, ouverture d’une tentative 201 selon état |
| `GET /company/verifications/{verification}` | Entreprise propriétaire | Dossier propre et décisions publiques, 200 |
| `POST /company/verifications/{verification}/documents` | Entreprise propriétaire, brouillon | Multipart avec pièce et type, 202 pendant le contrôle |
| `GET /verification-documents/{document}/download` | Déposant ou Admin habilité | Flux privé si fichier sain, 200 et audit |
| `POST /company/verifications/{verification}/submit` | Entreprise propriétaire, e-mail confirmé | Fige le dossier et le place en file, 200 |
| `GET /admin/verifications` | Admin habilité | Liste paginée et filtrée, 200 |
| `GET /admin/companies` | Admin habilité | Liste paginée des comptes entreprise, y compris sans dossier. Champs `id`, `name`, `status`. Filtre facultatif `status`. |
| `GET /admin/companies/{company}/verifications` | Admin habilité | Compte entreprise et dossiers paginés avec leur historique et l’indicateur `is_current`. |
| `DELETE /admin/companies/{company}` | Admin habilité | Suppression logique, 204. Désactive le compte et retire ses missions du catalogue. Conserve les dossiers et l’historique. |
| `GET /admin/verifications/{verification}` | Admin habilité | Dossier, contrôles et historique, 200 |
| `POST /admin/verifications/{verification}/decisions` | Admin habilité | `status` cible, `expected_status` affiché et motif obligatoire. Accepter exige les deux contrôles confirmés. Révision possible entre `verified` et `rejected` pour le dossier courant. 201, ou 409 si le dossier a changé. |
| `POST /admin/companies/{company}/suspensions` | Admin habilité | Motif. Suspend immédiatement, 201. |
| `POST /admin/companies/{company}/reopen` | Admin habilité | Motif. Remet en attente pour recontrôle, 200. |

## Missions, candidatures et livrables

Les candidatures étudiantes de `GET /missions` incluent `company` et `companyId` pour associer chaque candidature à la photo de l’annuaire. Le suivi étudiant `GET /missions/work` expose directement `company_photo_url`.

La création et la modification acceptent jusqu’à trois pièces jointes privées de 2 Mo chacune. Envoyer `attachments[]` en multipart. Pour modifier une mission en multipart, utiliser `POST /missions/{id}` avec `_method=PATCH`. Le champ facultatif `remove_attachments` contient les identifiants à retirer. Les listes exposent `attachments[].id` et `attachments[].name`. `GET /missions/{mission}/attachments/{attachment}` télécharge le fichier pour l’entreprise propriétaire, les étudiants ayant accès à la mission dans le catalogue ou l’étudiant retenu dans son suivi.

Routes complémentaires implémentées dans l’API actuelle. La liste `GET /missions` renvoie aussi les candidatures du compte connecté. Un étudiant retrouve les siennes même lorsque la mission a été masquée.

Chaque mission contient `published_at`, une date UTC en ISO 8601 lors de la première publication. Une mission masquée conserve cette date. Les brouillons et les missions historiques sans date renvoient `null`.

Le champ facultatif `category` est disponible en création, modification et lecture des missions. Valeurs acceptées : `development`, `design`, `data`, `content`, `other` ou `null` pour une mission sans type. Le catalogue et « Mes missions » filtrent les résultats reçus.

Pour un étudiant, `GET /missions` renvoie également `companies`, l’annuaire des entreprises vérifiées avec e-mail confirmé (uniquement `id` et `name`). Les missions visibles utilisent `companyId` pour le rapprochement avec cet annuaire.

| Méthode et route | Accès et effet |
| --- | --- |
| `GET /missions/work` | Étudiant retenu ou entreprise propriétaire vérifiée. Retourne `student_photo_url` côté entreprise lorsqu’une photo a été ajoutée, `has_attachment` et les indicateurs historiques `attachment_blocked` et `link_reported`. Un lien déjà signalé reste masqué. |
| `POST /missions/{id}/delivery` | Étudiant retenu avec e-mail confirmé. Enregistre `url` (HTTP(S), JSON ou multipart), `attachment` (multipart), ou les deux. PDF, PNG, JPG/JPEG, DOCX, XLSX ou PPTX, 2 Mo maximum. Avant la fin de mission, l’étudiant peut remplacer un livrable précédemment bloqué ou signalé. |
| `GET /missions/{id}/delivery/attachment` | Étudiant retenu ou entreprise propriétaire vérifiée, avec e-mail confirmé. Télécharge le fichier privé dès le dépôt. Une pièce précédemment bloquée renvoie 404. |
| `POST /missions/{id}/complete` | Entreprise propriétaire vérifiée. Valide le livrable et termine la mission. Renvoie 409 si le livrable est encore concerné par un blocage ou signalement antérieur. |
| `POST /missions/{id}/applications/{student}/accept` | Entreprise propriétaire vérifiée. Retient un candidat en attente sur une mission publiée et la marque `occupied`. |
| `POST /missions/{id}/applications/{student}/reject` | Entreprise propriétaire vérifiée. Refuse une candidature en attente sur une mission publiée et disponible. Le statut `rejected` est visible des deux côtés et reste après libération de la mission. Une candidature refusée ne peut plus être acceptée ou retirée. |
| `POST /missions/{id}/release` | Entreprise propriétaire vérifiée. Avant le dépôt du livrable, remet une mission occupée à l’état `published`, retire la sélection et rouvre les candidatures. Les candidatures existantes redeviennent `submitted`. La date de publication est conservée. |
| `POST /missions/{id}/applications/{student}/contact` | Entreprise propriétaire vérifiée. Envoie par e-mail un `message` de 2 000 caractères maximum à un étudiant ayant postulé. Le relais n’expose pas l’adresse. |
| `POST /missions/brief/extract` | Route historique, inutilisée par le frontend actuel. Entreprise connectée, `text` (24 000 caractères maximum) et `consent: true`. Renvoie `values` et `truncated`, 200. Dépend d’une clé OpenAI côté serveur. |
| `DELETE /missions/{id}` | Entreprise propriétaire. Brouillon supprimable sans validation entreprise. Mission publiée ou masquée supprimable par une entreprise vérifiée et seulement sans candidature associée, 200 ou 409. |
| `PATCH /missions/{id}/visibility` | Entreprise propriétaire vérifiée. `visible` (booléen) alterne entre `published` et `hidden`, 200. |
| `POST /missions/{id}/applications` | Étudiant confirmé. Message facultatif de 2 000 caractères. Rejouer la création ne remplace pas le message existant. |
| `PATCH /missions/{id}/applications/me` | Étudiant confirmé et auteur. Met à jour son message ou son choix facultatif `share_email`, 200. L’entreprise propriétaire vérifiée reçoit `contact_email` seulement si le candidat a autorisé le partage. |
| `DELETE /missions/{id}/applications/me` | Étudiant confirmé et auteur. Retire la candidature, 200. Une nouvelle candidature est possible si la mission est visible. |

| Méthode et route | Accès | Entrée et réponse nominale |
| --- | --- | --- |
| `GET /missions` | Public | Catalogue paginé des missions publiées par des entreprises vérifiées, 200 |
| `GET /missions/{mission}` | Public si publiée et entreprise vérifiée | Détail public, 200 |
| `GET/POST /company/missions` | Entreprise titulaire | Liste propre 200, création de brouillon 201 |
| `GET/PATCH /company/missions/{mission}` | Entreprise propriétaire | Lecture ou modification selon état, 200 |
| `POST /company/missions/{mission}/publish` | Entreprise propriétaire vérifiée, e-mail confirmé | Transition de publication, 200 |
| `POST /company/missions/{mission}/cancel` | Entreprise propriétaire vérifiée | Motif, 200 si état annulable |
| `POST /missions/{mission}/applications` | Étudiant avec e-mail confirmé | Message et mission ouverte. 201, 409 si doublon. |
| `GET /student/applications` | Étudiant titulaire | Candidatures propres paginées, 200 |
| `POST /student/applications/{application}/withdraw` | Étudiant auteur | Retrait avant sélection, 200 |
| `GET /company/missions/{mission}/applications` | Entreprise propriétaire vérifiée | Candidats et champs nécessaires, liste paginée, 200 |
| `POST /company/applications/{application}/decision` | Entreprise propriétaire vérifiée | Acceptation ou refus d’une candidature reçue, 200 |
| `GET /missions/{mission}/deliverables` | Étudiant retenu ou entreprise propriétaire vérifiée | Historique privé paginé, 200 |
| `POST /missions/{mission}/deliverables` | Étudiant retenu, mission en cours | Multipart avec fichiers et note, 202 pendant le contrôle |
| `GET /deliverable-files/{file}/download` | Étudiant retenu ou entreprise propriétaire vérifiée | Flux privé autorisé et journalisé, 200 |
| `POST /company/deliverables/{deliverable}/reviews` | Entreprise propriétaire vérifiée | Acceptation ou demande de correction motivée, 201 |
| `GET /notifications` | Titulaire connecté | Notifications propres paginées, 200 |
| `PATCH /notifications/{notification}` | Titulaire connecté | Marquer comme lue, 200 |

Les routes privées exigent `auth:sanctum`. Les Policies vérifient systématiquement la propriété, le rôle et l’état. L’entreprise peut préparer ses brouillons avant vérification. Ses endpoints candidats et livrables exigent le statut courant `verified` et un e-mail confirmé. Un Admin habilité à vérifier les entreprises n’obtient pas automatiquement accès aux livrables ou aux profils étudiants.

## Formats et erreurs

- Réussite JSON via API Resources avec `data`. Listes avec `links` et `meta`. Utiliser `page`, `per_page` (20 par défaut, 100 maximum), un tri stable avec ID secondaire et des paramètres validés.
- Catalogue avec `q`, filtres de compétences et de durée, tri par publication. Administration avec statut de dossier, ville et intervalle de dates. Listes privées avec filtre de statut. Les filtres et tris sont en liste blanche. Appliquer le périmètre d’accès avant la pagination.
- Erreur JSON centrale avec `error.code`, `error.message`, `error.fields` si validation et `request_id`. Aucun détail interne. 401 sans session, 403 sans droit ou rôle, 404 si l’existence de la ressource privée doit rester masquée, 409 en cas de conflit d’état, 419 pour la session CSRF expirée, 422 pour la validation, 429 pour le débit, 413 ou 415 pour les fichiers hors limites ou hors format et 500 pour un échec interne.
- Les mutations vérifient Form Requests, Policies et transitions côté serveur. Les décisions concurrentes sont arbitrées en transaction. Les téléchargements et réponses sensibles utilisent `Cache-Control: no-store`.

Ce catalogue spécifie le périmètre avant implémentation. Le contrat OpenAPI 3.1 versionné avec schémas de payload, réponses et exemples sera le livrable d’entrée de la Phase 1, après validation des décisions métiers. Swagger UI et les contrôles de conformité CI sont prévus à cette même phase.

# Mouvements & Réservations — Design Doc

> **Statut** : DRAFT v2 — décisions clés validées, workflow affiné.

---

## Décisions validées

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Modèle | **Unifié** — un seul `Mouvement` avec 4 types |
| 2 | DemandeEnvoi | **On étend** — renommage + ajout colonnes, on garde l'historique |
| 3 | Statut matériel | **Flags stockés** sur `Materiel`, mis à jour à chaque transition |
| 4 | Réservations | **Pas de chevauchement** — contrainte `dateDebut/dateFin` exclusive |
| 5 | Pôle EDF | **= Groupe** (référentiel `GROUPE` existant) |
| 6 | Réservation → Mouvement | **Action manuelle** — un agent doit activer explicitement |
| 7 | Prêt interne | **Même rigueur** que prêt externe si déplacement physique (photo, bon, validation magasin) |
| 8 | Certificat étalonnage | **Saisie manuelle** des dates, avec extraction PDF si simple |
| 9 | Réservation panier | **Multi-matériel possible** mais on simplifie l'UI au maximum |

---

## 1. Vocabulaire métier

| Terme | Définition |
|-------|-----------|
| **Mouvement** | Opération tracée qui modifie la localisation, le détenteur, le responsable ou le statut d'un ou plusieurs matériels. |
| **Réservation** | Blocage exclusif d'un créneau futur sur un matériel. Pas de chevauchement autorisé. Conversion manuelle en mouvement. |
| **Détenteur** | Entreprise qui possède **physiquement** le matériel à un instant T (≠ propriétaire, toujours EDF). |
| **Bon de transport** | Document de suivi logistique joint au colis lors de l'expédition. |
| **Convention** | Contrat signé obligatoire pour les prêts externes. |
| **Certificat d'étalonnage** | Document émis par l'entreprise d'étalonnage, intégré au retour. |

## 2. Les 4 types de mouvements

| Type | Détenteur change ? | Site change ? | Statut matériel | Documents | Retour ? |
|------|--------------------|---------------|-----------------|-----------|----------|
| **TRANSFERT_SITE** | Non (reste EDF) | Oui | EN_TRANSIT → normal | Bon de transport, photo colis | Non (définitif) |
| **ETALONNAGE** | Oui (entreprise étalonneur) | Oui | EN_ETALONNAGE | Bon transport + certificat retour | Oui |
| **PRET_EXTERNE** | Oui (société titulaire) | Oui | EN_PRET | Convention obligatoire + bon transport | Oui |
| **PRET_INTERNE** | Non (reste EDF) | Oui (groupe change) | EN_PRET_INTERNE | Bon transport | Oui |

## 3. Modèle de données

### 3.1 `Mouvement` (extension de `DemandeEnvoi`)

La table `demandes_envoi` existante sera renommée `mouvements` et étendue :

```
Mouvement (ex demandes_envoi)
│
├── Identité
│   ├── id, numero (existant, format: MV-AAAA-NNNNN)
│   ├── type : TRANSFERT_SITE | ETALONNAGE | PRET_EXTERNE | PRET_INTERNE
│   └── statut (voir §4 pour la machine à états complète)
│
├── Origine (snapshot au moment de l'envoi)
│   ├── siteOrigineCode
│   └── responsableOrigineId
│
├── Destination
│   ├── siteDestinationCode          → référentiel Sites
│   ├── entrepriseDestinationCode    → référentiel Entreprises (étalonnage/prêt externe)
│   ├── groupeDestinationCode        → référentiel GROUPE (prêt interne)
│   ├── adresseDestination (texte libre si hors référentiel)
│   ├── contact, contactTelephone
│   └── responsableDestinationId     → Agent (optionnel)
│
├── Dates
│   ├── dateSouhaitee                (date demandée par le demandeur)
│   ├── dateValidation               (validation du mouvement)
│   ├── dateEnvoi                    (validation magasin envoi)
│   ├── dateReception                (validation magasin réception)
│   ├── dateRetourEstimee            (prêt / étalonnage)
│   ├── dateRetourEnvoi              (magasin valide retour parti)
│   ├── dateRetourReception          (magasin valide retour reçu)
│   └── dateCloture
│
├── Métadonnées
│   ├── motif, commentaire
│   ├── urgence, justificationUrgence
│   ├── convention (bool, requis si PRET_EXTERNE)
│   ├── souscriptionAssurance (bool)
│   ├── produitsChimiques (bool)
│   └── commentaireRetour
│
├── Validation magasin
│   ├── validePar                    → Agent (qui a validé la demande)
│   ├── expediteurId                 → Agent (magasin envoi)
│   └── receptionneurId              → Agent (magasin réception)
│
├── Lignes : MouvementLigne[] (1..N matériels)
├── Fichiers : via Fichier(entityType="MOUVEMENT")
│
├── Liens
│   ├── demandeurId                  → Agent (celui qui fait la demande)
│   ├── reservationOrigineId?        → Reservation (si issu d'une réservation)
│   └── createdById, updatedById
│
└── Audit : createdAt, updatedAt
```

### 3.2 `MouvementLigne` (ex `DemandeEnvoiLigne`)

```
MouvementLigne
├── id
├── mouvementId
├── materielId
│
├── Snapshot départ (rempli à l'envoi)
│   ├── etatDepart           (état matériel au moment du départ)
│   └── commentaireDepart
│
├── Snapshot retour (rempli à la réception retour, si applicable)
│   ├── etatRetour
│   └── commentaireRetour
│
└── Photos : via Fichier(entityType="MOUVEMENT_LIGNE", context="PHOTO_DEPART"|"PHOTO_RETOUR")
```

### 3.3 `Reservation`

```
Reservation
├── id
├── materielId               → Materiel
├── demandeurId              → Agent
├── dateDebut, dateFin       (créneau exclusif — pas de chevauchement)
├── motif
├── typePrevu                : MouvementType (indicatif)
├── statut                   : CONFIRMEE | ANNULEE | HONOREE
├── mouvementId?             → Mouvement (rempli à l'activation manuelle)
├── commentaire
└── createdAt, updatedAt
```

**Contrainte** : `UNIQUE(materielId, dateDebut, dateFin)` + vérification serveur qu'aucune réservation CONFIRMEE ne chevauche.

### 3.4 Flags stockés sur `Materiel`

Les champs existants sur `Materiel` restent et sont **mis à jour automatiquement** par les transitions de mouvement :

| Champ | Mis à jour par |
|-------|----------------|
| `site` | TRANSFERT_SITE → clôture |
| `entreprise` (détenteur) | ETALONNAGE / PRET_EXTERNE → envoi / retour |
| `enPret` | PRET_EXTERNE / PRET_INTERNE → envoi / retour |
| `motifPret` | PRET_* → envoi |
| `dateRetourPret` | PRET_* → envoi (= dateRetourEstimee) |
| `enTransit` | Tout mouvement → envoi / réception |
| `dateEtalonnage` | ETALONNAGE → clôture (intégration certificat) |
| `dateProchainEtalonnage` | ETALONNAGE → clôture (recalculé) |
| `responsableId` | Si changement de responsable à la clôture |

## 4. Machine à états — Workflow complet

Chaque mouvement suit un flux avec des **points de contrôle obligatoires** (validation, photos, documents).

### 4.1 Leg Aller (tous types)

```
  BROUILLON
      │  (demandeur soumet)
      ▼
  SOUMISE
      │  (validation par rôle habilité)
      ▼
  VALIDEE
      │  (préparation : photo colis + bon de transport obligatoire)
      ▼
  PRETE_A_EXPEDIER
      │  (magasin valide le départ : expediteurId + dateEnvoi)
      ▼
  EN_TRANSIT
      │  (magasin destination valide l'arrivée : receptionneurId + dateReception)
      ▼
  RECUE
```

### 4.2 Après réception — dépend du type

**TRANSFERT_SITE** :
```
  RECUE → CLOTUREE
  (Materiel.site mis à jour, Materiel.enTransit = false)
```

**ETALONNAGE** :
```
  RECUE → EN_COURS (en étalonnage chez le prestataire)
        → RETOUR_PRET (photo colis retour + bon transport retour)
        → RETOUR_EN_TRANSIT (magasin étalonneur valide départ retour)
        → RETOUR_RECUE (magasin EDF valide réception retour)
        → [upload certificat + saisie nouvelles dates étalonnage]
        → CLOTUREE
```

**PRET_EXTERNE / PRET_INTERNE** :
```
  RECUE → EN_COURS (en prêt)
        → [suivi dateRetourEstimee, alertes si dépassement]
        → RETOUR_PRET (retour préparé)
        → RETOUR_EN_TRANSIT (emprunteur valide départ retour)
        → RETOUR_RECUE (magasin EDF valide réception retour)
        → CLOTUREE
```

### 4.3 Annulation

```
BROUILLON | SOUMISE | VALIDEE → ANNULEE (à tout moment avant expédition)
EN_TRANSIT et après → pas d'annulation possible, il faut gérer le retour
```

### 4.4 Points de contrôle obligatoires par transition

| Transition | Obligatoire | Qui |
|------------|-------------|-----|
| BROUILLON → SOUMISE | Au moins 1 ligne matériel + destination renseignée | Demandeur |
| SOUMISE → VALIDEE | Validation explicite | GESTIONNAIRE_MAGASIN ou ADMIN |
| VALIDEE → PRETE_A_EXPEDIER | Photo colis + bon de transport uploadé | Demandeur ou magasin |
| PRETE_A_EXPEDIER → EN_TRANSIT | Validation départ | GESTIONNAIRE_MAGASIN |
| EN_TRANSIT → RECUE | Validation arrivée | GESTIONNAIRE_MAGASIN (site destination) |
| RECUE → EN_COURS | Automatique (étalonnage/prêt) | — |
| EN_COURS → RETOUR_PRET | Photo colis retour | Détenteur ou magasin |
| RETOUR_PRET → RETOUR_EN_TRANSIT | Validation départ retour | GESTIONNAIRE_MAGASIN |
| RETOUR_EN_TRANSIT → RETOUR_RECUE | Validation arrivée retour | GESTIONNAIRE_MAGASIN |
| RETOUR_RECUE → CLOTUREE | Étalonnage : certificat obligatoire. Prêt : vérification état. | GESTIONNAIRE_MAGASIN |

## 5. Fichiers liés aux mouvements

Les fichiers utilisent le système `Fichier` existant avec `entityType` et `context` :

| Fichier | entityType | context | Quand |
|---------|-----------|---------|-------|
| Photo colis aller | `MOUVEMENT` | `PHOTO_COLIS_ENVOI` | Avant expédition |
| Bon de transport aller | `MOUVEMENT` | `BON_TRANSPORT_ENVOI` | Avant expédition |
| Photo colis retour | `MOUVEMENT` | `PHOTO_COLIS_RETOUR` | Avant expédition retour |
| Bon de transport retour | `MOUVEMENT` | `BON_TRANSPORT_RETOUR` | Avant expédition retour |
| Convention (prêt externe) | `MOUVEMENT` | `CONVENTION` | À la soumission |
| Certificat étalonnage | `MOUVEMENT` | `CERTIFICAT_ETALONNAGE` | À la clôture |
| Photo départ matériel | `MOUVEMENT_LIGNE` | `PHOTO_DEPART` | À l'envoi, par matériel |
| Photo retour matériel | `MOUVEMENT_LIGNE` | `PHOTO_RETOUR` | Au retour, par matériel |

## 6. Calendrier matériel

Vue timeline par matériel affichant :
- **Mouvements passés** : bandes grisées
- **Mouvement actif** : bande colorée (bleu = transfert, orange = étalonnage, violet = prêt externe, vert = prêt interne)
- **Réservations futures** : bandes hachurées (pas de chevauchement possible)
- Clic sur une réservation → bouton "Convertir en mouvement" (action manuelle)

## 7. Permissions

| Action | Rôles autorisés |
|--------|-----------------|
| Créer mouvement (brouillon) | Tout agent connecté |
| Soumettre pour validation | Demandeur |
| Valider une demande | GESTIONNAIRE_MAGASIN, ADMIN |
| Préparer colis (photo + bon) | Demandeur, GESTIONNAIRE_MAGASIN |
| Valider expédition | GESTIONNAIRE_MAGASIN |
| Valider réception | GESTIONNAIRE_MAGASIN (site destination) |
| Clôturer | GESTIONNAIRE_MAGASIN, ADMIN |
| Annuler | Demandeur (si BROUILLON/SOUMISE), ADMIN (si VALIDEE) |
| Créer réservation | Tout agent connecté |
| Activer réservation → mouvement | Demandeur de la réservation |

## 8. Questions ouvertes restantes

### Workflow
1. La **validation** (SOUMISE → VALIDEE) est-elle toujours nécessaire ? Ou certains types peuvent passer directement ?
2. Pour les prêts internes (entre groupes) : le workflow est-il aussi strict (photo colis + bon transport) ou plus allégé ?
3. Quand le certificat d'étalonnage est intégré, saisit-on manuellement les nouvelles dates ou les extrait-on du fichier ?

### Réservations
4. Une réservation porte sur **un seul matériel** ou peut-on réserver un panier ?
5. Durée max d'une réservation ? Ou pas de limite ?

### Alertes retour
6. Quels seuils d'alerte pour les retards ? J-7, J-1, J0 (échu), J+7 (retard) ?
7. Canal : in-app uniquement pour l'instant ?

### Migration
8. Les `DemandeEnvoi` existantes : toutes migrées en TRANSFERT_SITE ? Ou on distingue selon le `type` existant ?
9. Les matériels avec `enPret=true` sans mouvement associé : on crée un mouvement rétroactif ou on nettoie le flag ?

## 9. Phases d'implémentation

| # | Contenu | PRs estimées |
|---|---------|-------------|
| **P1** | Migration schema : renommer `DemandeEnvoi` → `Mouvement`, ajouter colonnes, nouveaux statuts | 1 PR |
| **P2** | Backend `MouvementsService` : CRUD + machine à états (transitions avec contrôles) | 1 PR |
| **P3** | Frontend : Liste mouvements + formulaire création (type → champs conditionnels) | 1 PR |
| **P4** | Workflow TRANSFERT_SITE complet : formulaire multi-étapes, upload photos/bon, validations magasin | 1-2 PRs |
| **P5** | Workflow ETALONNAGE : variante avec certificat retour + maj dates matériel | 1 PR |
| **P6** | Workflow PRET_EXTERNE : variante avec convention + suivi date retour | 1 PR |
| **P7** | Workflow PRET_INTERNE : variante allégée avec groupe destination | 1 PR |
| **P8** | Modèle `Reservation` + calendrier matériel + activation manuelle | 1-2 PRs |
| **P9** | Alertes retour (in-app) + indicateurs KPI mouvements | 1 PR |
| **P10** | Nettoyage : migration données existantes + suppression ancien code `DemandeEnvoi` | 1 PR |

**P1 → P3** sont les fondations. P4 est le premier workflow complet (référence pour les suivants).

## 10. Non-objectifs (hors scope cette itération)

- Notifications mail / SMS
- Scan QR à la réception
- Signature électronique des conventions
- Génération automatique de bons de livraison
- Tracking transporteur (la Poste, etc.)
- Gestion de stock (entrées/sorties quantitatives)

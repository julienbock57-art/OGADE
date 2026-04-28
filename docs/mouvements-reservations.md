# Mouvements & Réservations — Design Doc

> **Statut** : DRAFT — en discussion, ne pas implémenter avant validation.

## 1. Vocabulaire métier

| Terme | Définition |
|-------|-----------|
| **Mouvement** | Opération qui modifie la localisation, l'entreprise détentrice, le responsable ou le statut d'un matériel pour une période donnée. Toujours associé à une plage temporelle (date envoi → date retour ou clôture). |
| **Réservation** | Intention future d'utiliser un matériel à une période donnée. N'a aucun effet immédiat sur le matériel. Plusieurs réservations parallèles possibles sur un même matériel. |
| **Détenteur** | Entreprise qui possède **physiquement** le matériel à un instant T (≠ propriétaire qui ne change pas). |
| **Responsable** | Agent EDF référent du matériel à un instant T. |
| **Convention** | Document signé obligatoire pour les prêts externes. |
| **Pôle** | Unité interne EDF pour les prêts internes (à clarifier — nouveau référentiel ?). |

## 2. Les 4 types de mouvements

| Type | Détenteur change ? | Site/adresse | Statut matériel | Document | Retour |
|------|--------------------|---------------|------------------|-----------|--------|
| **TRANSFERT_SITE** | Non (EDF reste détenteur) | Oui | EN_TRANSIT → puis NORMAL | — | Pas de retour (changement définitif) |
| **ETALONNAGE** | Oui (entreprise étalonneur) | Oui | EN_ETALONNAGE | Certificat (au retour) | Oui — solde + intégration certificat + maj `dateEtalonnage` |
| **PRET_EXTERNE** | Oui (société titulaire) | Oui (souvent) | EN_PRET | Convention obligatoire | Oui — date estimée à suivre |
| **PRET_INTERNE** | Non (EDF) | Site/responsable changent | EN_PRET_INTERNE | — | Oui — entre pôles |

**Observation clé** : ces 4 opérations partagent une structure commune (origine, destination, dates, lignes multi-matériel). Un modèle unifié `Mouvement` avec un type discriminant a du sens.

## 3. Modèle de données proposé

### 3.1 `Mouvement` (modèle unifié, multi-matériel)

```
Mouvement
├── id, numero (généré: MV-AAAA-NNNNN)
├── type : TRANSFERT_SITE | ETALONNAGE | PRET_EXTERNE | PRET_INTERNE
├── statut : BROUILLON | PLANIFIE | EN_TRANSIT | ARRIVE | EN_COURS
│             | RETOUR_DEMANDE | RETOUR_EN_TRANSIT | CLOTURE | ANNULE
│
├── Origine (snapshot avant) :
│   ├── siteOrigineCode
│   ├── detenteurOrigineCode (= toujours EDF dans la pratique)
│   └── responsableOrigineId
│
├── Destination :
│   ├── siteDestinationCode (si transfert/prêt interne)
│   ├── detenteurDestinationCode (si étalonnage/prêt externe)
│   ├── adresseLibre (si l'adresse n'est pas dans un référentiel)
│   ├── contact, contactTelephone
│   └── responsableDestinationId (optionnel)
│
├── Dates :
│   ├── dateSouhaitee
│   ├── dateEnvoi
│   ├── dateReceptionDestination
│   ├── dateRetourEstimee (étalonnage / prêt)
│   └── dateRetourEffective
│
├── Métadonnées :
│   ├── motif, urgence, justificationUrgence
│   ├── convention (bool, requis si PRET_EXTERNE)
│   ├── conventionFichierId (lien Fichier)
│   ├── certificatFichierId (lien Fichier, étalonnage)
│   ├── produitsChimiques (bool)
│   └── commentaire
│
├── Lignes : MouvementLigne[] (1..N matériels)
│
├── Liens :
│   ├── demandeurId (Agent)
│   ├── reservationId? (si issu d'une réservation)
│   └── createdById, updatedById, ...
│
└── Audit : createdAt, updatedAt
```

### 3.2 `MouvementLigne` (un matériel par ligne)

```
MouvementLigne
├── id
├── mouvementId
├── materielId
├── etatDepart  (snapshot état au départ)
├── etatRetour  (au retour)
├── commentaireDepart, commentaireRetour
└── photosDepartIds[], photosRetourIds[]  (ou via Fichier.context)
```

### 3.3 `Reservation`

```
Reservation
├── id, materielId, demandeurId
├── dateDebut, dateFin
├── motif
├── typePrevu : MouvementType (pré-typage indicatif)
├── statut : CONFIRMEE | ANNULEE | HONOREE
├── mouvementId? (rempli quand convertie en mouvement)
└── commentaire
```

### 3.4 Statut "actuel" du matériel : calculé ou stocké ?

**Recommandation** : calcul à la volée via vue/requête depuis le mouvement actif.
- Avantages : impossible d'avoir un état incohérent, pas de double maintenance.
- Inconvénient : requête plus complexe pour l'affichage liste.
- Compromis : champ `etatActuel` dénormalisé sur `Materiel`, mis à jour par les transitions de mouvement.

À débattre.

## 4. Workflows (états → transitions)

### Transfert site
```
BROUILLON → PLANIFIE → EN_TRANSIT → ARRIVE → CLOTURE
                                      └→ ANNULE
```
À CLOTURE : `Materiel.site` mis à jour vers `siteDestinationCode`.

### Étalonnage
```
BROUILLON → PLANIFIE → EN_TRANSIT → ARRIVE (chez étalonneur)
         → EN_COURS (en cours d'étalonnage)
         → RETOUR_EN_TRANSIT (retour vers EDF)
         → [intégration certificat + maj dateEtalonnage / validiteEtalonnage]
         → CLOTURE
```

### Prêt (externe et interne)
```
BROUILLON → PLANIFIE → EN_TRANSIT → ARRIVE
         → EN_COURS (en prêt)
         → [alerte si dateRetourEstimee approche / dépassée]
         → RETOUR_DEMANDE (rappel envoyé)
         → RETOUR_EN_TRANSIT
         → CLOTURE
```

## 5. Liens avec l'existant

### `DemandeEnvoi` actuel
Le modèle existant `DemandeEnvoi` couvre partiellement le concept de mouvement, mais :
- Champs orientés "envoi" uniquement, pas "retour"
- Pas de notion de détenteur change vs site change
- Pas de lien avec étalonnage / prêt
- Statuts génériques

**Deux options** :
- **A. Étendre `DemandeEnvoi`** → renommer en `Mouvement`, ajouter colonnes manquantes, garder la table.
- **B. Nouveau modèle `Mouvement`** → migration des données, dépréciation progressive de `DemandeEnvoi`.

> Recommandation : **Option A** (plus pragmatique, on garde l'historique). Renommage table + ajout colonnes via migration.

### Champs `Materiel` à déprécier
- `enPret`, `motifPret`, `dateRetourPret` → portés par le mouvement actif
- `enTransit` → portés par le statut du mouvement
- Décision : garder en lecture (calculés via mouvement) ou supprimer ?

### Fichiers
- `Fichier.context` peut prendre les valeurs : `CONVENTION`, `CERTIFICAT_ETALONNAGE`, `BON_LIVRAISON`, `PHOTO_DEPART`, `PHOTO_RETOUR`, `GENERAL`.
- Lien direct `Fichier.mouvementId` (nouveau) ou via `entityType="MOUVEMENT"`.

## 6. Calendrier matériel

Vue timeline par matériel :
- Bandes horizontales colorées par type de mouvement (passé / présent / futur)
- Réservations affichées en hachuré
- Plusieurs réservations parallèles possibles → alignées verticalement
- Blocage automatique si chevauchement ? **À confirmer**.

## 7. Permissions (à clarifier)

| Action | Rôle suggéré |
|--------|--------------|
| Créer transfert site | GESTIONNAIRE_MAGASIN |
| Créer envoi étalonnage | REFERENT_MATERIEL |
| Créer prêt externe | REFERENT_LOGISTIQUE |
| Créer prêt interne | REFERENT_MATERIEL ou tout agent ? |
| Créer réservation | Tout agent connecté ? |
| Valider/clôturer mouvement | GESTIONNAIRE_MAGASIN ou ADMIN |

## 8. Questions ouvertes (à trancher avant de coder)

### Modèle
1. **Option A ou B** pour `DemandeEnvoi` ? (extension vs nouveau modèle)
2. Garder les flags `enPret`/`enTransit` sur `Materiel` ou tout calculer depuis le mouvement actif ?
3. Multi-matériel : un mouvement peut-il être mono-ligne, ou toujours multi-ligne (comme aujourd'hui `DemandeEnvoi`) ?
4. Comment représenter un **pôle** EDF ? Nouveau référentiel `POLE` ? Champ sur `Agent` ? Sur `Site` ?

### Réservations
5. Les réservations chevauchantes sont-elles **autorisées** sans contrainte, ou faut-il un **arbitrage** (priorité, demande de validation) ?
6. Conversion réservation → mouvement : **automatique** à date début, ou **manuelle** par un référent ?
7. Une réservation peut-elle porter sur plusieurs matériels (panier) ou un seul ?

### Workflow étalonnage
8. Au retour d'étalonnage, l'intégration du certificat met-elle automatiquement à jour `Materiel.dateEtalonnage` et `dateProchainEtalonnage` ?
9. Si l'étalonnage révèle un défaut → bascule automatique en `LEGER_DEFAUT` / `HS` ?

### Workflow prêt
10. Quelle alerte avant la `dateRetourEstimee` ? J-7, J-1, J0, J+X (si retard) ?
11. Le canal d'alerte : in-app uniquement, mail, les deux ?
12. Convention : upload libre ou template à compléter dans l'app ?

### Migration
13. Faut-il convertir les `DemandeEnvoi` existantes en `Mouvement` ? Ou seulement nouvelles ?
14. Comment traiter les matériels actuellement marqués `enPret=true` sans mouvement ?

### Permissions
15. Validation/approbation : un mouvement passe directement de PLANIFIE à EN_TRANSIT, ou nécessite une approbation par un autre rôle ?
16. Qui peut **annuler** un mouvement, et à quelle étape ?

## 9. Phases d'implémentation suggérées

| # | Contenu | Dépendances |
|---|---------|-------------|
| **P1** | Modèle `Mouvement` + types/statuts + CRUD basique + liste | — |
| **P2** | Workflow `TRANSFERT_SITE` (le plus simple, sert de référence) | P1 |
| **P3** | Workflow `ETALONNAGE` + intégration certificat au retour | P1 |
| **P4** | Workflow `PRET_EXTERNE` + convention obligatoire | P1 |
| **P5** | Workflow `PRET_INTERNE` (variant de P4) + référentiel pôle | P4 |
| **P6** | `Reservation` + calendrier matériel | P1 |
| **P7** | Conversion réservation → mouvement | P6 |
| **P8** | Statuts matériel calculés (suppression flags) + alertes retour | P2..P5 |
| **P9** | Migration `DemandeEnvoi` (si Option A → renommage; si B → migration data) | P1 |

Chaque phase = 1 PR. P1 et P2 sont prérequis avant tout le reste.

## 10. Non-objectifs (out of scope pour cette itération)

- Géolocalisation / scan QR à la réception
- Signature électronique des conventions
- Notifications mail (in-app suffit dans un premier temps)
- Bons de livraison générés automatiquement
- Suivi multi-étapes du transit (la Poste, transporteur, etc.)

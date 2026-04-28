# Brief UI — Système Mouvements & Réservations OGADE

> **Pour Claude Design** : ce brief décrit les écrans à concevoir pour le module Mouvements & Réservations de l'application OGADE (gestion de matériel END EDF). Il contient le design system existant, les flux utilisateur, les écrans à produire et les contraintes métier.

---

## 1. Contexte produit

**OGADE** est une application web interne EDF de gestion de matériel de Contrôle Non Destructif (CND/END). Elle remplace une solution PowerApps existante.

**Le module Mouvements & Réservations** gère :
- **Transferts** entre sites EDF (changement de site)
- **Envois en étalonnage** vers une entreprise prestataire
- **Prêts externes** à des sociétés titulaires sous-traitantes
- **Prêts internes** entre groupes/pôles EDF
- **Réservations** futures de matériel sur un calendrier partagé

**Utilisateurs** :
- **Demandeur** : agent EDF qui demande un mouvement (prêt, transfert, étalonnage)
- **Gestionnaire magasin** : valide les demandes, atteste l'envoi/réception physique des colis
- **Référent** : peut créer des mouvements complexes (étalonnage, prêt externe)
- **Admin** : tous droits

**Volume** : ~500 matériels actifs, ~50 mouvements/mois, ~20 réservations/mois.

---

## 2. Design system existant (à réutiliser)

### 2.1 Palette de couleurs

```
Couleurs neutres
- Background page    : #FBFBF9 (warm white)
- Background panel   : #FFFFFF
- Background sunken  : #EFEEEC (cards inactives, hover)
- Texte principal    : #2A2A38
- Texte secondaire   : #6E6E78
- Texte tertiaire    : #9A9AA1
- Lignes/bordures    : #DCDBD7

Couleur d'accent (action, sélection, EDF)
- Accent primary     : #6F4FE0 (violet bleuté EDF)
- Accent soft (bg)   : #EEEAFB
- Accent line        : #C9BCEC

Couleurs sémantiques (statuts, types)
- Sky/Bleu           : #4A8DC9 → transit, info
- Violet             : #7656D3 → étalonnage
- Amber              : #D89A2E → prêt externe, alertes douces
- Emerald            : #2FA266 → succès, mouvement OK, prêt interne
- Rose               : #D83C44 → erreurs, retards, urgences
```

### 2.2 Composants existants à réutiliser

| Composant | Usage |
|-----------|-------|
| `KpiCard` | Cartes indicateurs en haut de liste, cliquables/réactives |
| `Pill` | Badges de statut colorés (avec dot) — c-emerald, c-amber, c-rose, c-sky, c-violet |
| `Tag` | Tags neutres pour types/références |
| `obtn` | Boutons (variantes : default, accent, ghost, danger, success, sm) |
| `chip` | Chips de filtres actifs avec bouton ✕ |
| `Drawer` | Panneau latéral droit (550px) pour consultation détail |
| `ExpandedRow` | Ligne de tableau dépliable (chevron) |
| `cbx` | Checkbox custom (selection multiple) |

### 2.3 Patterns de pages existants

- **Liste** : header titre + actions, KPIs, toolbar (search + filtres + chips), table dense (32-38px par ligne), pagination
- **Formulaire** : wizard multi-étapes (Stepper en haut), sections avec titres, grilles 2-3 colonnes, bouton "Suivant/Précédent" + "Enregistrer"
- **Détail** : Drawer latéral avec onglets (Infos / PJ / Photos / Historique / QR)
- **Modale d'action** : centrée, max 480px, action + commentaire + boutons confirmer/annuler

### 2.4 Iconographie (style)

SVG monochromes 14-16px, stroke 1.6, `currentColor`. Style outline minimaliste.

### 2.5 Typographie

- Titres pages : 22px, weight 600
- Sous-titres : 13px, gris secondaire
- Corps : 12-13px
- Labels champs : 11px majuscules, letter-spacing 0.04em
- Mono (références, IDs) : monospace tabulaire

---

## 3. Vue d'ensemble des écrans à concevoir

| # | Écran | Type | Priorité |
|---|-------|------|----------|
| **A** | Dashboard Mouvements | Page liste | P1 |
| **B** | Création mouvement (wizard 4 étapes) | Page formulaire | P1 |
| **C** | Détail mouvement + actions workflow | Page détail | P1 |
| **D** | Modales de transition (valider, expédier, réceptionner, clôturer) | Modales | P1 |
| **E** | Calendrier matériel | Vue timeline | P2 |
| **F** | Création/édition réservation | Modale ou page | P2 |
| **G** | Dashboard réservations | Page liste | P2 |
| **H** | Intégration onglet "Mouvements" dans le drawer matériel | Sous-écran | P1 |
| **I** | KPIs accueil enrichis | Sous-écran | P3 |

---

## 4. Écran A — Dashboard Mouvements

**Route** : `/mouvements`
**Remplace** : la page actuelle `/demandes-envoi`

### 4.1 En-tête de page

- Titre : **"Mouvements & Transferts"**
- Sous-titre : **"Suivi des envois, étalonnages, prêts internes et externes"**
- Bouton primaire à droite : **"+ Nouveau mouvement"**
- Bouton secondaire : **"📅 Vue calendrier"** (lien vers réservations)

### 4.2 Bandeau KPI (5 cartes cliquables, comme MaterielsListPage)

| Carte | Valeur | Couleur accent | Filtre déclenché |
|-------|--------|----------------|------------------|
| Total actifs | nombre mouvements en cours | accent (violet) | reset filtres |
| En transit | aller + retour confondus | sky | statut IN (EN_TRANSIT, RETOUR_EN_TRANSIT) |
| Étalonnages en cours | EN_COURS de type ETALONNAGE | violet | type=ETALONNAGE statut=EN_COURS |
| Prêts en cours | EN_COURS de type PRET_* | amber | type IN (PRET_EXTERNE, PRET_INTERNE) statut=EN_COURS |
| Retards | dateRetourEstimee dépassée | rose | retard=true |

### 4.3 Toolbar

- Champ recherche (numéro, demandeur, destinataire, matériel)
- Bouton **"Filtres"** (avec compteur de filtres actifs)
- Onglets segmentés à droite : **Tous | Brouillons | À valider | Actifs | Clôturés**
- Compteur "X résultats" à l'extrême droite

### 4.4 Panneau de filtres dépliable

Grille 4 colonnes :
- Type (TRANSFERT_SITE / ETALONNAGE / PRET_EXTERNE / PRET_INTERNE)
- Statut (toutes les valeurs de la machine à états)
- Site origine
- Site/destinataire destination
- Demandeur
- Période (date envoi : du / au)

### 4.5 Tableau

Colonnes (compactes, 36-40px par ligne) :

| Colonne | Largeur | Contenu |
|---------|---------|---------|
| ☑ | 32px | Checkbox sélection |
| ▶ | 24px | Chevron expand |
| **N° / Type** | 130px | Numéro mono (`MV-2026-0042`) + badge type coloré |
| **Demandeur** | 140px | Avatar coloré + Prénom Nom + (rôle/groupe sous le nom) |
| **Origine → Destination** | 220px | "Site EDF Cattenom → ABC Étalonnage" avec flèche |
| **Matériels** | 80px | "3 mat." + tooltip avec liste sur hover |
| **Statut** | 130px | Pill avec dot coloré selon statut |
| **Dates clés** | 140px | "Envoi : 02/05" + "Retour prévu : 15/06" sur 2 lignes |
| **Progression** | 100px | Mini barre de progression (% complété du workflow) |
| Actions | 60px | Icône menu (...) |

**Ligne dépliable** : sur clic chevron, affiche
- Liste des matériels concernés (références + libellés)
- Documents joints (icônes : photo colis, bon transport, convention…)
- Boutons d'action contextuels selon le statut courant

**Couleurs de pills par statut** :
- `BROUILLON` : neutre gris
- `SOUMISE` : sky (à valider)
- `VALIDEE` : sky
- `PRETE_A_EXPEDIER` : amber
- `EN_TRANSIT` : amber pulsé
- `RECUE` : sky
- `EN_COURS` : violet (étalonnage) ou amber (prêt)
- `RETOUR_PRET / RETOUR_EN_TRANSIT / RETOUR_RECUE` : amber
- `CLOTUREE` : emerald
- `ANNULEE` : neutre rayé

**Couleurs de badges par type** :
- `TRANSFERT_SITE` : sky
- `ETALONNAGE` : violet
- `PRET_EXTERNE` : amber
- `PRET_INTERNE` : emerald

### 4.6 Bulk bar (apparaît si sélection multiple)

- Compteur "N mouvements sélectionnés"
- Actions groupées : Valider | Annuler | Exporter (Excel)

### 4.7 État vide

Centré : icône truck/swap, "Aucun mouvement", lien "Créer un mouvement" → bouton `+ Nouveau mouvement`.

---

## 5. Écran B — Création de mouvement (Wizard 4 étapes)

**Route** : `/mouvements/nouveau`

### 5.1 Stepper en haut de page

```
[1. Type & Matériels] → [2. Destination] → [3. Documents] → [4. Récapitulatif]
```

État courant en accent, étapes complétées en emerald, à venir en gris. Cliquable pour revenir en arrière.

### 5.2 Étape 1 — Type & Matériels

**Section A : Choix du type**

4 grandes cartes radio (cliquables), 2x2 grid :

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ 🚛 TRANSFERT SITE        │  │ 🔬 ENVOI ÉTALONNAGE      │
│ Déplacement entre sites  │  │ Vérification périodique  │
│ EDF (changement site)    │  │ par prestataire externe  │
└──────────────────────────┘  └──────────────────────────┘
┌──────────────────────────┐  ┌──────────────────────────┐
│ 🤝 PRÊT EXTERNE          │  │ 🔄 PRÊT INTERNE          │
│ Vers société titulaire   │  │ Entre groupes EDF        │
│ (convention obligatoire) │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

**Section B : Sélection des matériels**

Champ de recherche avec autocomplete (référence ou libellé) → ajoute des chips matériels en dessous.

Chip matériel :
```
[REF-1234] Sonde UT 5 MHz · Site Cattenom         [✕]
```

Affiche un warning si :
- Le matériel est déjà en mouvement actif
- Une réservation conflictuelle existe sur la période visée
- Étalonnage : matériel déjà en cours d'étalonnage
- Prêt : matériel déjà en prêt

**Section C (visible si étalonnage)** : avertissement si certains matériels n'ont pas de date d'étalonnage proche/échue.

### 5.3 Étape 2 — Destination

Champs conditionnels selon le type choisi :

#### Si TRANSFERT_SITE
- Site destination * (sélecteur depuis référentiel Sites)
- Adresse complémentaire (optionnel)
- Responsable destination (autocomplete agent, optionnel)

#### Si ETALONNAGE
- Entreprise étalonneur * (sélecteur depuis référentiel Entreprises filtré sur type=ETALONNAGE)
- Adresse de livraison * (pré-remplie depuis l'entreprise, modifiable)
- Contact destinataire * (nom)
- Téléphone contact
- **Date retour estimée** *

#### Si PRET_EXTERNE
- Entreprise titulaire * (sélecteur référentiel)
- Adresse livraison * (pré-remplie depuis entreprise, modifiable)
- Contact destinataire *
- Téléphone contact
- **Date retour estimée** *
- Case à cocher "Convention signée jointe" (obligatoire pour passer à l'étape suivante)
- Case à cocher "Souscription assurance"

#### Si PRET_INTERNE
- Site destination * (référentiel Sites)
- Groupe destination * (référentiel GROUPE — c'est le pôle)
- Responsable destination *
- **Date retour estimée** *

### 5.4 Étape 2 — Section commune

- **Date envoi souhaitée** *
- **Motif** * (textarea)
- **Urgence** : radio Normal / Urgent / Très urgent
- Si urgent : **Justification urgence** * (textarea)
- Case **Produits chimiques** (impacte transport)

### 5.5 Étape 3 — Documents

Sections d'upload (dropzone style PowerApps) :

| Section | Type fichier | Obligatoire ? |
|---------|--------------|---------------|
| Convention | PDF | Oui si PRET_EXTERNE |
| Bon de transport (aller) | PDF / image | Oui pour passer en EN_TRANSIT |
| Photo du colis (aller) | image | Oui pour passer en EN_TRANSIT |
| Photos individuelles par matériel (départ) | images | Recommandé |
| Documents complémentaires | tout type | Optionnel |

À cette étape, l'utilisateur peut **partiellement** uploader (pour brouillon ou soumission), les obligations stricto sensu apparaissent au moment de la transition vers EN_TRANSIT (cf écran D).

### 5.6 Étape 4 — Récapitulatif

Mise en page lecture seule, organisée comme une fiche :
- En-tête : type + N° généré + statut "BROUILLON"
- Section "Demandeur" : nom + groupe + date demande
- Section "Trajet" : Site origine → Destination (encadré avec adresse, contact)
- Section "Matériels" : tableau des lignes avec photo départ si présente
- Section "Documents" : liste des fichiers uploadés
- Section "Dates & contraintes" : envoi prévu, retour estimé, urgence

**Boutons en bas** :
- ← Précédent
- 💾 Enregistrer brouillon
- 📤 Soumettre pour validation (bouton primaire accent) → confirme la transition BROUILLON → SOUMISE

---

## 6. Écran C — Détail du mouvement

**Route** : `/mouvements/:id`

C'est l'écran central du module : il affiche tout ce qui concerne le mouvement et les actions disponibles selon son statut courant et le rôle de l'utilisateur.

### 6.1 En-tête de page

```
┌─────────────────────────────────────────────────────────────┐
│ ← Retour                                                    │
│                                                             │
│ MV-2026-0042   [BADGE TYPE]   [PILL STATUT]                 │
│ Envoi étalonnage — 3 matériels                              │
│ Demandé par Julien Bock le 28/04/2026                       │
│                                                             │
│         [Actions disponibles selon statut et rôle →]        │
└─────────────────────────────────────────────────────────────┘
```

Boutons d'action contextuels (voir §6.7).

### 6.2 Layout 2 colonnes

**Colonne gauche (60%)** : timeline + sections détail
**Colonne droite (40%)** : matériels + documents

### 6.3 Timeline workflow (colonne gauche)

Composant **stepper vertical** affichant **toutes** les étapes du workflow pour ce type, avec :

- Étapes terminées : en emerald, avec date + acteur
- Étape courante : en accent, pulsée
- Étapes futures : en gris

Exemple pour ETALONNAGE :

```
✅ Brouillon créé
   Julien Bock · 28/04/2026 14:32

✅ Soumise pour validation
   Julien Bock · 28/04/2026 14:35

✅ Validée
   Marie Magasin · 29/04/2026 09:12
   Commentaire : "OK pour envoi"

✅ Préparée à expédier
   Marie Magasin · 30/04/2026 10:05
   📎 Photo colis · Bon de transport (PDF)

🔵 En transit (étape courante)
   Départ : Marie Magasin · 30/04/2026 11:20
   En attente réception chez ABC Étalonnage

⚪ Réceptionnée chez l'étalonneur
⚪ En cours d'étalonnage
⚪ Retour préparé
⚪ Retour en transit
⚪ Retour réceptionné
⚪ Clôturée (intégration certificat)
```

Sur clic d'une étape passée → expand qui montre les détails (qui, quand, commentaire, photos).

### 6.4 Sections détail (colonne gauche, sous timeline)

Sections accordéons (toutes ouvertes par défaut) :

#### "Trajet & destinataire"
- Origine (site + responsable + adresse)
- Destination (site/entreprise + adresse + contact + téléphone)

#### "Dates"
- Date demande
- Date validation
- Date envoi souhaitée
- Date envoi effective
- Date réception
- Date retour estimée (avec compte à rebours si proche : "dans 12 jours")
- Date retour effective
- Date clôture

#### "Métadonnées"
- Motif
- Urgence (avec justification si non-normale)
- Produits chimiques (oui/non)
- Convention signée (oui/non + lien fichier)
- Souscription assurance

#### "Commentaires"
- Liste chronologique des commentaires ajoutés à chaque transition

### 6.5 Matériels concernés (colonne droite)

Liste de cartes matériel :

```
┌───────────────────────────────────────────────────┐
│ [Photo]  REF-1234                                 │
│          Sonde UT 5 MHz · Olympus 38DL Plus       │
│          État départ : CORRECT                    │
│          [Voir fiche matériel →]                  │
│ ─────────────────────────────────────────────     │
│ Photos départ : [📷] [📷] [📷] [+]                │
│ Photos retour : [—] (pas encore reçu)             │
└───────────────────────────────────────────────────┘
```

Sur ETALONNAGE, ajout après retour :
- État retour
- Lien vers certificat d'étalonnage
- Bouton "Saisir nouvelles dates étalonnage"

### 6.6 Documents (colonne droite, sous matériels)

Liste des fichiers liés au mouvement, groupés par type :
- Convention (si PRET_EXTERNE)
- Bon de transport aller / retour
- Photo colis aller / retour
- Certificat d'étalonnage (si ETALONNAGE)
- Documents complémentaires

Chaque fichier : icône type + nom + taille + date upload + uploader + actions (👁 ouvrir / ⬇ télécharger / 🗑 supprimer si autorisé).

### 6.7 Actions disponibles selon statut courant

Boutons en haut de page, contextuels au statut + rôle :

| Statut | Demandeur | Magasin | Admin |
|--------|-----------|---------|-------|
| BROUILLON | ✏️ Modifier · 📤 Soumettre · 🗑 Supprimer | — | toutes |
| SOUMISE | ✏️ Modifier · ❌ Annuler | ✅ Valider · ❌ Refuser | toutes |
| VALIDEE | 📦 Préparer (upload colis+bon) | 📦 Préparer | toutes |
| PRETE_A_EXPEDIER | — | 🚚 Confirmer expédition | toutes |
| EN_TRANSIT | — | ✓ Confirmer réception (si site dest) | toutes |
| RECUE / EN_COURS | — | 📦 Préparer retour (si étalonnage/prêt) | toutes |
| RETOUR_PRET | — | 🚚 Confirmer expédition retour | toutes |
| RETOUR_EN_TRANSIT | — | ✓ Confirmer réception retour | toutes |
| RETOUR_RECUE | — | 📜 Intégrer certificat (étalonnage) · 🔒 Clôturer | toutes |
| CLOTUREE | — | — | — |

Chaque action ouvre une **modale** dédiée (cf écran D).

---

## 7. Écran D — Modales de transition workflow

Toutes les modales suivent un layout commun :

```
┌─────────────────────────────────────────┐
│ Titre action               [✕]          │
│ Sous-titre contextuel                   │
│ ─────────────────────────────────────   │
│                                         │
│ [Contenu spécifique]                    │
│                                         │
│ Champs obligatoires marqués *           │
│                                         │
│ ─────────────────────────────────────   │
│ [Annuler]    [Action] (bouton accent)   │
└─────────────────────────────────────────┘
```

Largeur : 480-560px. Backdrop floutant.

### 7.1 Modale "Soumettre pour validation"

- Récap : matériels + destination
- Commentaire optionnel
- Bouton **"📤 Soumettre"**

### 7.2 Modale "Valider la demande" (Magasin)

- Récap demande
- Commentaire validation
- 2 boutons : **"❌ Refuser"** (rouge léger) | **"✅ Valider"** (accent)

### 7.3 Modale "Préparer à expédier"

- Liste matériels avec champ "État départ" par ligne (radio: CORRECT / LEGER_DEFAUT / HS) + commentaire
- Section upload **"Photos individuelles par matériel"** (optionnel mais recommandé)
- Section upload **"Photo du colis (préparé fermé)"** *
- Section upload **"Bon de transport"** *
- Bouton **"📦 Marquer comme prête à expédier"**

### 7.4 Modale "Confirmer expédition" (Magasin)

- Date d'envoi (datetime, défaut : maintenant)
- Transporteur (texte libre, optionnel)
- Numéro de suivi (optionnel)
- Commentaire
- Bouton **"🚚 Confirmer le départ"**

### 7.5 Modale "Confirmer réception" (Magasin destination)

- Date de réception (datetime, défaut : maintenant)
- État du colis : Bon / Endommagé (si endommagé : photos obligatoires + commentaire)
- Photos de réception (recommandé)
- État de chaque matériel à la réception (CORRECT / LEGER_DEFAUT / HS)
- Bouton **"✓ Confirmer réception"**

### 7.6 Modale "Préparer retour"

(Mêmes champs que 7.3 mais pour le retour.)

### 7.7 Modale "Confirmer expédition retour"

(Mêmes champs que 7.4.)

### 7.8 Modale "Confirmer réception retour"

(Mêmes champs que 7.5.)

### 7.9 Modale "Intégrer certificat d'étalonnage" (cas ETALONNAGE uniquement)

Layout 2 colonnes :

**Colonne gauche** : Upload PDF certificat
- Zone drop PDF
- Aperçu PDF embarqué (iframe ou viewer simple)
- Si extraction PDF possible : bouton **"🪄 Extraire automatiquement les dates"** qui pré-remplit les champs

**Colonne droite** : Saisie dates par matériel
Pour chaque matériel de la ligne (tableau) :
- Référence + libellé
- **Date d'étalonnage** * (datepicker)
- **Validité (mois)** * (input number)
- **Date prochain étalonnage** (calculée auto, lecture seule)
- Résultat : OK / Léger défaut / HS (radio)
- Commentaire

Bouton bas : **"📜 Intégrer le certificat"** (intègre le PDF + applique les dates au matériel).

### 7.10 Modale "Clôturer le mouvement"

- Récap final
- Vérification de cohérence : tous les matériels ont un état retour, certificat présent (si étalonnage), etc.
- Commentaire de clôture
- Bouton **"🔒 Clôturer"** (transition finale)

### 7.11 Modale "Annuler le mouvement"

- Avertissement (rouge léger) : "Cette action est irréversible avant expédition"
- Motif d'annulation * (textarea)
- 2 boutons : **"Garder"** | **"❌ Annuler le mouvement"**

---

## 8. Écran E — Calendrier matériel (timeline)

**Route** : `/calendrier` (vue globale) et `/materiels/:id?tab=calendrier` (vue par matériel)

### 8.1 Vue globale calendrier

Vue en grille type Gantt :
- **Lignes** : matériels (regroupés par type END ou par site, sélecteur en haut)
- **Colonnes** : jours/semaines (zoom : Jour / Semaine / Mois / Trimestre)
- **Bandes horizontales** sur chaque ligne représentent :
  - **Mouvements actifs** : bandes pleines colorées par type
  - **Mouvements passés** : bandes grises pâles
  - **Réservations futures** : bandes hachurées colorées
  - **Pas de chevauchement possible** entre réservations sur une même ligne

### 8.2 En-tête calendrier

```
┌──────────────────────────────────────────────────────────┐
│ Calendrier matériels      [Jour|Semaine|Mois|Trimestre]  │
│ [← 28 avril → 4 mai 2026 →]   [Aujourd'hui]              │
│                                                          │
│ Filtres : [Type END ▼] [Site ▼] [Type matériel ▼]        │
│ Légende : ▌ Transfert ▌ Étalonnage ▌ Prêt ext.           │
│           ▌ Prêt int.  ▌▌ Réservation                    │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Interactions

- **Hover sur une bande** : tooltip avec type + dates + demandeur + matériels
- **Clic sur une bande mouvement** : ouvre le détail mouvement en drawer
- **Clic sur une bande réservation** : ouvre le détail réservation avec bouton "Activer en mouvement"
- **Drag & drop d'une réservation** : déplace les dates (avec confirmation)
- **Clic sur un créneau vide** : propose de créer une réservation pour ce matériel à cette date
- **Clic droit sur une ligne matériel** : menu contextuel (réserver, voir fiche, créer mouvement)

### 8.4 Codes couleur

| Élément | Couleur | Style |
|---------|---------|-------|
| Mouvement TRANSFERT_SITE | sky | bande pleine |
| Mouvement ETALONNAGE | violet | bande pleine |
| Mouvement PRET_EXTERNE | amber | bande pleine |
| Mouvement PRET_INTERNE | emerald | bande pleine |
| Mouvement passé (clôturé) | gris pâle | bande pleine effacée |
| Réservation CONFIRMEE | type prévu | bande hachurée |
| Réservation HONOREE | gris | bande hachurée pâle |
| Échéance étalonnage | rose | indicateur ▼ au-dessus |
| Aujourd'hui | accent | ligne verticale |

### 8.5 Vue par matériel (intégrée au drawer matériel)

Onglet supplémentaire **"Calendrier"** dans le drawer matériel existant. Affiche une timeline horizontale linéaire (1 seule ligne) montrant :
- Historique des mouvements passés
- Mouvement actif (s'il y en a un)
- Réservations futures
- Échéances étalonnage (markers)

---

## 9. Écran F — Création/édition réservation

**Modale** déclenchée depuis : bouton "+ Réserver" sur calendrier, fiche matériel, ou page réservations.

### 9.1 Layout modale (largeur 600px)

```
┌──────────────────────────────────────────────────┐
│ Nouvelle réservation                       [✕]   │
│ Bloquer un matériel pour une période future      │
│ ────────────────────────────────────────────     │
│                                                  │
│ Matériels concernés *                            │
│ [+ Ajouter un matériel]                          │
│ ┌─────────────────────────────────────────────┐  │
│ │ [REF-1234] Sonde UT 5MHz · Cattenom    [✕]  │  │
│ │ ⚠ Conflit : déjà réservée du 03/05 au 07/05 │  │
│ ├─────────────────────────────────────────────┤  │
│ │ [REF-5678] Caméra TF · Civaux          [✕]  │  │
│ │ ✓ Disponible                                │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ Période *                                        │
│ Du [📅 02/05/2026]  au  [📅 08/05/2026]          │
│ Durée : 6 jours                                  │
│                                                  │
│ Type prévu                                       │
│ ⦿ Transfert  ○ Étalonnage  ○ Prêt ext.  ○ int.   │
│                                                  │
│ Motif *                                          │
│ [textarea]                                       │
│                                                  │
│ Commentaire                                      │
│ [textarea]                                       │
│                                                  │
│ ────────────────────────────────────────────     │
│        [Annuler]    [Confirmer la réservation]   │
└──────────────────────────────────────────────────┘
```

### 9.2 Sélection multi-matériels (panier)

- Champ recherche autocomplete : tape ref/libellé → ajoute à la liste
- Chaque ligne : ref + libellé + site + indicateur conflit (✓ ou ⚠)
- Si conflit : un message rouge sous la ligne explique pourquoi (autre réservation, mouvement actif)
- **L'utilisateur ne peut pas confirmer si au moins un matériel est en conflit** (bouton désactivé avec tooltip explicatif)
- Possibilité de retirer un matériel en conflit pour débloquer

### 9.3 Sélecteur de période

- 2 datepickers côte à côte
- Affiche la durée calculée
- Validation : dateFin > dateDebut, pas dans le passé
- Suggestions rapides : "+1 jour", "+1 semaine", "+1 mois" boutons à côté du datepicker fin

### 9.4 Mode édition

Même modale, pré-remplie. Header : "Modifier la réservation". Bouton supplémentaire en bas à gauche : **"🗑 Annuler la réservation"** (avec confirmation).

### 9.5 Action "Activer en mouvement" depuis une réservation

Bouton dans le détail réservation → ouvre le wizard de création mouvement (écran B) avec :
- Type pré-rempli depuis la réservation
- Matériels pré-remplis depuis la réservation
- Date envoi pré-remplie sur dateDebut
- Date retour pré-remplie sur dateFin (si étalonnage/prêt)
- À la création du mouvement : la réservation passe automatiquement en statut HONOREE

---

## 10. Écran G — Liste des réservations

**Route** : `/reservations`

### 10.1 En-tête + KPIs

- Titre : "Réservations matériel"
- Bouton primaire : "+ Nouvelle réservation"
- Bouton secondaire : "📅 Voir le calendrier"

KPIs :
| Carte | Valeur |
|-------|--------|
| Réservations actives | nombre statut=CONFIRMEE |
| Cette semaine | dont dateDebut dans 7 jours |
| À activer aujourd'hui | dateDebut = aujourd'hui |
| Mes réservations | filtré sur user courant |

### 10.2 Tableau

Colonnes :
| N° | Matériel(s) | Demandeur | Du - Au | Durée | Type prévu | Statut | Actions |

Statut pills :
- CONFIRMEE : sky
- HONOREE : emerald
- ANNULEE : gris rayé

Actions par ligne :
- Voir détail
- Activer en mouvement (si CONFIRMEE et date arrivée)
- Modifier
- Annuler

---

## 11. Écran H — Onglet "Mouvements" dans le drawer matériel

Le drawer existant a déjà : Infos / PJ / Photos / Historique / QR.

Ajouter **2 nouveaux onglets** :

### 11.1 Onglet "Mouvements"

Liste verticale chronologique des mouvements passés et en cours pour ce matériel :

```
┌─────────────────────────────────────────────────┐
│ EN COURS · MV-2026-0042 · ÉTALONNAGE · violet   │
│ Chez ABC Étalonnage · Retour prévu 15/06        │
│ [Voir détail →]                                 │
├─────────────────────────────────────────────────┤
│ Clôturé · MV-2026-0028 · TRANSFERT · sky        │
│ Du 10/03 au 12/03 · Cattenom → Civaux           │
│ [Voir détail →]                                 │
├─────────────────────────────────────────────────┤
│ Clôturé · MV-2026-0015 · PRET INTERNE · emerald │
│ Du 02/02 au 28/02 · Groupe G1 → Groupe G3       │
└─────────────────────────────────────────────────┘
```

### 11.2 Onglet "Calendrier"

Cf §8.5 — vue timeline horizontale du matériel.

---

## 12. Écran I — KPIs Dashboard accueil enrichis

Sur `/` (HomePage), ajouter une section **"Activité logistique"** :

| Carte | Valeur |
|-------|--------|
| Mouvements en cours | nb total actif |
| Étalonnages chez prestataire | nb EN_COURS type=ETALONNAGE |
| Prêts en cours | nb EN_COURS type=PRET_* |
| Retards de retour | nb dépassés |

Chaque carte cliquable → navigue vers `/mouvements` avec filtre approprié.

---

## 13. États visuels et feedback

### 13.1 États de chargement

- Listes : skeletons gris pulsés à hauteur de ligne
- Détail : skeleton du layout
- Calendrier : skeleton bandes grises pulsées

### 13.2 États vides

- Liste vide : illustration légère + texte explicatif + CTA
- Aucun mouvement pour un matériel : "Aucun mouvement enregistré · [+ Créer un mouvement]"
- Aucune réservation : "Aucune réservation · [+ Réserver ce matériel]"

### 13.3 États d'erreur

- Erreur API : bandeau rouge en haut de page avec message + bouton "Réessayer"
- Erreur de validation : message rouge sous le champ + icône ⚠ dans le label

### 13.4 Feedback succès

- Toast vert en bas droite : "Mouvement créé · [Voir]"
- Toast vert : "Réservation confirmée"
- Animation discrète sur la ligne ajoutée dans une liste

---

## 14. Responsive et accessibilité

### 14.1 Breakpoints

- **Desktop** ≥ 1280px : layout complet
- **Tablette** 768-1279px : sidebar collapsable, calendrier en mode "semaine" forcée, drawer plein écran
- **Mobile** < 768px : pas une priorité (app utilisée principalement en desktop), mais formulaires et détails doivent rester lisibles (1 colonne, drawer plein écran, pas de tableau dense)

### 14.2 Accessibilité

- Tous les boutons d'action ont un label texte (pas que icône)
- Contraste minimum AA sur tous les textes
- Navigation clavier : Tab, Enter pour activer, Esc pour fermer modales
- Statuts : pas que la couleur, toujours un texte associé (le pill avec dot ne suffit pas seul, ajouter aria-label)
- Calendrier : navigable au clavier (flèches), avec annonces ARIA des dates et événements

---

## 15. Ce qu'il faut produire

Pour Claude Design, je veux des **maquettes visuelles** au format suivant :

### 15.1 Livrables prioritaires (P1)

1. **Dashboard Mouvements** (écran A) — desktop, 1440px de large
2. **Wizard création mouvement** (écran B) — les 4 étapes, vue desktop
3. **Détail mouvement** (écran C) — pour chaque type (4 vues : transfert / étalonnage / prêt ext / prêt int) à différents statuts (validation, en transit, en cours, clôturée)
4. **Modales workflow** (écran D) — au minimum : valider, préparer expédier, confirmer expédition, confirmer réception, intégrer certificat, clôturer

### 15.2 Livrables secondaires (P2)

5. **Calendrier matériel** (écran E) — vue globale + vue intégrée drawer
6. **Création réservation** (écran F)
7. **Liste réservations** (écran G)
8. **Onglets ajoutés au drawer matériel** (écran H)

### 15.3 Format

- Figma ou équivalent, organisé en pages par écran
- Mobile non requis pour cette première itération
- Utiliser strictement la palette de couleurs et les composants du §2
- Préciser les états (hover, focus, disabled, loading, error, empty)
- Annotations sur les interactions clés (clics, ouvertures, transitions)

### 15.4 Ce qui reste à arbitrer côté design

- Iconographie : conserver le style outline existant ou enrichir ?
- Calendrier : framework visuel (Gantt classique vs timeline plus moderne) ?
- Wizard : barre de progression linéaire vs steps cliquables vs tabs ?
- Affichage des photos colis : grille de miniatures vs lightbox vs viewer immersif ?

---

## 16. Annexes utiles

### 16.1 Routes existantes à connaître pour cohérence

- `/` Dashboard
- `/materiels` Liste matériels (avec KPIs cliquables, filtres, drawer)
- `/materiels/:id` Détail matériel
- `/maquettes` Liste maquettes
- `/agents` Liste agents
- `/admin/...` Pages admin

### 16.2 Modules connexes à intégrer

- **Matériels** : un mouvement référence des matériels existants
- **Référentiels** : Sites, Entreprises, Groupes (pôles)
- **Agents** : demandeur, validateur, expéditeur, réceptionneur
- **Fichiers** : système d'upload existant (drag&drop multi-fichiers, contexte, types)
- **Historique/Évènements** : chaque transition de mouvement génère un évènement traçable

### 16.3 Glossaire métier rapide

- **Matériel END** : équipement de Contrôle Non Destructif (ultrasons, radiographie, etc.)
- **Étalonnage** : vérification métrologique périodique obligatoire
- **Société titulaire** : sous-traitant EDF qui peut emprunter du matériel
- **Pôle / Groupe** : unité organisationnelle interne EDF
- **Magasin** : équipe gérant physiquement les expéditions/réceptions
- **Bon de transport** : document logistique du transporteur
- **Convention** : contrat de prêt signé entre EDF et la société titulaire




import { Injectable } from '@nestjs/common';
import { MaterielsService } from '../materiels/materiels.service';
import { MaquettesService } from '../maquettes/maquettes.service';
import { SitesService } from '../sites/sites.service';

type Intent =
  | { type: 'search_materiels'; filters: SearchFilters }
  | { type: 'search_maquettes'; filters: SearchFilters }
  | { type: 'detail_materiel'; id: number }
  | { type: 'detail_maquette'; id: number }
  | { type: 'stats' }
  | { type: 'list_sites' }
  | { type: 'help' };

interface SearchFilters {
  search?: string;
  etat?: string;
  site?: string;
  typeEND?: string;
  enPret?: string;
  etalonnageEchu?: string;
  echeance30j?: string;
  hsIncomplet?: string;
  completude?: string;
  typeMaquette?: string;
}

const TYPE_END_CODES = ['UT', 'RT', 'PT', 'MT', 'ET', 'VT', 'AT', 'LT'];

const ETAT_SYNONYMS: Array<{ patterns: string[]; value: string }> = [
  {
    value: 'HS',
    patterns: [
      'hs', 'hors service', 'hors-service', 'casse', 'defectueux',
      'panne', 'en panne', 'defaillant', 'inutilisable', 'mort',
      'foutu', 'naze', 'abime', 'endommage',
    ],
  },
  {
    value: 'PERDU',
    patterns: [
      'perdu', 'perdus', 'egare', 'manquant', 'introuvable',
      'disparu', 'volatilise',
    ],
  },
  {
    value: 'DISPONIBLE',
    patterns: [
      'disponible', 'disponibles', 'dispo', 'dispos', 'libre',
      'libres', 'utilisable', 'pret a l\'emploi', 'operationnel',
    ],
  },
  {
    value: 'EN_SERVICE',
    patterns: [
      'en service', 'en-service', 'en utilisation', 'utilise',
      'actif', 'en cours', 'deploye', 'en production',
    ],
  },
  {
    value: 'EN_REPARATION',
    patterns: [
      'en reparation', 'reparation', 'en maintenance', 'maintenance',
      'en revision', 'revision', 'repare', 'en cours de reparation',
    ],
  },
  {
    value: 'REFORME',
    patterns: [
      'reforme', 'reformes', 'decommissionne', 'mis au rebut',
      'rebut', 'retire', 'obsolete', 'archive',
    ],
  },
  {
    value: 'STOCK',
    patterns: [
      'en stock', 'stock', 'stocke', 'magasin', 'en magasin',
      'en reserve', 'reserve', 'range', 'entrepose',
    ],
  },
  {
    value: 'EMPRUNTEE',
    patterns: [
      'empruntee', 'empruntees', 'emprunte', 'empruntes',
      'sortie', 'sorti', 'sortis',
    ],
  },
];

const STATS_WORDS = [
  'combien', 'nombre', 'total', 'stats', 'stat', 'statistique',
  'statistiques', 'chiffres', 'chiffre', 'quantite', 'recap',
  'recapitulatif', 'resume', 'bilan', 'synthese', 'tableau de bord',
  'dashboard', 'kpi', 'indicateur', 'indicateurs', 'overview',
];

const SEARCH_TRIGGERS = [
  'cherche', 'recherche', 'trouve', 'trouver', 'montre', 'montrer',
  'affiche', 'afficher', 'donne', 'donner', 'voir', 'liste',
  'lister', 'quels', 'quelles', 'quel', 'quelle', 'ou sont',
  'ou est', 'y a-t-il', 'y a t il', 'est-ce qu', 'existe',
  'besoin', 'faut', 'veux', 'voudrais', 'peux-tu', 'pourrais-tu',
  'j\'ai besoin', 'j\'aimerais', 'je veux',
];

const MATERIEL_WORDS = [
  'materiel', 'materiels', 'equipement', 'equipements', 'appareil',
  'appareils', 'instrument', 'instruments', 'capteur', 'capteurs',
  'sonde', 'sondes', 'detecteur', 'detecteurs', 'end',
];

const MAQUETTE_WORDS = [
  'maquette', 'maquettes', 'prototype', 'prototypes', 'modele',
  'modeles', 'piece', 'pieces', 'echantillon', 'echantillons',
  'eprouvette', 'eprouvettes',
];

const HELP_WORDS = [
  'aide', 'help', 'comment', 'que peux', 'que sais', 'quoi faire',
  'bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'hey',
];

const SITE_TRIGGERS = [
  'liste des sites', 'tous les sites', 'quels sites', 'les sites',
  'sites disponibles', 'sites existants', 'sites enregistres',
  'ou se trouvent', 'localisation', 'emplacements',
];

const PRET_SYNONYMS = [
  'en pret', 'prete', 'pretes', 'prets', 'emprunte', 'emprunt',
  'sorti', 'sortie', 'sortis', 'sorties', 'pret en cours',
];

const ETALONNAGE_ECHU_SYNONYMS = [
  'etalonnage echu', 'etalonnage expire', 'etalonnage perime',
  'calibration echue', 'calibration expiree', 'echu', 'expire',
  'perime', 'plus a jour', 'non valide', 'validite depassee',
  'hors validite', 'a re-etalonner', 'non etalone',
];

const ECHEANCE_30J_SYNONYMS = [
  'echeance 30', '30 jours', 'bientot expire', 'expire bientot',
  'va expirer', 'prochainement', 'a venir', 'urgent', 'urgents',
  'echeance proche', 'prochain etalonnage',
];

@Injectable()
export class ChatService {
  private sitesCache: Array<{ code: string; label: string; ville?: string | null }> | null = null;

  constructor(
    private readonly materiels: MaterielsService,
    private readonly maquettes: MaquettesService,
    private readonly sites: SitesService,
  ) {}

  async chat(message: string): Promise<{ reply: string }> {
    const intent = await this.parseIntent(message);
    return this.execute(intent);
  }

  private norm(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['']/g, "'")
      .replace(/[-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private includes(text: string, patterns: string[]): string | null {
    for (const p of patterns) {
      if (text.includes(p)) return p;
    }
    return null;
  }

  private fuzzyMatch(word: string, target: string): boolean {
    if (target.includes(word) || word.includes(target)) return true;
    if (word.length < 3 || target.length < 3) return word === target;
    if (target.startsWith(word.slice(0, Math.max(3, word.length - 2)))) return true;
    const dist = this.levenshtein(word, target);
    const threshold = target.length <= 4 ? 1 : 2;
    return dist <= threshold;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
    }
    return dp[m][n];
  }

  private async getSites() {
    if (!this.sitesCache) {
      try {
        this.sitesCache = await this.sites.findAll();
      } catch {
        this.sitesCache = [];
      }
    }
    return this.sitesCache;
  }

  private async parseIntent(message: string): Promise<Intent> {
    const n = this.norm(message);
    const words = n.split(/\s+/);

    if (!n || words.length === 0) return { type: 'help' };

    if (words.length <= 3 && this.includes(n, HELP_WORDS)) {
      return { type: 'help' };
    }

    if (this.includes(n, SITE_TRIGGERS)) {
      return { type: 'list_sites' };
    }

    const isMaquette = words.some((w) => MAQUETTE_WORDS.some((m) => this.fuzzyMatch(w, m)));
    const isMateriel = words.some((w) => MATERIEL_WORDS.some((m) => this.fuzzyMatch(w, m)));

    const idMatch = message.match(/#\s*(\d{1,7})\b/) || message.match(/\bid\s*[:=]?\s*(\d{1,7})\b/i);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      if (isMaquette) return { type: 'detail_maquette', id };
      return { type: 'detail_materiel', id };
    }

    const isStatsIntent = this.includes(n, STATS_WORDS);
    if (isStatsIntent && !this.hasSpecificFilters(n, words)) {
      return { type: 'stats' };
    }

    const filters = await this.extractFilters(message, n, words);

    if (isMaquette) return { type: 'search_maquettes', filters };
    if (isMateriel) return { type: 'search_materiels', filters };

    const hasAnyFilter = Object.values(filters).some((v) => v !== undefined);
    if (hasAnyFilter) return { type: 'search_materiels', filters };

    if (this.includes(n, SEARCH_TRIGGERS.slice(0, 10))) {
      if (!filters.search) filters.search = this.extractFreeText(n);
      return { type: 'search_materiels', filters };
    }

    if (n.length > 2) {
      filters.search = this.extractFreeText(n);
      return { type: 'search_materiels', filters };
    }

    return { type: 'help' };
  }

  private hasSpecificFilters(n: string, words: string[]): boolean {
    for (const t of TYPE_END_CODES) {
      if (words.includes(t.toLowerCase())) return true;
    }
    for (const { patterns } of ETAT_SYNONYMS) {
      if (this.includes(n, patterns)) return true;
    }
    return false;
  }

  private async extractFilters(message: string, n: string, words: string[]): Promise<SearchFilters> {
    const filters: SearchFilters = {};

    for (const t of TYPE_END_CODES) {
      if (words.includes(t.toLowerCase())) {
        filters.typeEND = t;
        break;
      }
    }

    for (const { patterns, value } of ETAT_SYNONYMS) {
      if (this.includes(n, patterns)) {
        filters.etat = value;
        break;
      }
      for (const w of words) {
        if (w.length >= 4 && patterns.some((p) => !p.includes(' ') && this.fuzzyMatch(w, p))) {
          filters.etat = value;
          break;
        }
      }
      if (filters.etat) break;
    }

    if (this.includes(n, PRET_SYNONYMS)) {
      filters.enPret = 'true';
    }

    if (this.includes(n, ETALONNAGE_ECHU_SYNONYMS)) {
      filters.etalonnageEchu = 'true';
    }

    if (this.includes(n, ECHEANCE_30J_SYNONYMS)) {
      filters.echeance30j = 'true';
    }

    if (words.some((w) => this.fuzzyMatch(w, 'incomplet') || this.fuzzyMatch(w, 'incomplets') || this.fuzzyMatch(w, 'incompletude'))) {
      filters.completude = 'INCOMPLET';
    }

    const sites = await this.getSites();
    for (const site of sites) {
      const labelNorm = this.norm(site.label || '');
      const codeNorm = site.code.toLowerCase();
      const villeNorm = site.ville ? this.norm(site.ville) : null;

      if (labelNorm && n.includes(labelNorm)) {
        filters.site = site.code;
        break;
      }
      if (n.includes(codeNorm)) {
        filters.site = site.code;
        break;
      }
      if (villeNorm && villeNorm.length > 3 && n.includes(villeNorm)) {
        filters.site = site.code;
        break;
      }
      for (const w of words) {
        if (w.length >= 4) {
          if (this.fuzzyMatch(w, labelNorm)) { filters.site = site.code; break; }
          if (this.fuzzyMatch(w, codeNorm)) { filters.site = site.code; break; }
          if (villeNorm && villeNorm.length > 3 && this.fuzzyMatch(w, villeNorm)) { filters.site = site.code; break; }
        }
      }
      if (filters.site) break;
    }

    const quoted = message.match(/"([^"]+)"|«\s*([^»]+)\s*»/);
    if (quoted) {
      filters.search = (quoted[1] || quoted[2]).trim();
    } else {
      const fiec = message.match(/FIEC[\s:\-]*(\S+)/i);
      if (fiec) {
        filters.search = fiec[1];
      } else {
        const ref = message.match(/\b(?:ref(?:erence)?)\s*[:\-]?\s*(\S+)/i);
        if (ref) filters.search = ref[1];
      }
    }

    return filters;
  }

  private extractFreeText(n: string): string {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'a', 'au', 'aux',
      'et', 'ou', 'en', 'sur', 'dans', 'pour', 'par', 'avec', 'que', 'qui',
      'est', 'sont', 'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils',
      'me', 'te', 'se', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa',
      'ses', 'ce', 'cette', 'ces', 'quel', 'quelle', 'quels', 'quelles',
      'tous', 'tout', 'toute', 'toutes', 'y', 'ne', 'pas', 'plus',
      ...SEARCH_TRIGGERS.map((s) => this.norm(s)),
      ...MATERIEL_WORDS,
      ...MAQUETTE_WORDS,
    ]);
    return n
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
      .join(' ');
  }

  private async execute(intent: Intent): Promise<{ reply: string }> {
    switch (intent.type) {
      case 'help':
        return { reply: this.helpMessage() };

      case 'list_sites': {
        const sites = await this.getSites();
        if (sites.length === 0) return { reply: 'Aucun site enregistré.' };
        const list = sites
          .map((s) => `• **${s.code}** — ${s.label}${s.ville ? ` (${s.ville})` : ''}`)
          .join('\n');
        return { reply: `**${sites.length} sites disponibles :**\n\n${list}` };
      }

      case 'stats': {
        const s = await this.materiels.stats();
        return {
          reply:
            `**Statistiques matériels :**\n\n` +
            `• Total : **${s.total}**\n` +
            `• Étalonnages échus : **${s.echus}**\n` +
            `• Échéance < 30 jours : **${s.prochains}**\n` +
            `• En prêt : **${s.enPret}**\n` +
            `• HS / Perdus : **${s.hs}**\n` +
            `• Incomplets : **${s.incomplets}**`,
        };
      }

      case 'detail_materiel': {
        try {
          const m: any = await this.materiels.findOne(intent.id);
          return { reply: this.formatMaterielDetail(m) };
        } catch {
          return { reply: `Matériel #${intent.id} introuvable.` };
        }
      }

      case 'detail_maquette': {
        try {
          const m: any = await this.maquettes.findOne(intent.id);
          return { reply: this.formatMaquetteDetail(m) };
        } catch {
          return { reply: `Maquette #${intent.id} introuvable.` };
        }
      }

      case 'search_materiels': {
        const result = await this.materiels.findAll({
          page: 1,
          pageSize: 10,
          ...intent.filters,
        });
        if (result.total === 0) {
          return {
            reply:
              `Aucun matériel trouvé.\n\n` +
              `Critères détectés : ${this.formatFilters(intent.filters)}\n\n` +
              `Essayez d'élargir votre recherche ou tapez "aide".`,
          };
        }
        const list = result.data
          .map(
            (m: any) =>
              `• **${m.reference}** — ${m.libelle}\n  ${m.etat || '–'} | ${m.site || '–'}${m.typeEND ? ` | ${m.typeEND}` : ''} | ID #${m.id}`,
          )
          .join('\n');
        const more =
          result.total > 10 ? `\n\n_… et ${result.total - 10} autre(s)_` : '';
        return {
          reply: `**${result.total} matériel${result.total > 1 ? 's' : ''} trouvé${result.total > 1 ? 's' : ''}** _(${this.formatFilters(intent.filters)})_ :\n\n${list}${more}`,
        };
      }

      case 'search_maquettes': {
        const result = await this.maquettes.findAll({
          page: 1,
          pageSize: 10,
          search: intent.filters.search,
          etat: intent.filters.etat,
          site: intent.filters.site,
          typeMaquette: intent.filters.typeMaquette,
        });
        if (result.total === 0) {
          return {
            reply:
              `Aucune maquette trouvée.\n\nCritères : ${this.formatFilters(intent.filters)}`,
          };
        }
        const list = result.data
          .map(
            (m: any) =>
              `• **${m.reference}** — ${m.libelle}\n  ${m.etat || '–'} | ${m.site || '–'} | ID #${m.id}`,
          )
          .join('\n');
        const more =
          result.total > 10 ? `\n\n_… et ${result.total - 10} autre(s)_` : '';
        return {
          reply: `**${result.total} maquette${result.total > 1 ? 's' : ''} trouvée${result.total > 1 ? 's' : ''}** _(${this.formatFilters(intent.filters)})_ :\n\n${list}${more}`,
        };
      }

      default:
        return { reply: this.helpMessage() };
    }
  }

  private formatFilters(f: SearchFilters): string {
    const parts: string[] = [];
    if (f.search) parts.push(`recherche: "${f.search}"`);
    if (f.typeEND) parts.push(`type: ${f.typeEND}`);
    if (f.etat) parts.push(`état: ${f.etat}`);
    if (f.site) parts.push(`site: ${f.site}`);
    if (f.enPret === 'true') parts.push('en prêt');
    if (f.etalonnageEchu === 'true') parts.push('étalonnage échu');
    if (f.echeance30j === 'true') parts.push('échéance < 30j');
    if (f.completude === 'INCOMPLET') parts.push('incomplet');
    if (f.hsIncomplet === 'true') parts.push('HS ou incomplet');
    return parts.length > 0 ? parts.join(', ') : 'tous';
  }

  private formatMaterielDetail(m: any): string {
    const lines = [`**${m.reference}** — ${m.libelle} _(ID #${m.id})_`];
    if (m.etat) lines.push(`• État : ${m.etat}`);
    if (m.typeEND) lines.push(`• Type END : ${m.typeEND}`);
    if (m.typeMateriel) lines.push(`• Type matériel : ${m.typeMateriel}`);
    if (m.site) lines.push(`• Site : ${m.site}`);
    if (m.localisation) lines.push(`• Localisation : ${m.localisation}`);
    if (m.modele) lines.push(`• Modèle : ${m.modele}`);
    if (m.fournisseur) lines.push(`• Fournisseur : ${m.fournisseur}`);
    if (m.numeroSerie) lines.push(`• N° série : ${m.numeroSerie}`);
    if (m.numeroFIEC) lines.push(`• N° FIEC : ${m.numeroFIEC}`);
    if (m.groupe) lines.push(`• Groupe : ${m.groupe}`);
    if (m.completude) lines.push(`• Complétude : ${m.completude}`);
    if (m.enPret) lines.push(`• En prêt : oui${m.motifPret ? ` (${m.motifPret})` : ''}`);
    if (m.dateProchainEtalonnage) {
      const d = new Date(m.dateProchainEtalonnage);
      const isEchu = d < new Date();
      lines.push(`• Prochain étalonnage : ${d.toLocaleDateString('fr-FR')}${isEchu ? ' ⚠️ ÉCHU' : ''}`);
    }
    if (m.responsable) lines.push(`• Responsable : ${m.responsable.prenom} ${m.responsable.nom}`);
    if (m.commentaires) lines.push(`• Notes : ${m.commentaires}`);
    return lines.join('\n');
  }

  private formatMaquetteDetail(m: any): string {
    const lines = [`**${m.reference}** — ${m.libelle} _(ID #${m.id})_`];
    if (m.etat) lines.push(`• État : ${m.etat}`);
    if (m.typeMaquette) lines.push(`• Type : ${m.typeMaquette}`);
    if (m.site) lines.push(`• Site : ${m.site}`);
    if (m.composant) lines.push(`• Composant : ${m.composant}`);
    if (m.categorie) lines.push(`• Catégorie : ${m.categorie}`);
    if (m.forme) lines.push(`• Forme : ${m.forme}`);
    if (m.matiere) lines.push(`• Matière : ${m.matiere}`);
    if (m.procedure) lines.push(`• Procédure : ${m.procedure}`);
    return lines.join('\n');
  }

  private helpMessage(): string {
    return (
      `**Bonjour ! Je suis l'assistant OGADE.**\n\n` +
      `Voici ce que je peux faire :\n\n` +
      `**Recherche matériels :**\n` +
      `• "matériels UT sur Gravelines"\n` +
      `• "équipements disponibles"\n` +
      `• "matériels HS"\n` +
      `• "matériels en prêt"\n` +
      `• "étalonnage échu"\n` +
      `• "matériels incomplets"\n` +
      `• "FIEC 12345"\n\n` +
      `**Recherche maquettes :**\n` +
      `• "maquettes en stock"\n` +
      `• "maquettes sur Cattenom"\n\n` +
      `**Détails :**\n` +
      `• "matériel #42"\n` +
      `• "maquette #15"\n\n` +
      `**Statistiques & sites :**\n` +
      `• "combien de matériels"\n` +
      `• "liste des sites"\n\n` +
      `Vous pouvez aussi écrire naturellement, par exemple :\n` +
      `_"montre-moi les capteurs disponibles à Chooz"_`
    );
  }
}

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

const ETAT_PATTERNS: Array<[RegExp, string]> = [
  [/\b(?:hors\s*service|hs)\b/, 'HS'],
  [/\bperdus?\b/, 'PERDU'],
  [/\bdisponibles?\b/, 'DISPONIBLE'],
  [/\ben\s+service\b/, 'EN_SERVICE'],
  [/\b(?:en\s+)?reparation\b/, 'EN_REPARATION'],
  [/\breformes?\b/, 'REFORME'],
  [/\b(?:en\s+)?stock\b/, 'STOCK'],
  [/\bempruntees?\b/, 'EMPRUNTEE'],
];

@Injectable()
export class ChatService {
  constructor(
    private readonly materiels: MaterielsService,
    private readonly maquettes: MaquettesService,
    private readonly sites: SitesService,
  ) {}

  async chat(message: string): Promise<{ reply: string }> {
    const intent = await this.parseIntent(message);
    return this.execute(intent);
  }

  private normalize(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  private async parseIntent(message: string): Promise<Intent> {
    const norm = this.normalize(message);

    if (!norm.trim()) return { type: 'help' };

    if (/\b(aide|help|que peux-tu|que sais-tu|comment)\b/.test(norm) && message.length < 30) {
      return { type: 'help' };
    }

    if (/\b(liste\s+(?:des\s+)?sites?|tous\s+les\s+sites?|quels\s+sites?)\b/.test(norm)) {
      return { type: 'list_sites' };
    }

    const isMaquette = /\bmaquettes?\b/.test(norm);
    const isMateriel = /\b(materiels?|equipements?|appareils?|instruments?)\b/.test(norm);

    const idMatch = message.match(/#(\d{1,7})\b/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      if (isMaquette) return { type: 'detail_maquette', id };
      return { type: 'detail_materiel', id };
    }

    if (/\b(combien|nombre|total|stats?|statistiques?)\b/.test(norm) && !this.hasSpecificFilters(norm, message)) {
      return { type: 'stats' };
    }

    const filters = await this.extractFilters(message, norm);

    if (isMaquette) return { type: 'search_maquettes', filters };
    return { type: 'search_materiels', filters };
  }

  private hasSpecificFilters(norm: string, original: string): boolean {
    for (const t of TYPE_END_CODES) {
      if (new RegExp(`\\b${t.toLowerCase()}\\b`).test(norm)) return true;
    }
    for (const [pattern] of ETAT_PATTERNS) {
      if (pattern.test(norm)) return true;
    }
    if (/"[^"]+"|«[^»]+»/.test(original)) return true;
    return false;
  }

  private async extractFilters(message: string, norm: string): Promise<SearchFilters> {
    const filters: SearchFilters = {};

    for (const t of TYPE_END_CODES) {
      if (new RegExp(`\\b${t.toLowerCase()}\\b`).test(norm)) {
        filters.typeEND = t;
        break;
      }
    }

    for (const [pattern, etat] of ETAT_PATTERNS) {
      if (pattern.test(norm)) {
        filters.etat = etat;
        break;
      }
    }

    if (/\b(en\s+pret|pretes?|emprunte)\b/.test(norm)) {
      filters.enPret = 'true';
    }

    if (/\b(etalonnage\s+(echu|expire|perime)|expire|perime)\b/.test(norm)) {
      filters.etalonnageEchu = 'true';
    }

    if (/\b(echeance\s+30|30\s*jours?|bientot\s+expire)\b/.test(norm)) {
      filters.echeance30j = 'true';
    }

    if (/\bincomplets?\b/.test(norm)) {
      filters.completude = 'INCOMPLET';
    }

    try {
      const sites = await this.sites.findAll();
      for (const site of sites) {
        const labelNorm = this.normalize(site.label || '');
        const codeNorm = this.normalize(site.code);
        if (labelNorm && norm.includes(labelNorm)) {
          filters.site = site.code;
          break;
        }
        if (codeNorm && new RegExp(`\\b${codeNorm}\\b`).test(norm)) {
          filters.site = site.code;
          break;
        }
      }
    } catch {}

    const quoted = message.match(/"([^"]+)"|«\s*([^»]+)\s*»/);
    if (quoted) {
      filters.search = (quoted[1] || quoted[2]).trim();
    } else {
      const fiec = message.match(/FIEC[\s:\-]*(\S+)/i);
      if (fiec) filters.search = fiec[1];
      else {
        const ref = message.match(/\b(?:ref(?:erence)?)\s*[:\-]?\s*(\S+)/i);
        if (ref) filters.search = ref[1];
      }
    }

    return filters;
  }

  private async execute(intent: Intent): Promise<{ reply: string }> {
    switch (intent.type) {
      case 'help':
        return { reply: this.helpMessage() };

      case 'list_sites': {
        const sites = await this.sites.findAll();
        if (sites.length === 0) return { reply: 'Aucun site enregistré.' };
        const list = sites
          .map((s) => `• **${s.code}** — ${s.label}${s.ville ? ` (${s.ville})` : ''}`)
          .join('\n');
        return { reply: `🗺️ **${sites.length} sites disponibles :**\n\n${list}` };
      }

      case 'stats': {
        const s = await this.materiels.stats();
        return {
          reply:
            `📊 **Statistiques matériels :**\n\n` +
            `• Total : ${s.total}\n` +
            `• Étalonnages échus : ${s.echus}\n` +
            `• Échéance < 30 jours : ${s.prochains}\n` +
            `• En prêt : ${s.enPret}\n` +
            `• HS / Perdus : ${s.hs}\n` +
            `• Incomplets : ${s.incomplets}`,
        };
      }

      case 'detail_materiel': {
        try {
          const m: any = await this.materiels.findOne(intent.id);
          return { reply: this.formatMaterielDetail(m) };
        } catch {
          return { reply: `❌ Matériel #${intent.id} introuvable.` };
        }
      }

      case 'detail_maquette': {
        try {
          const m: any = await this.maquettes.findOne(intent.id);
          return { reply: this.formatMaquetteDetail(m) };
        } catch {
          return { reply: `❌ Maquette #${intent.id} introuvable.` };
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
              `Aucun matériel ne correspond à votre recherche.\n\n` +
              `Critères détectés : ${this.formatFilters(intent.filters)}\n\n` +
              `Essayez d'élargir les critères ou tapez "aide".`,
          };
        }
        const list = result.data
          .map(
            (m: any) =>
              `• **${m.reference}** — ${m.libelle}\n  _${m.etat || '–'} | ${m.site || '–'}${m.typeEND ? ` | ${m.typeEND}` : ''} | ID #${m.id}_`,
          )
          .join('\n');
        const more =
          result.total > 10 ? `\n\n_… et ${result.total - 10} autre(s) résultat(s)_` : '';
        return {
          reply: `🔍 **${result.total} matériel${result.total > 1 ? 's' : ''} trouvé${result.total > 1 ? 's' : ''}** _(${this.formatFilters(intent.filters)})_ :\n\n${list}${more}`,
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
              `Aucune maquette ne correspond à votre recherche.\n\n` +
              `Critères : ${this.formatFilters(intent.filters)}`,
          };
        }
        const list = result.data
          .map(
            (m: any) =>
              `• **${m.reference}** — ${m.libelle}\n  _${m.etat || '–'} | ${m.site || '–'} | ID #${m.id}_`,
          )
          .join('\n');
        const more =
          result.total > 10 ? `\n\n_… et ${result.total - 10} autre(s) résultat(s)_` : '';
        return {
          reply: `🔍 **${result.total} maquette${result.total > 1 ? 's' : ''} trouvée${result.total > 1 ? 's' : ''}** _(${this.formatFilters(intent.filters)})_ :\n\n${list}${more}`,
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
    return parts.length > 0 ? parts.join(', ') : 'aucun filtre';
  }

  private formatMaterielDetail(m: any): string {
    const lines = [`📦 **${m.reference}** — ${m.libelle} _(ID #${m.id})_`];
    if (m.etat) lines.push(`• État : ${m.etat}`);
    if (m.typeEND) lines.push(`• Type END : ${m.typeEND}`);
    if (m.typeMateriel) lines.push(`• Type matériel : ${m.typeMateriel}`);
    if (m.site) lines.push(`• Site : ${m.site}`);
    if (m.localisation) lines.push(`• Localisation : ${m.localisation}`);
    if (m.modele) lines.push(`• Modèle : ${m.modele}`);
    if (m.fournisseur) lines.push(`• Fournisseur : ${m.fournisseur}`);
    if (m.numeroSerie) lines.push(`• N° série : ${m.numeroSerie}`);
    if (m.numeroFIEC) lines.push(`• N° FIEC : ${m.numeroFIEC}`);
    if (m.enPret) lines.push(`• ⚠️ En prêt`);
    if (m.dateProchainEtalonnage)
      lines.push(`• Prochain étalonnage : ${new Date(m.dateProchainEtalonnage).toLocaleDateString('fr-FR')}`);
    return lines.join('\n');
  }

  private formatMaquetteDetail(m: any): string {
    const lines = [`🧩 **${m.reference}** — ${m.libelle} _(ID #${m.id})_`];
    if (m.etat) lines.push(`• État : ${m.etat}`);
    if (m.typeMaquette) lines.push(`• Type : ${m.typeMaquette}`);
    if (m.site) lines.push(`• Site : ${m.site}`);
    if (m.composant) lines.push(`• Composant : ${m.composant}`);
    if (m.categorie) lines.push(`• Catégorie : ${m.categorie}`);
    if (m.matiere) lines.push(`• Matière : ${m.matiere}`);
    return lines.join('\n');
  }

  private helpMessage(): string {
    return (
      `👋 **Bonjour ! Je suis l'assistant OGADE.**\n\n` +
      `Je peux vous aider à trouver des matériels et des maquettes. Voici quelques exemples :\n\n` +
      `**Recherches :**\n` +
      `• "matériels UT sur Gravelines"\n` +
      `• "maquettes en stock"\n` +
      `• "matériels HS"\n` +
      `• "matériels en prêt"\n` +
      `• "matériels avec étalonnage échu"\n` +
      `• "matériels FIEC 12345"\n\n` +
      `**Détails :**\n` +
      `• "matériel #42" → fiche détaillée\n` +
      `• "maquette #15"\n\n` +
      `**Statistiques :**\n` +
      `• "combien de matériels"\n` +
      `• "stats matériels"\n\n` +
      `**Sites :**\n` +
      `• "liste des sites"`
    );
  }
}

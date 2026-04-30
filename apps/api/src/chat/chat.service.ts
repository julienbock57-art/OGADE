import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { MaterielsService } from '../materiels/materiels.service';
import { MaquettesService } from '../maquettes/maquettes.service';
import { SitesService } from '../sites/sites.service';

const TOOLS: any[] = [
  {
    functionDeclarations: [
      {
        name: 'search_materiels',
        description:
          'Rechercher des matériels/équipements END dans la base OGADE. Utilise des filtres pour affiner la recherche.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: {
              type: Type.STRING,
              description:
                'Recherche textuelle libre (référence, libellé, modèle, numéro FIEC, fournisseur)',
            },
            etat: {
              type: Type.STRING,
              description:
                'État du matériel. Valeurs possibles : DISPONIBLE, EN_SERVICE, HS, PERDU, REFORME, EN_REPARATION',
            },
            site: {
              type: Type.STRING,
              description: 'Code du site (ex: GRAVELINES, CATTENOM, CNPE_CHOOZ)',
            },
            typeEND: {
              type: Type.STRING,
              description: 'Type END (ex: UT, RT, PT, MT, ET, VT)',
            },
            typeMateriel: {
              type: Type.STRING,
              description: 'Type de matériel',
            },
            groupe: { type: Type.STRING, description: 'Groupe du matériel' },
            completude: {
              type: Type.STRING,
              description: 'Complétude : COMPLET ou INCOMPLET',
            },
            enPret: {
              type: Type.STRING,
              description: "true si en prêt, false sinon",
            },
            etalonnageEchu: {
              type: Type.STRING,
              description: "true pour les matériels dont l'étalonnage est échu",
            },
          },
        },
      },
      {
        name: 'search_maquettes',
        description:
          'Rechercher des maquettes dans la base OGADE.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            search: {
              type: Type.STRING,
              description: 'Recherche textuelle libre (référence, libellé)',
            },
            etat: {
              type: Type.STRING,
              description: 'État de la maquette',
            },
            site: {
              type: Type.STRING,
              description: 'Code du site',
            },
            typeMaquette: {
              type: Type.STRING,
              description: 'Type de maquette',
            },
          },
        },
      },
      {
        name: 'get_materiel_detail',
        description:
          "Obtenir les détails complets d'un matériel par son ID.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER, description: 'ID du matériel' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_maquette_detail',
        description:
          "Obtenir les détails complets d'une maquette par son ID.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.NUMBER, description: 'ID de la maquette' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_sites',
        description: 'Lister tous les sites disponibles dans OGADE.',
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: 'get_stats_materiels',
        description:
          'Obtenir les statistiques globales des matériels (total, échus, en prêt, HS, incomplets).',
        parameters: { type: Type.OBJECT, properties: {} },
      },
    ],
  },
];

const SYSTEM_PROMPT = `Tu es l'assistant OGADE, un chatbot spécialisé dans la gestion du matériel END (Examens Non Destructifs) et des maquettes pour EDF.

Tu aides les utilisateurs à :
- Trouver des matériels ou maquettes en utilisant des filtres
- Consulter les détails d'un équipement
- Obtenir des statistiques sur le parc matériel
- Répondre aux questions sur les sites

Règles :
- Réponds toujours en français
- Sois concis et utile
- Quand tu trouves des résultats, présente-les de manière lisible avec les informations clés (référence, libellé, état, site)
- Si l'utilisateur cherche quelque chose de vague, utilise la recherche textuelle
- N'invente jamais de données, utilise uniquement les outils disponibles
- Si tu ne trouves pas de résultats, dis-le clairement et suggère d'élargir la recherche
- Quand tu mentionnes un matériel ou une maquette, inclus son ID pour que l'utilisateur puisse y accéder`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private ai: GoogleGenAI | null = null;

  constructor(
    private readonly materiels: MaterielsService,
    private readonly maquettes: MaquettesService,
    private readonly sites: SitesService,
  ) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    } else {
      this.logger.warn('GEMINI_API_KEY not set — chat disabled');
    }
  }

  async chat(
    message: string,
    history: { role: string; text: string }[],
  ): Promise<{ reply: string }> {
    if (!this.ai) {
      return {
        reply:
          "Le chatbot n'est pas configuré. Ajoutez la variable GEMINI_API_KEY pour l'activer.",
      };
    }

    const contents = [
      ...history.map((h) => ({
        role: h.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: h.text }],
      })),
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: TOOLS,
        },
      });

      let candidate = response.candidates?.[0];
      if (!candidate) return { reply: 'Pas de réponse du modèle.' };

      let maxIter = 5;
      while (maxIter-- > 0) {
        const functionCalls = candidate.content?.parts?.filter(
          (p) => p.functionCall,
        );
        if (!functionCalls || functionCalls.length === 0) break;

        const functionResponses: Array<{
          role: 'user';
          parts: Array<{
            functionResponse: { name: string; response: any };
          }>;
        }> = [];

        for (const part of functionCalls) {
          const call = part.functionCall!;
          const result = await this.executeTool(
            call.name!,
            (call.args as Record<string, any>) ?? {},
          );
          functionResponses.push({
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: call.name!,
                  response: result,
                },
              },
            ],
          });
        }

        const followUp = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            ...contents,
            candidate.content!,
            ...functionResponses,
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            tools: TOOLS,
          },
        });

        candidate = followUp.candidates?.[0];
        if (!candidate) return { reply: 'Pas de réponse du modèle.' };
      }

      const textParts = candidate.content?.parts?.filter((p) => p.text);
      const reply =
        textParts?.map((p) => p.text).join('\n') ?? 'Pas de réponse.';
      return { reply };
    } catch (err: any) {
      const detail = err?.message || String(err);
      this.logger.error(`Gemini error: ${detail}`, err?.stack);
      return {
        reply: `Erreur : ${detail}`,
      };
    }
  }

  private async executeTool(
    name: string,
    args: Record<string, any>,
  ): Promise<any> {
    switch (name) {
      case 'search_materiels': {
        const result = await this.materiels.findAll({
          page: 1,
          pageSize: 10,
          search: args.search,
          etat: args.etat,
          site: args.site,
          typeEND: args.typeEND,
          typeMateriel: args.typeMateriel,
          groupe: args.groupe,
          completude: args.completude,
          enPret: args.enPret,
          etalonnageEchu: args.etalonnageEchu,
        });
        return {
          total: result.total,
          materiels: result.data.map((m: any) => ({
            id: m.id,
            reference: m.reference,
            libelle: m.libelle,
            etat: m.etat,
            site: m.site,
            typeEND: m.typeEND,
            typeMateriel: m.typeMateriel,
            modele: m.modele,
            fournisseur: m.fournisseur,
            enPret: m.enPret,
          })),
        };
      }
      case 'search_maquettes': {
        const result = await this.maquettes.findAll({
          page: 1,
          pageSize: 10,
          search: args.search,
          etat: args.etat,
          site: args.site,
          typeMaquette: args.typeMaquette,
        });
        return {
          total: result.total,
          maquettes: result.data.map((m: any) => ({
            id: m.id,
            reference: m.reference,
            libelle: m.libelle,
            etat: m.etat,
            site: m.site,
          })),
        };
      }
      case 'get_materiel_detail': {
        try {
          return await this.materiels.findOne(args.id);
        } catch {
          return { error: `Matériel #${args.id} non trouvé` };
        }
      }
      case 'get_maquette_detail': {
        try {
          return await this.maquettes.findOne(args.id);
        } catch {
          return { error: `Maquette #${args.id} non trouvée` };
        }
      }
      case 'list_sites': {
        return await this.sites.findAll();
      }
      case 'get_stats_materiels': {
        return await this.materiels.stats();
      }
      default:
        return { error: `Outil inconnu : ${name}` };
    }
  }
}

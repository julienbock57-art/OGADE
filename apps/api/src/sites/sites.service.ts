import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.site.findMany({
      where: { actif: true },
      orderBy: { label: 'asc' },
    });
  }

  async findOne(id: number) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException(`Site #${id} not found`);
    return site;
  }

  async create(data: {
    code: string;
    label: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    pays?: string;
    telephone?: string;
    email?: string;
  }) {
    const coords = await this.geocode(data.adresse, data.ville, data.codePostal, data.pays);
    return this.prisma.site.create({
      data: { ...data, ...coords },
    });
  }

  async update(id: number, data: Partial<{
    label: string;
    adresse: string;
    codePostal: string;
    ville: string;
    pays: string;
    telephone: string;
    email: string;
    actif: boolean;
  }>) {
    const existing = await this.findOne(id);
    const addressChanged =
      data.adresse !== undefined ||
      data.ville !== undefined ||
      data.codePostal !== undefined ||
      data.pays !== undefined;

    let coords: { latitude?: number; longitude?: number } = {};
    if (addressChanged) {
      const merged = {
        adresse: data.adresse ?? existing.adresse,
        ville: data.ville ?? existing.ville,
        codePostal: data.codePostal ?? existing.codePostal,
        pays: data.pays ?? existing.pays,
      };
      coords = await this.geocode(merged.adresse, merged.ville, merged.codePostal, merged.pays);
    }

    return this.prisma.site.update({
      where: { id },
      data: { ...data, ...coords },
    });
  }

  async getMapData() {
    const sites = await this.prisma.site.findMany({
      where: { actif: true, latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        code: true,
        label: true,
        ville: true,
        latitude: true,
        longitude: true,
      },
    });

    const siteCodes = sites.map((s) => s.code);

    const [materielCounts, maquetteCounts] = await Promise.all([
      this.prisma.materiel.groupBy({
        by: ['site'],
        _count: { id: true },
        where: { site: { in: siteCodes }, deletedAt: null },
      }),
      this.prisma.maquette.groupBy({
        by: ['site'],
        _count: { id: true },
        where: { site: { in: siteCodes }, deletedAt: null },
      }),
    ]);

    const matMap = new Map(materielCounts.map((m) => [m.site, m._count.id]));
    const maqMap = new Map(maquetteCounts.map((m) => [m.site, m._count.id]));

    return sites.map((site) => ({
      ...site,
      materielCount: matMap.get(site.code) ?? 0,
      maquetteCount: maqMap.get(site.code) ?? 0,
    }));
  }

  private async geocode(
    adresse?: string | null,
    ville?: string | null,
    codePostal?: string | null,
    pays?: string | null,
  ): Promise<{ latitude?: number; longitude?: number }> {
    const parts = [adresse, codePostal, ville, pays ?? 'France'].filter(Boolean);
    if (parts.length < 2) return {};

    const query = parts.join(', ');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'OGADE/1.0 (ogade@edf.fr)' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return {};
      const results = await res.json() as Array<{ lat: string; lon: string }>;
      if (results.length === 0) return {};
      return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
      };
    } catch (err) {
      this.logger.warn(`Geocoding failed for "${query}": ${err}`);
      return {};
    }
  }
}

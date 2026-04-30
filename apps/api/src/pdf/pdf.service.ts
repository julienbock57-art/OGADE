import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { PrismaService } from '../prisma/prisma.service';

// EDF brand palette
const COLORS = {
  brand: '#183F80',       // EDF blue
  brandLight: '#7DA8C9',
  ink: '#2A2A38',
  ink2: '#4F4F5A',
  ink3: '#7B7B85',
  ink4: '#A8A8B0',
  line: '#DCDBD7',
  lineSoft: '#EFEEEC',
  bg: '#FBFBF9',
  panel: '#FFFFFF',
  emerald: '#2FA266',
  emeraldSoft: '#E5F4EC',
  amber: '#D89A2E',
  amberSoft: '#FBF1DD',
  rose: '#D83C44',
  roseSoft: '#FBE4E5',
  sky: '#4A8DC9',
  skySoft: '#E2EEF8',
  violet: '#7656D3',
  violetSoft: '#EBE3FB',
};

const ETAT_META: Record<string, { label: string; color: string; bg: string }> = {
  CORRECT:      { label: 'Correct',      color: COLORS.emerald, bg: COLORS.emeraldSoft },
  LEGER_DEFAUT: { label: 'Léger défaut', color: COLORS.amber,   bg: COLORS.amberSoft },
  HS:           { label: 'Hors service', color: COLORS.rose,    bg: COLORS.roseSoft },
  PERDU:        { label: 'Perdu',        color: COLORS.ink3,    bg: COLORS.lineSoft },
};

const COMPLETUDE_META: Record<string, { label: string; color: string; bg: string }> = {
  COMPLET:   { label: 'Complet',   color: COLORS.emerald, bg: COLORS.emeraldSoft },
  INCOMPLET: { label: 'Incomplet', color: COLORS.amber,   bg: COLORS.amberSoft },
};

const PAGE_MARGIN = 48;
const PAGE_WIDTH = 595.28;   // A4 portrait
const PAGE_HEIGHT = 841.89;
const CONTENT_W = PAGE_WIDTH - PAGE_MARGIN * 2;

const fmtDate = (d?: Date | string | null): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};
const fmtDateTime = (d?: Date | string | null): string => {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
const fmtBool = (b?: boolean | null): string =>
  b === true ? 'Oui' : b === false ? 'Non' : '—';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async materielPdf(id: number): Promise<Buffer> {
    const materiel = await this.prisma.materiel.findFirst({
      where: { id, deletedAt: null },
      include: {
        responsable: { select: { id: true, nom: true, prenom: true, email: true } },
        createdBy: { select: { id: true, nom: true, prenom: true } },
        updatedBy: { select: { id: true, nom: true, prenom: true } },
      },
    });
    if (!materiel) throw new NotFoundException(`Matériel #${id} introuvable`);

    // Resolve referentiel labels for type fields
    const refTypes = ['TYPE_END', 'TYPE_MATERIEL', 'TYPE_TRADUCTEUR', 'GROUPE', 'MOTIF_PRET'];
    const refs = await this.prisma.referentiel.findMany({
      where: { type: { in: refTypes }, actif: true },
    });
    const refLabel = (type: string, code?: string | null) =>
      code ? refs.find((r) => r.type === type && r.code === code)?.label ?? code : '—';

    const sites = materiel.site
      ? await this.prisma.site.findUnique({ where: { code: materiel.site } })
      : null;
    const entreprise = materiel.entreprise
      ? await this.prisma.entreprise.findUnique({ where: { code: materiel.entreprise } })
      : null;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: {
        Title: `Fiche matériel — ${materiel.reference}`,
        Author: 'OGADE',
        Subject: `Fiche matériel ${materiel.reference} (${materiel.libelle})`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // ── Header band ──
    this.drawHeader(doc, materiel.reference, materiel.libelle, refLabel('TYPE_MATERIEL', materiel.typeMateriel));

    // ── Pills row ──
    let y = 132;
    y = this.drawStatusRow(doc, y, materiel);

    // ── Sections ──
    y = this.drawSection(doc, y, 'Informations générales', [
      ['Référence', materiel.reference, true],
      ['N° de FIEC', materiel.numeroFIEC ?? '—'],
      ['Pôle propriétaire', materiel.proprietaire ?? '—'],
      ['Type de matériel', refLabel('TYPE_MATERIEL', materiel.typeMateriel)],
      ['Fournisseur', materiel.fournisseur ?? '—'],
      ['Modèle', materiel.modele ?? '—'],
      ["Type d'END", refLabel('TYPE_END', materiel.typeEND)],
      ['Type traducteur', refLabel('TYPE_TRADUCTEUR', materiel.typeTraducteur)],
      ['Référence lot/chaîne', materiel.lotChaine ?? '—'],
      ['Responsable', materiel.responsable
        ? `${materiel.responsable.prenom} ${materiel.responsable.nom}`
        : '—'],
      ['Vérification périodique', fmtBool(materiel.soumisVerification)],
      ['Information vérifiée', fmtBool(materiel.informationVerifiee)],
    ]);

    y = this.drawSection(doc, y, 'Étalonnage & validité', [
      ['Dernier étalonnage', fmtDate(materiel.dateEtalonnage)],
      ['Validité',
        materiel.validiteEtalonnage ? `${materiel.validiteEtalonnage} mois` : '—'],
      ["Date d'échéance", fmtDate(materiel.dateProchainEtalonnage)],
    ]);
    y = this.drawValidityBar(doc, y, materiel) ?? y;

    y = this.drawSection(doc, y, 'Localisation', [
      ['Site', sites ? `${sites.label}${sites.ville ? ` — ${sites.ville}` : ''}` : refLabel('TYPE_MATERIEL', materiel.site)],
      ['Localisation', materiel.localisation ?? '—'],
      ['Groupe', refLabel('GROUPE', materiel.groupe)],
      ['Entreprise', entreprise ? entreprise.label : (materiel.entreprise ?? '—')],
      ['En prêt', fmtBool(materiel.enPret)],
      ['Motif du prêt', materiel.motifPret ? refLabel('MOTIF_PRET', materiel.motifPret) : '—'],
      ['Date retour prêt', fmtDate(materiel.dateRetourPret)],
      ['En transit', materiel.enTransit ?? 'NON'],
    ]);
    if (materiel.complementsLocalisation) {
      y = this.drawTextBlock(doc, y, 'Compléments', materiel.complementsLocalisation);
    }

    y = this.drawSection(doc, y, 'État · Complétude', [
      ['État', ETAT_META[materiel.etat]?.label ?? materiel.etat],
      ['Complétude',
        COMPLETUDE_META[materiel.completude ?? '']?.label ?? materiel.completude ?? '—'],
      ['Produits chimiques', fmtBool(materiel.produitsChimiques)],
    ]);
    if (materiel.commentaireEtat) {
      y = this.drawTextBlock(doc, y, "Commentaire d'état", materiel.commentaireEtat);
    }
    if (materiel.commentairesCompletude) {
      y = this.drawTextBlock(doc, y, 'Commentaire complétude', materiel.commentairesCompletude);
    }
    if (materiel.commentaires) {
      y = this.drawTextBlock(doc, y, 'Commentaires généraux', materiel.commentaires);
    }

    y = this.drawSection(doc, y, 'Métadonnées', [
      ['Créé le', fmtDateTime(materiel.createdAt)],
      ['Créé par', materiel.createdBy
        ? `${materiel.createdBy.prenom} ${materiel.createdBy.nom}`
        : '—'],
      ['Modifié le', fmtDateTime(materiel.updatedAt)],
      ['Modifié par', materiel.updatedBy
        ? `${materiel.updatedBy.prenom} ${materiel.updatedBy.nom}`
        : '—'],
    ]);

    // ── Footer on every page ──
    this.addFooters(doc, materiel.reference);

    doc.end();
    return done;
  }

  // ── Drawing helpers ──

  private drawHeader(
    doc: PDFKit.PDFDocument,
    reference: string,
    libelle: string,
    typeLabel: string,
  ): void {
    // Background band
    doc.save();
    doc.rect(0, 0, PAGE_WIDTH, 110).fill(COLORS.brand);
    doc.restore();

    // OGADE wordmark
    doc.save();
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#FFFFFF')
      .text('OGADE', PAGE_MARGIN, 32, { lineBreak: false });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.brandLight)
      .text('Gestion du matériel END', PAGE_MARGIN, 56, { lineBreak: false });
    doc.restore();

    // Right-side title block
    doc.save();
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.brandLight)
      .text('FICHE MATÉRIEL', PAGE_MARGIN, 32, {
        width: CONTENT_W,
        align: 'right',
        lineBreak: false,
      });
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#FFFFFF')
      .text(reference, PAGE_MARGIN, 48, {
        width: CONTENT_W,
        align: 'right',
        lineBreak: false,
      });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#FFFFFF')
      .text(libelle, PAGE_MARGIN, 70, {
        width: CONTENT_W,
        align: 'right',
        lineBreak: false,
      });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.brandLight)
      .text(typeLabel, PAGE_MARGIN, 86, {
        width: CONTENT_W,
        align: 'right',
        lineBreak: false,
      });
    doc.restore();
  }

  private drawStatusRow(doc: PDFKit.PDFDocument, y: number, m: any): number {
    const pills: { label: string; color: string; bg: string }[] = [];
    const etat = ETAT_META[m.etat] ?? { label: m.etat, color: COLORS.ink2, bg: COLORS.lineSoft };
    pills.push(etat);
    if (m.completude) {
      const comp = COMPLETUDE_META[m.completude];
      if (comp) pills.push(comp);
    }
    if (m.enPret) {
      pills.push({ label: 'En prêt', color: COLORS.sky, bg: COLORS.skySoft });
    }
    if (m.informationVerifiee) {
      pills.push({ label: 'Vérifié', color: COLORS.violet, bg: COLORS.violetSoft });
    }

    let x = PAGE_MARGIN;
    doc.save();
    doc.font('Helvetica-Bold').fontSize(9);
    pills.forEach((p) => {
      const w = doc.widthOfString(p.label) + 18;
      const h = 18;
      doc.roundedRect(x, y, w, h, 9).fill(p.bg);
      doc.fillColor(p.color).text(p.label, x + 9, y + 5, { lineBreak: false, width: w - 18 });
      x += w + 6;
    });
    doc.restore();
    return y + 28;
  }

  private drawSection(
    doc: PDFKit.PDFDocument,
    y: number,
    title: string,
    rows: Array<[string, string, boolean?]>,
  ): number {
    const newY = this.ensureSpace(doc, y, 60 + rows.length * 12);

    // Section title bar
    doc.save();
    doc.rect(PAGE_MARGIN, newY, CONTENT_W, 22).fill(COLORS.lineSoft);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.brand)
      .text(title.toUpperCase(), PAGE_MARGIN + 12, newY + 6, {
        characterSpacing: 1,
        lineBreak: false,
      });
    doc.restore();

    let cursor = newY + 30;
    const colW = (CONTENT_W - 20) / 2;
    const labelW = 130;

    rows.forEach((r, i) => {
      const col = i % 2;
      const x = PAGE_MARGIN + col * (colW + 20);
      const rowY = cursor + Math.floor(i / 2) * 22;

      // Label
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLORS.ink3)
        .text(r[0].toUpperCase(), x, rowY, {
          width: labelW,
          characterSpacing: 0.5,
          lineBreak: false,
        });
      // Value
      doc
        .font(r[2] ? 'Courier-Bold' : 'Helvetica-Bold')
        .fontSize(10.5)
        .fillColor(COLORS.ink)
        .text(r[1] ?? '—', x, rowY + 10, {
          width: colW - 4,
          ellipsis: true,
          lineBreak: false,
        });
    });

    const totalRows = Math.ceil(rows.length / 2);
    return cursor + totalRows * 22 + 8;
  }

  private drawTextBlock(
    doc: PDFKit.PDFDocument,
    y: number,
    label: string,
    text: string,
  ): number {
    const newY = this.ensureSpace(doc, y, 60);

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COLORS.ink3)
      .text(label.toUpperCase(), PAGE_MARGIN, newY, {
        characterSpacing: 0.5,
        lineBreak: false,
      });

    const textY = newY + 12;
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.ink2)
      .text(text, PAGE_MARGIN, textY, { width: CONTENT_W, lineGap: 2 });

    return doc.y + 8;
  }

  private drawValidityBar(
    doc: PDFKit.PDFDocument,
    y: number,
    m: any,
  ): number | null {
    if (!m.soumisVerification || !m.dateProchainEtalonnage) return y;

    const newY = this.ensureSpace(doc, y, 30);
    const echeance = new Date(m.dateProchainEtalonnage);
    const jours = Math.round((echeance.getTime() - Date.now()) / 86400000);
    const totalDays = (m.validiteEtalonnage ?? 12) * 30;
    const pct = Math.max(0, Math.min(1, 1 - jours / totalDays));

    let fill = COLORS.emerald;
    let label = `dans ${jours} j`;
    if (jours < 0) {
      fill = COLORS.rose;
      label = `${-jours} j de retard`;
    } else if (jours <= 30) {
      fill = COLORS.amber;
    }

    // Track
    doc.save();
    doc
      .roundedRect(PAGE_MARGIN, newY, CONTENT_W, 6, 3)
      .fill(COLORS.lineSoft);
    doc
      .roundedRect(PAGE_MARGIN, newY, CONTENT_W * pct, 6, 3)
      .fill(fill);
    doc.restore();

    // Labels
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.ink3)
      .text(echeance.toLocaleDateString('fr-FR'), PAGE_MARGIN, newY + 10, {
        lineBreak: false,
        width: CONTENT_W / 2,
      });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(fill)
      .text(label, PAGE_MARGIN, newY + 10, {
        lineBreak: false,
        width: CONTENT_W,
        align: 'right',
      });

    return newY + 28;
  }

  private ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number): number {
    if (y + needed > PAGE_HEIGHT - PAGE_MARGIN - 30) {
      doc.addPage();
      return PAGE_MARGIN;
    }
    return y;
  }

  private addFooters(doc: PDFKit.PDFDocument, reference: string): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const pageNum = i + 1;
      const total = range.count;
      const footY = PAGE_HEIGHT - 30;

      doc.save();
      doc
        .moveTo(PAGE_MARGIN, footY - 6)
        .lineTo(PAGE_WIDTH - PAGE_MARGIN, footY - 6)
        .lineWidth(0.5)
        .strokeColor(COLORS.line)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.ink3)
        .text(
          `OGADE · Fiche matériel ${reference}`,
          PAGE_MARGIN,
          footY,
          { lineBreak: false, width: CONTENT_W / 2 },
        );
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.ink3)
        .text(
          `Généré le ${new Date().toLocaleString('fr-FR')}`,
          PAGE_MARGIN,
          footY,
          { lineBreak: false, width: CONTENT_W, align: 'center' },
        );
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.ink3)
        .text(`${pageNum} / ${total}`, PAGE_MARGIN, footY, {
          lineBreak: false,
          width: CONTENT_W,
          align: 'right',
        });
      doc.restore();
    }
  }
}

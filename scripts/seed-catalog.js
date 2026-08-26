const { PrismaClient, CollectionType, EditionType, PublicationStatus } = require('@prisma/client');

const prisma = new PrismaClient();

const records = [
  // 2026 — Panini
  { title: 'One Piece', author: 'Eiichiro Oda', edition: 'One Piece 3 em 1', type: EditionType.THREE_IN_ONE, publisher: 'Panini', latest: 8, year: 2026, url: 'https://panini.com.br/planet-manga/one-piece', evidence: 'One Piece 3 Em 1 Vol. 8 em pré-venda no catálogo oficial.' },
  { title: 'Chainsaw Man', author: 'Tatsuki Fujimoto', edition: 'Chainsaw Man', type: EditionType.STANDARD, publisher: 'Panini', latest: 23, year: 2026, url: 'https://panini.com.br/planet-manga/chainsaw-man', evidence: 'Chainsaw Man Vol. 23 listado no catálogo oficial.' },
  { title: 'Atelier of Witch Hat', author: 'Kamome Shirahama', edition: 'Atelier of Witch Hat', type: EditionType.STANDARD, publisher: 'Panini', latest: 11, year: 2026, url: 'https://panini.com.br/planet-manga', evidence: 'Volume 11 em pré-venda no catálogo Planet Mangá.' },
  { title: 'Wistoria: Wand & Sword', author: 'Fujino Omori e Toshi Aoi', edition: 'Wistoria: Wand & Sword', type: EditionType.STANDARD, publisher: 'Panini', latest: 11, year: 2026, url: 'https://panini.com.br/wistoria-wand-sword-vol-11', evidence: 'Volume 11 em pré-venda.' },
  { title: 'Shangri-La Frontier', author: 'Katarina e Ryosuke Fuji', edition: 'Shangri-La Frontier', type: EditionType.STANDARD, publisher: 'Panini', latest: 26, year: 2026, url: 'https://panini.com.br/planet-manga', evidence: 'Volume 26 em pré-venda no catálogo Planet Mangá.' },
  { title: 'Spy x Family', author: 'Tatsuya Endo', edition: 'Spy x Family', type: EditionType.STANDARD, publisher: 'Panini', latest: 17, year: 2026, url: 'https://panini.com.br/planet-manga', evidence: 'Volume 17 em pré-venda no catálogo Planet Mangá.' },
  { title: 'Vinland Saga', author: 'Makoto Yukimura', edition: 'Vinland Saga Deluxe', type: EditionType.DELUXE, publisher: 'Panini', latest: 10, year: 2026, url: 'https://panini.com.br/planet-manga', evidence: 'Volume 10 da edição Deluxe em pré-venda.' },
  { title: 'Vagabond', author: 'Takehiko Inoue', edition: 'Vagabond', type: EditionType.STANDARD, publisher: 'Panini', latest: 19, year: 2026, url: 'https://panini.com.br/planet-manga', evidence: 'Volume 19 em pré-venda.' },
  // 2026 — NewPOP
  { title: 'Record of Ragnarok', edition: 'Record of Ragnarok', type: EditionType.STANDARD, publisher: 'NewPOP', latest: null, year: 2026, url: 'https://www.newpop.com.br/2026-lancamentos-de-agosto-mes-8/', evidence: 'Continuação confirmada no checklist oficial de agosto de 2026.' },
  { title: "King's Maker", edition: "King's Maker", type: EditionType.STANDARD, publisher: 'NewPOP', latest: null, year: 2026, url: 'https://www.newpop.com.br/2026-lancamentos-de-agosto-mes-8/', evidence: 'Continuação confirmada no checklist oficial de agosto de 2026.' },
  { title: 'Ashita no Joe', edition: 'Ashita no Joe', type: EditionType.STANDARD, publisher: 'NewPOP', latest: null, year: 2026, url: 'https://www.newpop.com.br/2026-lancamentos-de-agosto-mes-8/', evidence: 'Continuação confirmada no checklist oficial de agosto de 2026.' },
  { title: 'O Único Destino dos Vilões é a Morte', edition: 'O Único Destino dos Vilões é a Morte', type: EditionType.STANDARD, publisher: 'NewPOP', latest: null, year: 2026, url: 'https://www.newpop.com.br/2026-lancamentos-de-agosto-mes-8/', evidence: 'Continuação confirmada no checklist oficial de agosto de 2026.' },
  { title: 'Uma Vida Imortal', author: 'Yoshitoki Oima', edition: 'Uma Vida Imortal', type: EditionType.STANDARD, publisher: 'NewPOP', latest: null, year: 2026, url: 'https://www.newpop.com.br/2026-lancamentos-de-agosto-mes-8/', evidence: 'Continuação confirmada no checklist oficial de agosto de 2026.' },
  // 2025 — NewPOP
  { title: 'Navillera', edition: 'Navillera', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 3, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-fevereiro-mes-2/', evidence: 'Navillera Volume 03 no checklist oficial de fevereiro de 2025.' },
  { title: 'Perfect World', edition: 'Perfect World', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 10, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-abril-mes-4/', evidence: 'Perfect World Volume 10 no checklist oficial de abril de 2025.' },
  { title: 'As Flores do Mal', edition: 'As Flores do Mal', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 10, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-abril-mes-4/', evidence: 'As Flores do Mal Volume 10 no checklist oficial de abril de 2025.' },
  { title: 'Ashita no Joe', edition: 'Ashita no Joe', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 5, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-abril-mes-4/', evidence: 'Ashita no Joe: Em Busca do Amanhã Volume 05 no checklist oficial de abril de 2025.' },
  { title: 'The Dangerous Convenience Store', edition: 'The Dangerous Convenience Store', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 3, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-abril-mes-4/', evidence: 'Volume 3 no checklist oficial de abril de 2025.' },
  { title: 'A Noite Além da Janela Triangular', edition: 'A Noite Além da Janela Triangular', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 9, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-abril-mes-4/', evidence: 'Volume 09 no checklist oficial de abril de 2025.' },
  { title: 'The Beginning After the End', edition: 'The Beginning After the End', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 4, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-abril-mes-4/', evidence: 'Volume 04 no checklist oficial de abril de 2025.' },
  { title: 'Uma Vida Imortal', author: 'Yoshitoki Oima', edition: 'Uma Vida Imortal', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 12, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-fevereiro-mes-2/', evidence: 'Uma Vida Imortal Volume 12 no checklist oficial de fevereiro de 2025.' },
  { title: 'Cavaleiros do Zodíaco: Episódio G', edition: 'Cavaleiros do Zodíaco: Episódio G', type: EditionType.STANDARD, publisher: 'NewPOP', latest: 4, year: 2025, url: 'https://www.newpop.com.br/2025-lancamentos-de-fevereiro-mes-2/', evidence: 'Volume 04 no checklist oficial de fevereiro de 2025.' },
];

function normalizedTitle(title) {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  for (const item of records) {
    const work = await prisma.catalogWork.upsert({
      where: { normalizedTitle_workType: { normalizedTitle: normalizedTitle(item.title), workType: CollectionType.MANGA } },
      update: { author: item.author ?? undefined },
      create: { title: item.title, normalizedTitle: normalizedTitle(item.title), author: item.author, workType: CollectionType.MANGA },
    });

    const editionId = `${normalizedTitle(item.title)}-${normalizedTitle(item.edition)}-${item.publisher.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const edition = await prisma.catalogEdition.upsert({
      where: { id: editionId },
      update: {
        latestVolumeObserved: item.latest,
        publicationStatus: PublicationStatus.ONGOING,
        sourceUrl: item.url,
        lastVerifiedAt: new Date(),
      },
      create: {
        id: editionId,
        workId: work.id,
        name: item.edition,
        editionType: item.type,
        publisher: item.publisher,
        country: 'BR',
        publicationStatus: PublicationStatus.ONGOING,
        latestVolumeObserved: item.latest,
        sourceUrl: item.url,
        lastVerifiedAt: new Date(),
      },
    });

    if (item.latest) {
      const volumeId = `${edition.id}-vol-${item.latest}`;
      await prisma.catalogVolume.upsert({
        where: { id: volumeId },
        update: { sourceUrl: item.url, lastVerifiedAt: new Date() },
        create: { id: volumeId, editionId: edition.id, number: item.latest, sourceUrl: item.url, lastVerifiedAt: new Date() },
      });
    }

    const sourceId = `${edition.id}-${item.year}`;
    await prisma.catalogSource.upsert({
      where: { id: sourceId },
      update: { evidence: item.evidence, observedAt: new Date() },
      create: { id: sourceId, editionId: edition.id, sourceName: item.publisher, sourceUrl: item.url, observedYear: item.year, evidence: item.evidence },
    });
  }

  console.log(`Catálogo processado: ${records.length} evidências, com edições separadas por formato.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});

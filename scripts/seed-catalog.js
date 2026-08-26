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
  // Naoki Urasawa — Blog BBM, edições brasileiras separadas
  { title: 'Monster', author: 'Naoki Urasawa', edition: 'Monster — Conrad original', type: EditionType.STANDARD, publisher: 'Conrad', latest: 10, total: 18, status: PublicationStatus.HIATUS, year: 2008, url: 'https://blogbbm.com/manga/monster/', evidence: 'Primeira publicação brasileira: 10 volumes lançados de 18 planejados; publicação cancelada.' },
  { title: 'Monster', author: 'Naoki Urasawa', edition: 'Monster — Panini edição normal', type: EditionType.STANDARD, publisher: 'Panini', latest: 18, total: 18, status: PublicationStatus.COMPLETE, year: 2015, url: 'https://blogbbm.com/manga/monster/', evidence: 'Segunda publicação brasileira completa com 18 volumes.' },
  { title: 'Monster', author: 'Naoki Urasawa', edition: 'Monster — Panini kanzenban', type: EditionType.KANZENBAN, publisher: 'Panini', latest: 9, total: 9, status: PublicationStatus.COMPLETE, year: 2021, url: 'https://blogbbm.com/manga/monster/', evidence: 'Terceira publicação brasileira: 9 tomos kanzenban, reunindo dois volumes originais por tomo.' },
  { title: 'Pluto', author: 'Naoki Urasawa', edition: 'Pluto — Panini edição anterior', type: EditionType.STANDARD, publisher: 'Panini', latest: 8, total: 8, status: PublicationStatus.COMPLETE, year: 2019, url: 'https://blogbbm.com/manga/pluto/', evidence: 'Primeira publicação brasileira completa com 8 volumes.' },
  { title: 'Pluto', author: 'Naoki Urasawa', edition: 'Pluto — Panini edição de luxo', type: EditionType.DELUXE, publisher: 'Panini', latest: 8, total: 8, status: PublicationStatus.COMPLETE, year: 2025, url: 'https://blogbbm.com/manga/pluto/', evidence: 'Segunda publicação brasileira completa com 8 volumes, publicada de 2024 a 2025.' },
  { title: 'Mujirushi: Le Signe Des Rêves', author: 'Naoki Urasawa', edition: 'Mujirushi — Panini deluxe slipcase', type: EditionType.DELUXE, publisher: 'Panini', latest: null, total: 2, status: PublicationStatus.ONGOING, year: 2026, url: 'https://blogbbm.com/manga/mujirushi/', evidence: 'Edição brasileira prevista para outubro de 2026 em slipcase com dois volumes internos.' },
  { title: 'Billy Bat', author: 'Naoki Urasawa e Takashi Nagasaki', edition: 'Billy Bat — Panini', type: EditionType.STANDARD, publisher: 'Panini', latest: 9, total: 20, status: PublicationStatus.ONGOING, year: 2026, url: 'https://blogbbm.com/manga/billy-bat/', evidence: '9 volumes brasileiros publicados; volume 10 indicado como final e previsto para setembro de 2026.' },
  { title: 'Asadora!', author: 'Naoki Urasawa', edition: 'Asadora! — Panini', type: EditionType.STANDARD, publisher: 'Panini', latest: 6, total: 9, status: PublicationStatus.ONGOING, year: 2026, url: 'https://blogbbm.com/manga/asadora/', evidence: '6 volumes brasileiros publicados; volumes 7, 8 e 9 previstos para 2026 e 2027.' },
  { title: '20th Century Boys', author: 'Naoki Urasawa', edition: '20th Century Boys — Panini edição original', type: EditionType.STANDARD, publisher: 'Panini', latest: 22, total: 22, status: PublicationStatus.COMPLETE, year: 2016, url: 'https://blogbbm.com/manga/20_century_boys/', evidence: 'Primeira publicação brasileira completa com 22 volumes.' },
  { title: '20th Century Boys', author: 'Naoki Urasawa', edition: '20th Century Boys — Panini Edição Definitiva', type: EditionType.DELUXE, publisher: 'Panini', latest: 9, total: 11, status: PublicationStatus.ONGOING, year: 2026, url: 'https://blogbbm.com/manga/20_century_boys/', evidence: 'Nova edição definitiva: 9 volumes publicados; volumes 10 e 11 indicados para 2026.' },
  { title: '21st Century Boys', author: 'Naoki Urasawa', edition: '21st Century Boys — Panini', type: EditionType.STANDARD, publisher: 'Panini', latest: 2, total: 2, status: PublicationStatus.COMPLETE, year: 2016, url: 'https://blogbbm.com/manga/21_century_boys/', evidence: 'Continuação direta de 20th Century Boys, com dois volumes brasileiros publicados.' },
  { title: 'Combat / Pineapple Army', author: 'Kazuya Kudo e Naoki Urasawa', edition: 'Combat — PNC', type: EditionType.STANDARD, publisher: 'PNC', latest: 1, total: 8, status: PublicationStatus.HIATUS, year: 2003, url: 'https://blogbbm.com/manga/combat/', evidence: 'Autoria compartilhada; apenas um dos oito volumes japoneses foi publicado no Brasil e a edição foi cancelada.' },
  // 2026 — HQs Panini e Mythos
  { title: 'O Espetacular Homem-Aranha', author: 'Stan Lee e Steve Ditko', edition: 'Edição Definitiva', type: EditionType.DELUXE, workType: CollectionType.HQ, publisher: 'Panini', latest: 7, year: 2026, url: 'https://panini.com.br/home-marvel', evidence: 'Volumes 1 e 7 da Edição Definitiva listados em pré-venda no catálogo Marvel.' },
  { title: 'Os Fabulosos X-Men', edition: 'Edição Definitiva', type: EditionType.DELUXE, workType: CollectionType.HQ, publisher: 'Panini', latest: 7, year: 2026, url: 'https://panini.com.br/os-fabulosos-x-men-edicao-definitiva-vol-7', evidence: 'Volume 7 da Edição Definitiva listado em pré-venda.' },
  { title: 'Quarteto Fantástico', author: 'Stan Lee e Jack Kirby', edition: 'Edição Definitiva', type: EditionType.DELUXE, workType: CollectionType.HQ, publisher: 'Panini', latest: 4, year: 2026, url: 'https://panini.com.br/quarteto-fantastico-edicao-definitiva-vol-4', evidence: 'Volume 4 da Edição Definitiva em pré-venda.' },
  { title: 'A Saga do Batman', edition: 'A Saga do Batman', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Panini', latest: 11, year: 2026, url: 'https://panini.com.br/a-saga-do-batman-vol-11-67', evidence: 'Volume 11/67 em pré-venda e assinatura disponível.' },
  { title: 'A Saga do Flash', edition: 'A Saga do Flash', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Panini', latest: 22, year: 2026, url: 'https://panini.com.br/a-saga-do-flash-22', evidence: 'Volume 22 em pré-venda.' },
  { title: 'A Saga do Superman', edition: 'A Saga do Superman', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Panini', latest: 3, year: 2026, url: 'https://panini.com.br/a-saga-do-superman-vol-3-46', evidence: 'Volume 3/46 em pré-venda.' },
  { title: 'Grandes Heróis DC: Os Novos 52', edition: 'Mulher-Maravilha: Ossos', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Panini', latest: 52, year: 2026, url: 'https://panini.com.br/grandes-herois-dc-os-novos-52-vol-52-mulher-maravilha-ossos', evidence: 'Volume 52 em pré-venda.' },
  { title: 'Crise nas Infinitas Terras', edition: 'Grandes Eventos DC', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Panini', latest: 6, year: 2026, url: 'https://panini.com.br/crise-nas-infinitas-terras-vol-06', evidence: 'Volume 6 em pré-venda e assinatura disponível.' },
  { title: 'Mega-City Sem Lei', edition: 'Mega-City Sem Lei', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Mythos', latest: 2, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-mega-city-sem-lei-vol-02-setembrooutubro-2026', evidence: 'Volume 2 em pré-venda para setembro/outubro de 2026.' },
  { title: 'A Espada Selvagem de Conan', edition: 'Omnibus', type: EditionType.OMNIBUS, workType: CollectionType.HQ, publisher: 'Mythos', latest: 1, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-a-espada-selvagem-de-conan-omnibus-vol-01-setembrooutubro-2026', evidence: 'Omnibus volume 1 em pré-venda.' },
  { title: 'Júlia', edition: 'Júlia', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Mythos', latest: 58, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-julia-vol-58-agosto2026', evidence: 'Volume 58 em pré-venda.' },
  { title: 'Tex', edition: 'Tex Graphic Novel', type: EditionType.SPECIAL, workType: CollectionType.HQ, publisher: 'Mythos', latest: 19, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-tex-graphic-novel-no-19-agosto2026', evidence: 'Graphic Novel número 19 listada com código de barras oficial.' },
  { title: 'Dragonero', edition: 'Dragonero', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Mythos', latest: 35, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-dragonero-vol-35-agosto2026', evidence: 'Volume 35 em lançamento.' },
  { title: 'Ken Parker', edition: 'Ken Parker', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Mythos', latest: 38, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-ken-parker-vol-38-agosto2026', evidence: 'Volume 38 em pré-venda.' },
  { title: 'Dreadstar', edition: 'Omnibus', type: EditionType.OMNIBUS, workType: CollectionType.HQ, publisher: 'Mythos', latest: 1, year: 2026, url: 'https://www.lojamythos.com.br/hqs-livro/pre-venda-dreadstar-omnibus-vol-01-julho2026', evidence: 'Omnibus volume 1 em pré-venda.' },
  // 2025 — HQs com ficha ou assinatura oficial
  { title: 'O Espetacular Homem-Aranha', author: 'Stan Lee e Steve Ditko', edition: 'Edição Definitiva', type: EditionType.DELUXE, workType: CollectionType.HQ, publisher: 'Panini', latest: 3, year: 2025, url: 'https://panini.com.br/o-espetacular-homem-aranha-edicao-definitiva-vol-3-alizt003r2', evidence: 'Volume 3, ficha oficial de maio de 2025, capa dura.' },
  { title: 'Quarteto Fantástico', author: 'Stan Lee e Jack Kirby', edition: 'Edição Definitiva', type: EditionType.DELUXE, workType: CollectionType.HQ, publisher: 'Panini', latest: 2, year: 2025, url: 'https://panini.com.br/quarteto-fantastico-edicao-definitiva-vol-2', evidence: 'Volume 2, ficha oficial de novembro de 2025, capa dura.' },
  { title: 'Tex', edition: 'Assinatura semestral', type: EditionType.STANDARD, workType: CollectionType.HQ, publisher: 'Mythos', latest: null, year: 2025, url: 'https://www.lojamythos.com.br/hqs-livro/assinatura-tex-6-meses-julhodezembro-2025', evidence: 'Assinatura oficial de julho/dezembro de 2025.' },
];

function normalizedTitle(title) {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  for (const item of records) {
    const work = await prisma.catalogWork.upsert({
      where: { normalizedTitle_workType: { normalizedTitle: normalizedTitle(item.title), workType: item.workType ?? CollectionType.MANGA } },
      update: { author: item.author ?? undefined },
      create: { title: item.title, normalizedTitle: normalizedTitle(item.title), author: item.author, workType: item.workType ?? CollectionType.MANGA },
    });

    const editionId = `${normalizedTitle(item.title)}-${normalizedTitle(item.edition)}-${item.publisher.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const edition = await prisma.catalogEdition.upsert({
      where: { id: editionId },
      update: {
        latestVolumeObserved: item.latest,
        totalVolumes: item.total ?? undefined,
        publicationStatus: item.status ?? PublicationStatus.ONGOING,
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
        latestVolumeObserved: item.latest,
        totalVolumes: item.total,
        publicationStatus: item.status ?? PublicationStatus.ONGOING,
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
      create: { id: sourceId, editionId: edition.id, sourceName: item.url.includes('blogbbm.com') ? 'Blog BBM' : item.publisher, sourceUrl: item.url, observedYear: item.year, evidence: item.evidence },
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

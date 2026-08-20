import { createClient } from "@supabase/supabase-js";

// Seed de demonstração para o Acervo. Usa a service role key para
// contornar a RLS (que exige can_write_crm() — admin ou vendedor).
// Rodar com: bun run scripts/seed-acervo.ts
// (ou: SUPABASE_SERVICE_ROLE_KEY=xxx bun run scripts/seed-acervo.ts,
// pegando a chave em Supabase Dashboard → Settings → API → service_role)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Fotos reais de vestidos de festa — Unsplash CDN (uso livre) ────────────
const FOTOS_VESTIDOS = [
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519657337289-077653f724ed?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499842048682-a54dc3cfe0f2?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1612418635729-07e1d1a42803?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1537832816519-689ad163238b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1613237788831-afa8f8ece6a8?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1478186735259-fcf97bfe5b15?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550639524-a6e6e4df9631?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1623609163841-5e69d8c62cc7?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601924921557-45b6ae76dfe0?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606522754091-a3bbf9ad4cb3?w=600&q=80&auto=format&fit=crop",
];

// ── Dados das peças ────────────────────────────────────────────────────────
// Schema real da tabela `vestidos` (verificado via information_schema antes
// de escrever este script): nome, cor, tamanho, comprimento, preco_aluguel,
// preco_venda, status, is_consignado, imagem_url, sku, categoria_peca,
// descricao, qtd_total_locacoes. Não existem colunas `status_peca`,
// `valor_locacao_padrao` nem `foto_url` — usa-se `status`, `preco_aluguel`
// e `imagem_url`, que já cobrem a mesma finalidade. `sku` é gerado
// automaticamente por trigger (gerar_sku_vestido) e nunca é definido aqui.
interface PecaSeed {
  nome: string;
  categoria_peca: "vestido" | "acessorio";
  cor: string;
  tamanho: string;
  comprimento: string;
  preco_aluguel: number;
  descricao: string;
  imagem_url: string;
}

const PECAS_SEED: PecaSeed[] = [
  // ── VESTIDOS DE FORMATURA (15 peças) ──────────────────────────────────
  { nome: "Vestido Princesa Azul Royal Formatura", categoria_peca: "vestido", cor: "Azul Royal", tamanho: "38", comprimento: "Longo", preco_aluguel: 750, descricao: "Vestido longo com saia volumosa, corpete bordado com cristais. Ideal para formatura.", imagem_url: FOTOS_VESTIDOS[0] },
  { nome: "Vestido Sereia Bordô Luxe", categoria_peca: "vestido", cor: "Bordô", tamanho: "40", comprimento: "Longo", preco_aluguel: 680, descricao: "Vestido sereia em tecido acetinado, decote V e cauda discreta. Sofisticado e elegante.", imagem_url: FOTOS_VESTIDOS[1] },
  { nome: "Vestido Ball Gown Champagne", categoria_peca: "vestido", cor: "Champagne", tamanho: "36", comprimento: "Longo", preco_aluguel: 820, descricao: "Vestido princesa em tule com corpete rendado e saia fluida. Perfeito para formatura.", imagem_url: FOTOS_VESTIDOS[2] },
  { nome: "Vestido Longo Navy Brilho", categoria_peca: "vestido", cor: "Azul Marinho", tamanho: "42", comprimento: "Longo", preco_aluguel: 620, descricao: "Vestido longo com tecido glitter navy, alças finas e fenda lateral.", imagem_url: FOTOS_VESTIDOS[3] },
  { nome: "Vestido Longo Emerald Green Sereia", categoria_peca: "vestido", cor: "Verde Esmeralda", tamanho: "38", comprimento: "Longo", preco_aluguel: 700, descricao: "Vestido sereia em crepe, cor verde esmeralda intensa, decote quadrado.", imagem_url: FOTOS_VESTIDOS[4] },
  { nome: "Vestido Formatura Rose Gold Princesa", categoria_peca: "vestido", cor: "Rose Gold", tamanho: "40", comprimento: "Longo", preco_aluguel: 780, descricao: "Vestido princesa em tule rose gold com bordado floral em todo o corpete.", imagem_url: FOTOS_VESTIDOS[5] },
  { nome: "Vestido Longo Preto Clássico", categoria_peca: "vestido", cor: "Preto", tamanho: "36", comprimento: "Longo", preco_aluguel: 590, descricao: "Vestido longo preto com decote nas costas, atemporalmente elegante.", imagem_url: FOTOS_VESTIDOS[6] },
  { nome: "Vestido Rubi Red Carpet", categoria_peca: "vestido", cor: "Vermelho Rubi", tamanho: "38", comprimento: "Longo", preco_aluguel: 730, descricao: "Vestido longo vermelho rubi com fenda e detalhes no ombro. Impactante.", imagem_url: FOTOS_VESTIDOS[7] },
  { nome: "Vestido Prata Glitter Longo", categoria_peca: "vestido", cor: "Prata", tamanho: "40", comprimento: "Longo", preco_aluguel: 760, descricao: "Vestido longo com tecido glitter prata, perfeito para brilhar na formatura.", imagem_url: FOTOS_VESTIDOS[8] },
  { nome: "Vestido Lilás Romântico", categoria_peca: "vestido", cor: "Lilás", tamanho: "42", comprimento: "Longo", preco_aluguel: 650, descricao: "Vestido longo lilás com saia em camadas de chiffon e laço na cintura.", imagem_url: FOTOS_VESTIDOS[9] },
  { nome: "Vestido Nude Bordado Pedraria", categoria_peca: "vestido", cor: "Nude", tamanho: "38", comprimento: "Longo", preco_aluguel: 850, descricao: "Vestido longo nude todo bordado com pedraria e tecido ilusion no busto.", imagem_url: FOTOS_VESTIDOS[10] },
  { nome: "Vestido Azul Serenity Fluido", categoria_peca: "vestido", cor: "Azul Serenity", tamanho: "36", comprimento: "Longo", preco_aluguel: 620, descricao: "Vestido longo fluido em chiffon azul serenity com cinto de strass.", imagem_url: FOTOS_VESTIDOS[11] },
  { nome: "Vestido Dourado Formatura Luxo", categoria_peca: "vestido", cor: "Dourado", tamanho: "40", comprimento: "Longo", preco_aluguel: 890, descricao: "Vestido princesa dourado com bordado de strass no corpete. Alto luxo.", imagem_url: FOTOS_VESTIDOS[12] },
  { nome: "Vestido Vinho Aveludado Sereia", categoria_peca: "vestido", cor: "Vinho", tamanho: "44", comprimento: "Longo", preco_aluguel: 670, descricao: "Vestido sereia em veludo vinho com decote V e costas abertas.", imagem_url: FOTOS_VESTIDOS[13] },
  { nome: "Vestido Blush Tule Princesa", categoria_peca: "vestido", cor: "Blush", tamanho: "38", comprimento: "Longo", preco_aluguel: 810, descricao: "Vestido princesa em tule blush com corpete rendado e saia volumosa.", imagem_url: FOTOS_VESTIDOS[14] },

  // ── VESTIDOS PARA CONVIDADAS (10 peças) ───────────────────────────────
  { nome: "Vestido Midi Marsala Elegância", categoria_peca: "vestido", cor: "Marsala", tamanho: "38", comprimento: "Midi", preco_aluguel: 380, descricao: "Vestido midi marsala em crepe com detalhe na cintura. Ideal para casamentos.", imagem_url: FOTOS_VESTIDOS[15] },
  { nome: "Vestido Midi Floral Festa", categoria_peca: "vestido", cor: "Floral Multicolor", tamanho: "40", comprimento: "Midi", preco_aluguel: 320, descricao: "Vestido midi com estampa floral delicada em fundo off-white. Versátil.", imagem_url: FOTOS_VESTIDOS[16] },
  { nome: "Vestido Midi Verde Sage", categoria_peca: "vestido", cor: "Verde Sage", tamanho: "36", comprimento: "Midi", preco_aluguel: 350, descricao: "Vestido midi verde sage com manga borboleta e saia midi. Moderno e chique.", imagem_url: FOTOS_VESTIDOS[17] },
  { nome: "Vestido Coral Midi Elegante", categoria_peca: "vestido", cor: "Coral", tamanho: "42", comprimento: "Midi", preco_aluguel: 390, descricao: "Vestido midi coral com decote assimétrico e saia drapeada.", imagem_url: FOTOS_VESTIDOS[18] },
  { nome: "Vestido Midi Azul Cobalt", categoria_peca: "vestido", cor: "Azul Cobalt", tamanho: "38", comprimento: "Midi", preco_aluguel: 360, descricao: "Vestido midi azul cobalt em crepe com decote V e fenda lateral discreta.", imagem_url: FOTOS_VESTIDOS[19] },
  { nome: "Vestido Terracota Midi Chic", categoria_peca: "vestido", cor: "Terracota", tamanho: "40", comprimento: "Midi", preco_aluguel: 340, descricao: "Vestido midi terracota com detalhe de amarração na cintura.", imagem_url: FOTOS_VESTIDOS[20] },
  { nome: "Vestido Rosa Antigo Midi", categoria_peca: "vestido", cor: "Rosa Antigo", tamanho: "36", comprimento: "Midi", preco_aluguel: 370, descricao: "Vestido midi rosa antigo com drapeado frontal e costas abertas.", imagem_url: FOTOS_VESTIDOS[21] },
  { nome: "Vestido Preto Midi Sofisticado", categoria_peca: "vestido", cor: "Preto", tamanho: "38", comprimento: "Midi", preco_aluguel: 330, descricao: "Vestido midi preto clássico com recortes laterais e decote comportado.", imagem_url: FOTOS_VESTIDOS[22] },
  { nome: "Vestido Lavanda Midi Romântico", categoria_peca: "vestido", cor: "Lavanda", tamanho: "44", comprimento: "Midi", preco_aluguel: 380, descricao: "Vestido midi lavanda em chiffon com camadas e manga longa em renda.", imagem_url: FOTOS_VESTIDOS[23] },
  { nome: "Vestido Mint Green Midi Moderno", categoria_peca: "vestido", cor: "Verde Menta", tamanho: "40", comprimento: "Midi", preco_aluguel: 360, descricao: "Vestido midi verde menta com pregas na saia e decote quadrado.", imagem_url: FOTOS_VESTIDOS[24] },

  // ── VESTIDOS DE MADRINHA (8 peças) ────────────────────────────────────
  { nome: "Vestido Madrinha Dusty Rose Longo", categoria_peca: "vestido", cor: "Dusty Rose", tamanho: "38", comprimento: "Longo", preco_aluguel: 520, descricao: "Vestido longo dusty rose em chiffon com alças finas e saia fluida. Clássico para madrinha.", imagem_url: FOTOS_VESTIDOS[25] },
  { nome: "Vestido Madrinha Sage Green Longo", categoria_peca: "vestido", cor: "Sage Green", tamanho: "40", comprimento: "Longo", preco_aluguel: 540, descricao: "Vestido longo sage green em crepe acetinado com cinto de laço.", imagem_url: FOTOS_VESTIDOS[26] },
  { nome: "Vestido Madrinha Dusty Blue", categoria_peca: "vestido", cor: "Dusty Blue", tamanho: "36", comprimento: "Longo", preco_aluguel: 510, descricao: "Vestido longo azul empoeirado com decote nas costas e cauda discreta.", imagem_url: FOTOS_VESTIDOS[27] },
  { nome: "Vestido Madrinha Terracota Quente", categoria_peca: "vestido", cor: "Terracota", tamanho: "42", comprimento: "Longo", preco_aluguel: 530, descricao: "Vestido longo terracota com amarração no ombro e saia drapeada.", imagem_url: FOTOS_VESTIDOS[28] },
  { nome: "Vestido Madrinha Lavanda Suave", categoria_peca: "vestido", cor: "Lavanda", tamanho: "38", comprimento: "Longo", preco_aluguel: 495, descricao: "Vestido longo lavanda em tule com corpete bordado e saia em camadas.", imagem_url: FOTOS_VESTIDOS[29] },
  { nome: "Vestido Madrinha Nude Champagne", categoria_peca: "vestido", cor: "Champagne", tamanho: "40", comprimento: "Longo", preco_aluguel: 575, descricao: "Vestido longo champagne em acetinado com recortes no busto e fenda.", imagem_url: FOTOS_VESTIDOS[30] },
  { nome: "Vestido Madrinha Verde Oliva", categoria_peca: "vestido", cor: "Verde Oliva", tamanho: "38", comprimento: "Longo", preco_aluguel: 490, descricao: "Vestido longo verde oliva com drapeado no ombro. Rústico chique.", imagem_url: FOTOS_VESTIDOS[0] },
  { nome: "Vestido Madrinha Marsala Profundo", categoria_peca: "vestido", cor: "Marsala", tamanho: "36", comprimento: "Longo", preco_aluguel: 550, descricao: "Vestido longo marsala em veludo com decote coração. Outono/inverno.", imagem_url: FOTOS_VESTIDOS[1] },

  // ── BOLSAS DE FESTA (8 peças) ────────────────────────────────────────
  { nome: "Clutch Dourada Glamour", categoria_peca: "acessorio", cor: "Dourado", tamanho: "Único", comprimento: "", preco_aluguel: 120, descricao: "Clutch dourada com fecho de strass. Comporta celular e essenciais.", imagem_url: FOTOS_VESTIDOS[31] },
  { nome: "Clutch Prata Minaudière", categoria_peca: "acessorio", cor: "Prata", tamanho: "Único", comprimento: "", preco_aluguel: 130, descricao: "Minaudière prata rígida com corrente removível. Elegante e sofisticada.", imagem_url: FOTOS_VESTIDOS[32] },
  { nome: "Bolsa Festa Nude Acetinado", categoria_peca: "acessorio", cor: "Nude", tamanho: "Único", comprimento: "", preco_aluguel: 95, descricao: "Bolsa de mão em cetim nude com alça de corrente dourada.", imagem_url: FOTOS_VESTIDOS[33] },
  { nome: "Clutch Preta Clássica", categoria_peca: "acessorio", cor: "Preto", tamanho: "Único", comprimento: "", preco_aluguel: 90, descricao: "Clutch preta em couro ecológico com fecho magnético e corrente.", imagem_url: FOTOS_VESTIDOS[34] },
  { nome: "Bolsa Festa Rose Gold Strass", categoria_peca: "acessorio", cor: "Rose Gold", tamanho: "Único", comprimento: "", preco_aluguel: 150, descricao: "Bolsa de festa toda bordada em strass rose gold. Peça de destaque.", imagem_url: FOTOS_VESTIDOS[35] },
  { nome: "Clutch Bordô Veludo", categoria_peca: "acessorio", cor: "Bordô", tamanho: "Único", comprimento: "", preco_aluguel: 105, descricao: "Clutch em veludo bordô com fecho dourado. Perfeita para festas de outono.", imagem_url: FOTOS_VESTIDOS[36] },
  { nome: "Bolsa Festa Azul Royal", categoria_peca: "acessorio", cor: "Azul Royal", tamanho: "Único", comprimento: "", preco_aluguel: 110, descricao: "Bolsa de mão azul royal com bordado de pedrarias e alça de corrente.", imagem_url: FOTOS_VESTIDOS[37] },
  { nome: "Clutch Transparente Cristal", categoria_peca: "acessorio", cor: "Cristal", tamanho: "Único", comprimento: "", preco_aluguel: 140, descricao: "Clutch box transparente com detalhes dourados e alça de corrente fina.", imagem_url: FOTOS_VESTIDOS[38] },
];

async function seedAcervo() {
  console.log(`\nIniciando seed do acervo — ${PECAS_SEED.length} peças\n`);

  let sucessos = 0;
  let erros = 0;

  for (const peca of PECAS_SEED) {
    const { error } = await supabase.from("vestidos").insert({
      nome: peca.nome,
      categoria_peca: peca.categoria_peca,
      cor: peca.cor,
      tamanho: peca.tamanho,
      comprimento: peca.comprimento,
      preco_aluguel: peca.preco_aluguel,
      status: "disponivel",
      descricao: peca.descricao,
      imagem_url: peca.imagem_url,
    });

    if (error) {
      console.error(`  ✗ ${peca.nome}: ${error.message}`);
      erros++;
    } else {
      console.log(`  ✓ ${peca.nome}`);
      sucessos++;
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  console.log(`\nSeed concluído!`);
  console.log(`   ${sucessos} peças inseridas com sucesso`);
  if (erros > 0) console.log(`   ${erros} peças com erro`);
  console.log(`\nPara remover as peças de demonstração depois:`);
  console.log(`   Exclua individualmente pelo Acervo no site, ou rode no SQL Editor:`);
  console.log(`   DELETE FROM vestidos WHERE qtd_total_locacoes = 0 AND sku LIKE 'MB-%';`);
  console.log(``);
}

seedAcervo().catch(console.error);

// Texto integral do "Contrato de Locação de Artigos do Vestuário" da MesBelle,
// transcrito do modelo oficial em PDF (Contrato_Aluguel_Mes_Belle_Atualizado_Novo)
// com os campos variáveis interpolados. Fica assim disponível para todo lugar
// que gera um contrato (addContrato, addContratoFromNegocio, geração direta do
// lead), em vez do placeholder curto que existia antes.

export interface DadosContrato {
  nomeLocataria: string;
  cpf: string;
  celular: string;
  email: string;
  produtoDescricao: string;
  valorLocacao: number;
  formaPagamento: string;
  observacoesPagamento?: string;
  dataEvento?: string; // YYYY-MM-DD
}

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDataEvento = (iso?: string) => {
  if (!iso) return "____/____/________";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function gerarTermosContrato(d: DadosContrato): string {
  return `CONTRATO DE LOCAÇÃO DE ARTIGOS DO VESTUÁRIO

Por este instrumento particular, a MES BELLE LTDA, com sede na Alameda Oscar Niemayer 360, SALA(801), Nova Lima, CEP: 34006056, inscrita no CNPJ sob o nº 60.499.719/0001-40, Inscrição Estadual MG nº 005208425.00-48, doravante denominada LOCADORA, e a LOCATÁRIA abaixo identificada, firmam o presente Contrato de Locação de Vestido(s) e/ou Acessório(s) por Prazo Determinado ("Contrato de Locação"), obrigando-se por si e seus sucessores aos termos e condições a seguir estipulados para toda e qualquer locação de produtos disponibilizados na loja física. Ao assinar este contrato, a LOCATÁRIA afirma concordar em cumprir com os termos e condições do presente Contrato de Locação.

NOME DA LOCATÁRIA: ${d.nomeLocataria}
CPF: ${d.cpf}
CELULAR: ${d.celular}
E-MAIL: ${d.email}

Cláusula 1ª – Objeto
1.1. O presente contrato tem como objeto a locação, por prazo certo e determinado, de vestido(s) e/ou acessório(s) de propriedade única e exclusiva da LOCADORA, disponibilizado(s) e selecionado(s) pela LOCATÁRIA de acordo com a disponibilidade dos Produtos ("Locação"). São eles:

PRODUTO(S) / DESCRIÇÃO: ${d.produtoDescricao}
VALOR DA LOCAÇÃO: ${fmtBRL(d.valorLocacao)}
FORMA DE PAGAMENTO: ${d.formaPagamento}
PAGAMENTO / OBSERVAÇÕES: ${d.observacoesPagamento?.trim() || "—"}

Cláusula 2ª – Valor e Forma de Pagamento da Locação
2.1. O valor da primeira Locação é previamente informado à LOCATÁRIA no ato da contratação de acordo com o valor do primeiro aluguel do(s) Produto(s), o prazo da Locação, o local de entrega e a forma de devolução do(s) Produto(s), sendo de responsabilidade única e exclusiva da LOCATÁRIA a escolha do(s) Produto(s), o prazo de Locação, o local de entrega e a forma de devolução do(s) Produto(s) locado(s), cujo custo do respectivo frete de entrega e/ou devolução poderá ser acrescido ao valor da Locação.
2.2. Para efetivação da contratação da Locação pretendida, a LOCATÁRIA deverá realizar o pagamento do valor total da primeira Locação do(s) Produto(s), através de dinheiro, pix, transferência bancária, ou cartão de crédito e débito.

Cláusula 3ª – Prazo da Locação
3.1. O prazo para entrega será aquele escolhido pela LOCATÁRIA no ato da contratação, de acordo com as opções disponibilizadas pela LOCADORA. O vestido pode ser enviado até 5 dias úteis antes do evento, QUE ACONTECERÁ EM: ${fmtDataEvento(d.dataEvento)}
O valor do envio é de responsabilidade da LOCATÁRIA.

Cláusula 4ª – Entrega do(s) Produto(s) Locado(s)
4.1. O(s) Produto(s) locado(s) será(ão) entregue(s) pela LOCADORA à LOCATÁRIA limpo(s), pronto(s) para utilização, na data solicitada.
4.2. Nos aluguéis efetuados pelo site ou com entrega via Correios, é responsabilidade integral da LOCATÁRIA receber o(s) produto(s) locados, ficando ciente que caso o endereço de entrega não seja considerado seguro ou esteja sujeito a condições especiais de entrega de acordo com a definição dos Correios, poderá ocorrer atraso e eventuais taxas adicionais para efetivação da entrega, cujos eventuais custos adicionais serão cobrados e arcados pela LOCATÁRIA.
4.3. É responsabilidade integral da LOCATÁRIA buscar o(s) produto(s) locados na data acordada. Após a retirada dos produtos locados da loja, a LOCADORA não se responsabiliza por mais nenhuma alteração.
4.4. Caso a LOCATÁRIA deseje, é concedido o direito de até três provas presenciais na loja durante o processo de confecção. As datas das provas deverão ser acordadas com antecedência de acordo com a disponibilidade da locadora e da locatária.
4.5. Na eventual impossibilidade da entrega do(s) Produto(s) locado(s), o valor do aluguel será integralmente restituído à LOCATÁRIA.

Cláusula 5ª – Obrigações e Responsabilidades da LOCATÁRIA
5.1. A LOCATÁRIA deverá entrar em contato para enviar as medidas solicitadas para a confecção do vestido solicitado. A medida do salto deverá ser a mesma medida que será usada no evento e em caso de mudança desta, a LOCADORA NÃO se responsabiliza por novos ajustes ou alterações.
5.2. Após o envio, a LOCATÁRIA assume o compromisso e a responsabilidade pela guarda, cuidado e utilização com zelo do(s) Produto(s) locado(s), como se fosse(m) de sua propriedade, responsabilizando-se por eventual perda, destruição, manchas e/ou quaisquer danos que ocorram com o(s) Produto(s), além do desgaste natural decorrente da sua utilização normal, sendo expressamente proibido a LOCATÁRIA lavar o(s) Produto(s) locado(s), bem como utilizar pulseiras, bolsas e outros acessórios que possam danificar as peças.
5.3. Diante da responsabilidade assumida no item 5.1 acima, a LOCATÁRIA desde já concorda em reparar financeiramente todos e quaisquer danos eventualmente causados ao(s) Produto(s) da LOCADORA, sendo certo que na hipótese de dano irreparável, será devido e cobrado pela LOCADORA à LOCATÁRIA, o valor de dois alugueis do vestido locado.
5.4. Constatado o mau uso da peça, com sujeira excessiva ou defeitos na peça ainda passíveis de manutenção, poderá a LOCADORA cobrar da LOCATÁRIA um valor de manutenção extra pelo desgaste da peça no valor de R$80,00.

Cláusula 6ª – Devolução do(s) Produto(s) Locado(s)
6.1. A LOCATÁRIA se compromete e responsabiliza em realizar a devolução do(s) Produto(s) locado(s), da forma escolhida no ato da contratação da Locação, sob pena da incidência das multas estabelecidas na Cláusula 7ª abaixo.
6.2. A devolução do(s) Produto(s) locado(s) deverá ser feita da seguinte forma: (i) Devolução na Loja: a LOCATÁRIA deverá realizar a devolução do(s) Produto(s) locado(s), diretamente na loja da LOCADORA até às 19hs (dezenove horas) da data do término do prazo da Locação acordada na cláusula 1.1; (ii) Caso a devolução seja por envio, a locatária possui até dois dias úteis para efetuar o mesmo.
6.3. A devolução deverá ser feita na mesma capa e cabide que foram entregues. Em caso de aluguel de brincos e bolsas, é obrigatório a devolução das tarraxas e alças das bolsas. Caso não sejam devolvidos, será cobrada uma taxa no valor dos acessórios locados.

Cláusula 7ª – Atraso na Devolução do(s) Produto(s) Locado(s)
7.1. A LOCATÁRIA se compromete a informar imediatamente a LOCADORA, todo e qualquer possível atraso que possa ocorrer na devolução do(s) Produto(s) locado(s), via e-mail ou telefone, para que possa ser verificada a possibilidade de extensão da Locação.
7.2. O atraso na devolução do(s) Produto(s) locado(s) acarretará a cobrança pela LOCADORA de multa correspondente ao valor de R$100 (cem reais) por dia de atraso.
7.3. Fica estabelecido que caso o atraso na devolução do(s) Produto(s) locado(s) seja superior a 05 (cinco) dias, será devido pela LOCATÁRIA à LOCADORA o valor de dois alugueis referente a cada peça locada.

Cláusula 8ª – Cancelamento da Locação
Pelo recebimento de um voucher com crédito do valor integral da primeira locação, a LOCATÁRIA poderá realizar a solicitação de cancelamento da Locação, via e-mail, no prazo de até 45 (quarenta e cinco) dias úteis de antecedência da data solicitada para a entrega do(s) Produto(s) locado(s); nesta hipótese a LOCATÁRIA poderá receber um voucher com valor total da Locação cancelada, para utilização em uma nova Locação no prazo de até 12 (doze) meses da data de sua emissão. Não há ressarcimento em caso de cancelamento pela locatária por ser um vestido feito sob medida.

Cláusula 9ª – Alterações
9.1. Após a aprovação do modelo, será iniciada a confecção do mesmo. Qualquer alteração que modifique a modelagem ou aumente a quantidade de matéria prima poderá ser cobrada à parte. O desenho do bordado será passado pela aprovação da cliente antes de ser iniciado.

Cláusula 10ª – Ajustes
Durante as provas, a cliente poderá solicitar os ajustes que gostaria para melhor encaixe em seu corpo. Não são considerados ajustes quaisquer alterações que modifiquem a modelagem do vestido. Caso seja feita a contratação do serviço à distância, a locadora deve fazer o acompanhamento das medidas durante o processo.

Cláusula 11ª – Demais Disposições
11.1. Este Contrato, incluindo os Termos e Condições e a Política de Privacidade do Site, constitui o acordo integral entre as partes.
11.2. Se qualquer disposição deste Contrato for considerada ilegal, inválida ou em conflito com qualquer lei de qualquer autoridade que tenha jurisdição sobre o presente Contrato, a validade das demais disposições permanecerá em pleno vigor e efeito.
11.3. A responsabilidade da LOCADORA por eventual falha na entrega do(s) Produto(s) é limitada ao valor da Locação, razão pela qual a locadora não será responsável por eventuais danos diretos ou indiretos decorrentes da Locação objeto deste contrato, em qualquer hipótese.
11.4. Todas as cobranças decorrentes do presente Contrato estão sujeitas a protesto e a inclusão do nome do devedor nos cadastros dos órgãos de proteção ao crédito, sendo que os custos decorrentes de cobranças, incluindo, sem limitação, honorários advocatícios, serão de responsabilidade do devedor.
11.5. Em caso de violação de qualquer disposição deste Contrato, a LOCADORA reserva-se o direito de não realizar novas locações à LOCATÁRIA inadimplente, bem como o de alterar ou cancelar o presente Contrato a qualquer momento, a seu exclusivo critério.
11.6. As Partes elegem o Foro Central da Comarca de Belo Horizonte/MG como o competente para dirimir quaisquer dúvidas oriundas do presente contrato, com exclusão de qualquer outro, por mais privilegiado que possa ser.

ASSINATURA
Declaro que li e concordo com os termos deste contrato.`;
}

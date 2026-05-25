import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

interface ContratoPDFData {
  numero: string;
  nome_cliente: string;
  cpf_cliente: string;
  data_evento: string;
  valor_total: number;
  termos_texto: string;
  assinatura_base64: string | null;
  data_assinatura: string | null;
  ip_assinatura?: string | null;
  user_agent?: string | null;
  token?: string | null;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { borderBottomWidth: 2, borderBottomColor: "#5A0019", paddingBottom: 12, marginBottom: 16 },
  brand: { fontSize: 18, color: "#5A0019", fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 9, color: "#666", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 10 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  metaItem: { width: "48%", marginBottom: 6 },
  metaLabel: { fontSize: 8, color: "#666", textTransform: "uppercase" },
  metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 6, color: "#5A0019" },
  terms: { fontSize: 9, lineHeight: 1.5, marginBottom: 12 },
  signatureBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 12, marginTop: 8 },
  signatureImg: { height: 80, objectFit: "contain", marginVertical: 6 },
  evidenceBox: { backgroundColor: "#fdf6f8", borderWidth: 1, borderColor: "#f0d7e0", borderRadius: 6, padding: 10, marginTop: 12 },
  evidenceTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#5A0019", marginBottom: 4 },
  evidenceRow: { flexDirection: "row", marginBottom: 2 },
  evidenceKey: { width: 110, fontSize: 8, color: "#666" },
  evidenceVal: { fontSize: 8, flex: 1 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: "#888", textAlign: "center", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 6 },
});

const ContratoDoc = ({ data }: { data: ContratoPDFData }) => {
  const dataAssinadaFmt = data.data_assinatura
    ? new Date(data.data_assinatura).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "long" })
    : "—";
  const dataEventoFmt = data.data_evento
    ? new Date(data.data_evento + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Més Belle</Text>
          <Text style={styles.brandSub}>Ateliê de Noivas</Text>
          <Text style={styles.title}>Contrato de Locação Nº {data.numero}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Cliente</Text>
            <Text style={styles.metaValue}>{data.nome_cliente}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>CPF</Text>
            <Text style={styles.metaValue}>{data.cpf_cliente}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Data do evento</Text>
            <Text style={styles.metaValue}>{dataEventoFmt}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Valor total</Text>
            <Text style={styles.metaValue}>
              R$ {Number(data.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Termos e Condições</Text>
        <Text style={styles.terms}>{data.termos_texto}</Text>

        <View style={styles.signatureBox}>
          <Text style={styles.evidenceTitle}>Assinatura da Cliente</Text>
          {data.assinatura_base64 ? (
            <Image src={data.assinatura_base64} style={styles.signatureImg} />
          ) : (
            <Text style={{ fontSize: 9, color: "#999" }}>Sem assinatura registrada.</Text>
          )}
          <Text style={{ fontSize: 8, color: "#666" }}>{data.nome_cliente} — CPF {data.cpf_cliente}</Text>
        </View>

        <View style={styles.evidenceBox}>
          <Text style={styles.evidenceTitle}>Carimbo Digital e Evidências de Autenticidade</Text>
          <View style={styles.evidenceRow}>
            <Text style={styles.evidenceKey}>Data/hora:</Text>
            <Text style={styles.evidenceVal}>{dataAssinadaFmt}</Text>
          </View>
          <View style={styles.evidenceRow}>
            <Text style={styles.evidenceKey}>Endereço IP:</Text>
            <Text style={styles.evidenceVal}>{data.ip_assinatura || "não capturado"}</Text>
          </View>
          <View style={styles.evidenceRow}>
            <Text style={styles.evidenceKey}>Dispositivo:</Text>
            <Text style={styles.evidenceVal}>{data.user_agent || "não capturado"}</Text>
          </View>
          {data.token && (
            <View style={styles.evidenceRow}>
              <Text style={styles.evidenceKey}>Token assinatura:</Text>
              <Text style={styles.evidenceVal}>{data.token}</Text>
            </View>
          )}
          <Text style={{ fontSize: 7, color: "#666", marginTop: 6 }}>
            Documento assinado eletronicamente. Validade jurídica conforme MP 2.200-2/2001 art. 10 §2º.
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          Més Belle Ateliê de Noivas — Contrato Nº {data.numero} — Página gerada eletronicamente
        </Text>
      </Page>
    </Document>
  );
};

export async function baixarContratoPDF(data: ContratoPDFData) {
  const blob = await pdf(<ContratoDoc data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contrato-${data.numero}-assinado.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

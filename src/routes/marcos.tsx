import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppNav";
import { AvancoPorModulo, CartoesResumo, TabelaBloqueios, TabelaPrazos } from "@/components/resumo";
import { REVISAO, fmt } from "@/lib/burnup";

export const Route = createFileRoute("/marcos")({
  head: () => ({
    meta: [
      { title: "Prazos · CRM Ingá Pneus" },
      { name: "description", content: "Bloqueios com terceiros, avanço por prazo e por módulo do MVP do CRM Ingá Pneus." },
      { property: "og:title", content: "Prazos · CRM Ingá Pneus" },
      { property: "og:description", content: "Bloqueios com terceiros, avanço por prazo e por módulo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarcosPage,
});

function MarcosPage() {
  return (
    <>
      <PageHeader
        title="Prazos e"
        accent="avanço"
        subtitle={`Situação informada pelo time na planilha de ${fmt(REVISAO)}. Cada card tem o próprio prazo; os sem prazo aparecem numa linha à parte. Primeiro o que depende de fora do time.`}
      />
      <CartoesResumo />
      {/* Acima das demais: é o que depende de terceiros. */}
      <TabelaBloqueios />
      <TabelaPrazos />
      <AvancoPorModulo />
    </>
  );
}

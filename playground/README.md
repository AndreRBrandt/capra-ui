# Capra UI — Playground

Sandbox de validação para o framework `@capra-ui/core`. Renderiza um dashboard
real através do `DashboardRenderer`, alimentado **exclusivamente** por arquivos
JSON (definição + dados). Sem API, sem fetch, sem domínio Bode/Capra.

## Por que existe

Validar o contrato "framework recebe configuração JSON + dados normalizados
(`CapraResult`) e renderiza tudo" sem qualquer customização local na app.
Se um componente precisa de modificação local, ele falha aqui antes de chegar
em produção.

## Como rodar

```bash
cd playground
pnpm install
pnpm dev
```

Abre em `http://localhost:5174`.

## Estrutura

```
playground/
├── data/
│   ├── dashboard-vendas.json   DashboardDefinition (config pura)
│   └── widget-data.json        Record<widgetId, CapraResult>
├── src/
│   ├── App.vue                 Carrega JSONs, alterna estados (loaded/loading/error)
│   ├── main.ts                 Bootstrap Vue + createCapraPlugin
│   └── playground.css          Apenas o chrome da página (não estiliza componentes do framework)
├── DECISIONS.md                Decisões + alternativas + rationale
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## O que não está aqui (intencionalmente)

- **Nenhum CSS de override** de componentes do framework. Se o componente
  parece "feio", o problema é do framework — não se compensa aqui.
- **Nenhum mapping BIMachine, MDX, ou schema OLAP custom.** Os JSONs falam só
  o vocabulário público do framework: `DashboardDefinition` + `CapraResult`.
- **Nenhuma lógica de fetch / cache / auth.** O parent passa dados estáticos.

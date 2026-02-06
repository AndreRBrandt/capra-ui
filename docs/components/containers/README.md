# Containers

> Wrappers estruturais para composição de componentes.

## Componentes

| Componente                                  | Descrição                       | Testes |
| ------------------------------------------- | ------------------------------- | ------ |
| [AnalyticContainer](./AnalyticContainer.md) | Wrapper para objetos analíticos | 35     |

**Total: 35 testes**

---

## Propósito

Containers fornecem estrutura comum para componentes mais complexos:

- **Estados** - loading, error, empty
- **Layout** - header, content, footer
- **Slots** - customização flexível

---

## Uso

```vue
<AnalyticContainer
  title="Faturamento por Loja"
  :loading="isLoading"
  :error="error"
  :empty="data.length === 0"
>
  <DataTable :data="data" />
</AnalyticContainer>
```

---

## Planejados

| Componente       | Descrição                            |
| ---------------- | ------------------------------------ |
| TooltipContainer | Container para tooltips posicionados |
| HelpContainer    | Container para help contextual       |

---

_Última atualização: Janeiro/2025_

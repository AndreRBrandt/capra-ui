# UI Components

> Elementos visuais genéricos e reutilizáveis.

## Componentes

| Componente                      | Descrição                         | Testes |
| ------------------------------- | --------------------------------- | ------ |
| [BaseButton](./BaseButton.md)   | Botão com variantes e tamanhos    | 20     |
| [Modal](./Modal.md)             | Dialog modal com backdrop         | 29     |
| [ConfigPanel](./ConfigPanel.md) | Painel de configuração de colunas | 32     |

**Total: 81 testes**

---

## Características

- **Genéricos** - Sem lógica de negócio
- **Reutilizáveis** - Usados em qualquer contexto
- **Acessíveis** - ARIA, keyboard navigation
- **Testados** - Cobertura completa

---

## Uso

```typescript
import BaseButton from "@/core/components/ui/BaseButton.vue";
import Modal from "@/core/components/ui/Modal.vue";
import ConfigPanel from "@/core/components/ui/ConfigPanel.vue";
```

---

_Última atualização: Janeiro/2025_

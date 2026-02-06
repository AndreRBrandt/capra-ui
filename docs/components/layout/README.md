# Layout Components

> Estrutura de página e navegação.

## Componentes

| Componente                | Descrição                          | Testes |
| ------------------------- | ---------------------------------- | ------ |
| [AppShell](./AppShell.md) | Container responsivo com navegação | 27     |

**Total: 27 testes**

---

## AppShell

Container principal que fornece:

- **Header** - Título + ações
- **Bottom Nav** - Navegação mobile (< 768px)
- **Top Nav** - Navegação desktop (≥ 768px)
- **Content** - Área principal via slot

---

## Uso

```vue
<AppShell
  :title="pageTitle"
  :nav-items="navItems"
  :active-item="activeItem"
  @navigate="handleNavigate"
>
  <!-- Conteúdo -->
</AppShell>
```

---

_Última atualização: Janeiro/2025_

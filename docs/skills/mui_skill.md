# Skill: Melhores Práticas para Material-UI (MUI v5/v6)

Esta skill consolida as diretrizes de design system, estilização e otimização para criação de interfaces modernas e responsivas utilizando **Material-UI (MUI)**.

---

## 1. Design System Centralizado (`ThemeProvider`)

* **Tema Customizado:** Nunca utilize cores estáticas codificadas diretamente nos componentes (`#ffffff`, `#000000`). Defina uma paleta harmoniosa, tipografia e espaçamentos no `createTheme()`.
* **Suporte a Dark Mode:** Utilize a prop `mode` no tema para alternância dinâmica entre temas claro e escuro.

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    background: { default: '#0f172a', paper: '#1e293b' },
  },
});
```

---

## 2. Estilização Moderna com a Prop `sx`

* **Uso Inteligente da Prop `sx`:** Utilize a prop `sx` para aplicar estilos inline que acessam diretamente os tokens do tema (ex: `sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}`).
* **Evite CSS Inline Puro:** Prefira sempre utilitários do MUI em vez de `style={{ ... }}` para garantir consistência visual e suporte a temas.

---

## 3. Componentização e Layout Responsivo

* **Grid e Stack:** Utilize `Stack` para layouts unidirecionais (listas verticais de mensagens ou barras de ferramentas horizontais) e `Grid` (ou `Grid2`) para layouts bidimensionais complexos.
* **Breakpoints Nativos:** Defina responsividade facilmente usando objetos nos breakpoints: `sx={{ width: { xs: '100%', md: '300px' } }}`.

---

## 4. Otimização para Interfaces de Chat (Listas de Mensagens)

* **Auto-Scroll Suave:** Em interfaces de chat onde as mensagens chegam via streaming, utilize um contêiner `Box` com `overflowY: 'auto'` e uma referência (`ref`) rolando suavemente até o final (`scrollIntoView({ behavior: 'smooth' })`).
* **Componentes de Feedback:** Utilize `CircularProgress`, `Skeleton` e `Chip` para indicar status da conversa e execução de ferramentas (*tool calls*) de forma elegante.

---
name: Birthub 360° Regeneration
description: Revenue Intelligence OS — Enterprise Executive Cockpit
colors:
  neon-blue: "#0284C7"
  neon-blue-dark: "#00D4FF"
  neon-pink: "#D91B7C"
  neon-pink-dark: "#FF2D9B"
  neon-gold: "#D97706"
  neon-gold-dark: "#FFC107"
  neon-iris: "#7C3AED"
  neon-iris-dark: "#8B7DFF"
  bg-canvas: "#F4F7FB"
  bg-canvas-dark: "#0B132B"
  surface-card: "#FFFFFF"
  surface-card-dark: "#131F42"
  surface-subtle: "#F1F5F9"
  surface-subtle-dark: "#1A2954"
  text-heading: "#0B132B"
  text-heading-dark: "#F8FAFC"
  text-body: "#1E293B"
  text-body-dark: "#E2E8F0"
  text-muted: "#475569"
  text-muted-dark: "#94A3B8"
  border-subtle: "rgba(15, 23, 42, 0.08)"
  border-subtle-dark: "rgba(255, 255, 255, 0.10)"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  h3:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  telemetry:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card-bento:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "24px"
  button-primary:
    backgroundColor: "{colors.neon-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-action:
    backgroundColor: "{colors.neon-pink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  badge-telemetry:
    backgroundColor: "rgba(2, 132, 199, 0.08)"
    textColor: "{colors.neon-blue}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Birthub 360° Regeneration

## Visual Direction & Philosophy
Birthub 360° é um cockpit executivo corporativo focado em dados de receita em tempo real. A experiência visual equilibra alta densidade informativa com clareza cristalina, eliminando todo ornamento artificial ("AI slop") e substituindo por micro-estruturas de dados, precisão tipográfica e contraste WCAG 2.2 AA.

## Color Palette & Semantic Roles
- **Azul Neon (`#0284C7` / `#00D4FF`):** Halos de órbita, dados primários de telemetria, CTAs secundários e gráficos de execução.
- **Rosa Neon (`#D91B7C` / `#FF2D9B`):** Conversão, ações executivas mandatórias, destaques de fechamento e alertas de risco crítico.
- **Dourado Neon (`#D97706` / `#FFC107`):** Métricas de ARR, MRR, metas e projeções de receita ponderada.
- **Íris Inteligência (`#7C3AED` / `#8B7DFF`):** Supervisão autônoma, catálogo dos 394 agentes e IA preditiva.
- **Superfícies Bento:** Fundo Canvas `#F4F7FB` (Light) e `#0B132B` (Dark). Cards brancos `#FFFFFF` com bordas semitransparentes `rgba(15, 23, 42, 0.08)`.

## Typography Triad
- **Sora:** Títulos H1-H6, heros executivos e métricas de grande porte. Tracking de `-0.02em`.
- **Inter:** Toda a interface de operação (tabelas, formulários, grids bento, modais). Renderizada com `font-feature-settings: "cv05", "cv11", "ss01"`.
- **IBM Plex Mono:** Valores monetários, contadores de telemetria, badges de permissão (ADMIN, CLOSER, MANAGER), status de missões e hashes de auditoria.

## Normative Execution Rules
1. **Regra de Ausência de Preto/Branco Puro em Títulos:** Nenhum título ou subtítulo deve usar `#000000` ou `#FFFFFF` puro. Utilize `#0B132B` no tema claro e `#F8FAFC` no tema escuro.
2. **Densidade Bento Modular:** Organização de dashboards em grades de proporção 12 colunas, evitando áreas de respiro vazias injustificadas e cartões soltos sem hierarquia.
3. **Contraste Acessível:** Relação mínima de contraste de 4.5:1 para texto normal e 3:1 para elementos de interface e gráficos essenciais.
4. **Respeito aos Dados:** Distinção visual explícita entre dados reais de CRM e estimativas/projeções sintéticas de IA.

# Recomendações pesquisadas para navegação mobile

## Decisão para o Projeto-Manga

Usar um menu hambúrguer modal no mobile, mantendo no header apenas logo, título curto e o botão de menu. As ações menos frequentes — exportar, perfil, compartilhar, adicionar e sair — ficam dentro do menu. A busca e a ação principal de adicionar continuam acessíveis no conteúdo da coleção, reduzindo o custo de descoberta.

## Princípios aplicados

- O Material Design recomenda drawers modais para larguras compactas menores que 600dp e recomenda agrupar destinos relacionados, colocando os mais frequentes no topo.
- A Nielsen Norman Group recomenda o ícone hambúrguer padrão de três linhas, no canto superior esquerdo, com rótulo “Menu” quando possível; também alerta que esconder toda a navegação aumenta o custo de interação, então tarefas principais devem continuar visíveis.
- O drawer será fechado por botão explícito, clique no backdrop e tecla Escape; receberá `role="dialog"`, `aria-modal="true"`, `aria-label` e foco acessível.
- Os controles terão áreas de toque confortáveis e o menu usará transição curta, sem depender de carrossel para ações de navegação.

## Fontes

1. Material Design 3 — Navigation drawer: https://m3.material.io/components/navigation-drawer/overview
2. Nielsen Norman Group — The Hamburger-Menu Icon Today: Is it Recognizable?: https://www.nngroup.com/articles/hamburger-menu-icon-recognizability/
3. Nielsen Norman Group — Supporting Mobile Navigation in Spite of a Hamburger Menu: https://www.nngroup.com/articles/support-mobile-navigation/
4. W3C WAI-ARIA APG — Dialog (Modal) Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

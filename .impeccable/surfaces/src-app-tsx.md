# Sparkle Finance — superfície principal

## Scope

- Surface: app shell, dashboard, orçamento, histórico e ajustes.
- Mode: Operate.
- Audience: pessoas leigas que precisam entender o mês e registrar um gasto com pouco esforço.
- Job: registrar receitas e despesas, conferir o saldo e ajustar limites mensais.
- Constraints: preservar persistência local, sincronização opcional, navegação existente, marca Sparkle Finance e lírios brancos.

## Direction contract

### THESIS

O dinheiro do mês deve caber na mão: uma visão acolhedora e compacta que responde rapidamente o que aconteceu e qual é a próxima ação. A tela recusa o dashboard financeiro carregado de tabelas, métricas técnicas e controles pequenos demais.

### OWN-WORLD

“Jardim de bolso” usa blush claro, superfícies quentes e berry como sinal de ação, com verde suave apenas para estados positivos. Bordas finas, cantos generosos e sombras ambientais leves criam camadas sem transformar cada informação em um card pesado. Lírios reais aparecem como respiro nas bordas; o logo Sparkle Finance permanece a âncora de reconhecimento no topo.

### STORY

Ao abrir, a pessoa entende o saldo disponível, vê receitas, planejamento e despesas e consegue registrar um gasto em um toque. Depois pode informar a receita do mês, revisar lançamentos e entrar no planejamento sem aprender uma taxonomia financeira nova. Os mesmos dados continuam locais e os estados de sincronização seguem explícitos.

### FIRST VIEWPORT

No topo, logo compacto e status; abaixo, um hero claro com a pergunta “O que aconteceu hoje?”, saldo em escala maior, dois caminhos de registro e um resumo de quatro números. O seletor de mês e a entrada de receita vêm antes dos lançamentos; a navegação inferior flutuante mantém o polegar próximo da ação de adicionar despesa. Em telas estreitas, o resumo empilha em duas colunas e o hero reduz a escala sem esconder a ação principal.

### FORM

Direção C, “Jardim de bolso”, escolhida na rodada oficial de direções; seed key `1963f393`. Forma: app financeiro responsivo com navegação inferior, um foco principal por momento, fotografia de lírios como acento e marca visível sem competir com os dados. A direção é aplicada ao shell e às superfícies compartilhadas para que dashboard, orçamento, histórico e ajustes pareçam o mesmo lugar.

### FINISH

unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- O navegador interno não pôde ser automatizado nesta sessão; a inspeção final usa build, detector e servidor local disponível em `http://127.0.0.1:5173/`.

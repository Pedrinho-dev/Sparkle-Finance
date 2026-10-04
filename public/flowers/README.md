# Flores locais

O asset ativo é um recorte PNG local, gerado para o projeto, com transparência real. A interface aplica baixa opacidade e uma máscara suave nas bordas para manter os lírios como decoração discreta em cantos, cabeçalhos, splash e estados vazios:

- `white-lilies-cutout.png` — composição vertical de lírios brancos em alta resolução e com alpha real.

O componente `src/components/FloralAccent.tsx` usa somente esse arquivo local e mantém um fallback CSS discreto caso o asset não carregue. Nenhuma flor essencial depende de URL externa. Os JPGs antigos com quadriculado embutido não são mais referenciados pela aplicação.

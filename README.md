# bolsoline

Linha do tempo interativa para acompanhar a trajetória pública da família Bolsonaro. O projeto organiza acontecimentos em ordem cronológica, relacionando cada marco a pessoas, temas e fontes.

## O que tem

- Linha do tempo horizontal e infinita, navegável nos dois sentidos.
- Até quatro faixas de cards acima e abaixo do eixo, com layout compacto adaptativo no enquadramento geral.
- Cards compactos até 20× de zoom; acima disso, os cards completos aparecem. Clicar em um card compacto centraliza o evento e aplica zoom de 21×.
- Cards sem imagem não exibem bloco de mídia.
- Marcadores verticais com título para destacar períodos e acontecimentos importantes.
- Pessoas e temas associados a cada evento.
- Filtros por pessoa e por tópico, com contagem de resultados.
- Embeds do X/Twitter e prévias de links.
- Zoom, arrasto e atalhos de teclado.
- Zoom e posição salvos no navegador via `localStorage`.
- Interface em português do Brasil.
- Validação dos dados em tempo de execução.

## Stack

- [Vue 3](https://vuejs.org/) + TypeScript
- [Vite](https://vite.dev/)
- [Vitest](https://vitest.dev/)
- [ESLint](https://eslint.org/)
- Python 3 para o script opcional de importação de matérias
- Node.js 20+

## Como rodar

```bash
npm install
npm run dev
```

O app fica disponível no endereço indicado pelo Vite, normalmente `http://localhost:5173`.

Outros comandos:

```bash
npm run lint      # verifica o código
npm test          # roda os testes
npm run build     # type-check + build de produção
npm run preview   # prévia do build
```

## Configuração

As opções visuais e de interação ficam em `src/timeline.config.ts`.

| Opção | Padrão | Efeito |
| --- | --- | --- |
| `cards.compactUntilZoom` | `20` | Zoom máximo em que os cards compactos aparecem. |
| `cards.compactFocusZoomOffset` | `1` | Quanto o clique em um card compacto soma ao limite acima para abrir o card completo. |
| `cards.maxRowsPerSide` | `4` | Número máximo de faixas de cards acima e abaixo do eixo. |
| `cards.rowStep` | `128` | Espaçamento vertical máximo entre faixas, em pixels. |
| `cards.minRowStep` | `80` | Menor espaçamento permitido para tentar manter todas as faixas visíveis. |
| `cards.denseRowStep` | `112` | Abaixo desse espaçamento os cards compactos usam o modo denso. |
| `cards.gap` | `26` | Distância horizontal entre cards na mesma faixa. |
| `cards.width` / `cards.narrowWidth` | `304` / `264` | Largura dos cards em telas normais e estreitas. |
| `cards.narrowBreakpoint` | `680` | Largura em pixels que ativa o card estreito. |
| `zoom.buttonStep` | `1` | Quanto cada clique em `+` ou `-` adiciona ou remove do zoom. |
| `zoom.minLevel` / `zoom.maxLevel` | `0.283...` / `200` | Limites de zoom em relação ao enquadramento geral. |
| `zoom.wheelSensitivity` | `0.0025` | Sensibilidade do zoom por scroll. |
| `zoom.hiddenEventsStep` | `1.8` | Fator aplicado ao clicar no aviso de eventos ocultos. |
| `layout.axisGapEstimate` | `38` | Distância estimada entre o eixo e a primeira faixa. |
| `layout.edgePadding` / `layout.extraRightPadding` | `48` / `24` | Margens horizontais da linha do tempo. |
| `layout.minFitWidth` | `140` | Largura mínima usada para calcular o enquadramento. |
| `layout.viewMargin` | `24` | Margem vertical reservada para as faixas. |
| `layout.smallScreenWidth` | `720` | Largura que ativa o enquadramento inicial em telas pequenas. |
| `layout.initialMobileZoom` / `layout.initialMobileMinScale` | `3` / `2.4` | Zoom inicial em telas pequenas. |
| `layout.viewSaveDelay` | `180` | Atraso em milissegundos para salvar zoom e posição. |

## Dados

Os dados ficam em `src/data` e são divididos em arquivos semestrais. Essa pasta não é versionada no repositório, então um clone novo precisa criar os arquivos localmente.

```text
src/data/
  timeline.meta.json     # entities, topics e markers
  events-2018-h2.json    # eventos do 2º semestre de 2018
  events-2019-h1.json    # eventos do 1º semestre de 2019
  events-2019-h2.json    # eventos do 2º semestre de 2019
```

O app descobre automaticamente todos os arquivos `events-AAAA-hN.json` e os mescla na ordem cronológica. O nome do arquivo precisa corresponder ao semestre de `occurredAt`; o importador valida essa regra para impedir que uma matéria caia no arquivo errado.

### Regras

- `timeline.meta.json` contém os arrays `entities`, `topics` e `markers`.
- Cada `events-AAAA-hN.json` contém um objeto com o array `events`.
- `entities[].kind` é opcional e aceita `person`, `organization`, `country` ou `group`; o filtro de pessoas usa `person`.
- Todos os `id` devem ser únicos dentro da própria coleção, inclusive entre arquivos semestrais.
- `occurredAt` e `retrievedAt` aceitam ISO 8601 ou `AAAA-MM-DD`.
- `retrievedAt` deve ser igual ou posterior a `occurredAt`.
- Cada item de `topicIds` e `entityIds` precisa existir no arquivo de metadados.
- `link` deve ser uma URL absoluta `http` ou `https`.
- `markers` posicionam uma linha vertical no eixo; a data não aparece no card do marcador.
- O conteúdo do card fica em `preview`: `title`, `description`, `image` e `site`.
- `preview` e seus campos são opcionais; campos ausentes simplesmente não aparecem.
- `title`, `description` e `coverImage` no nível do evento são aceitos apenas como fallback opcional para dados antigos. A interface prefere `preview.title`, `preview.description` e `preview.image`; `coverImage` corresponde a `preview.image`.
- `link` também é opcional, mas é usado como origem e fallback do título quando não há conteúdo.

## Adicionar uma matéria

O script aceita um link, extrai os dados da página e grava o evento no arquivo semestral correspondente:

```bash
npm run add-event -- https://example.com/materia
```

No terminal interativo, o script mostra a data detectada e permite corrigi-la antes de gravar:

```text
Data da matéria: 30/05/2019
Nova data (dd/mm/aaaa) ou Enter para manter:
```

Pressione Enter para manter a data detectada ou digite uma data no formato `dd/mm/aaaa`. A data final define o arquivo `events-AAAA-hN.json`; a gravação só acontece depois dessa confirmação. O fluxo normal não imprime o JSON do evento.

Para testar sem gravar:

```bash
npm run add-event -- https://example.com/materia --dry-run
```

Opções úteis:

```bash
npm run add-event -- <url> --full       # preenche título, descrição e imagem (padrão)
npm run add-event -- <url> --empty      # deixa título, descrição e imagem vazios
npm run add-event -- <url> --no-ai      # usa somente a extração local
npm run add-event -- <url> --title "..." # sobrescreve o título da prévia
npm run add-event -- <url> --date 2024-01-01 # pula a confirmação da data
npm run add-event -- <url> --force      # permite link duplicado
npm run add-event -- <url> --json       # imprime somente o evento gerado
npm run add-event -- <url> --data-dir ./src/data
python3 scripts/add-event.py --help     # lista todas as opções
```

`--full` e `--empty` são mutuamente exclusivos. Mesmo com `--empty`, o link, a data, os temas e os envolvidos são importados; o objeto `preview` mantém apenas `site`.

Com uma chave do Gemini disponível no ambiente, o script tenta melhorar a extração:

```bash
export GEMINI_API_KEY="sua-chave"
npm run add-event -- https://example.com/materia
```

Também é aceito `GOOGLE_API_KEY`. Sem chave, o script usa a extração local e avisa no terminal.

Se a página bloquear o acesso direto com um desafio Cloudflare, o script tenta automaticamente o leitor alternativo `r.jina.ai`.

O mapeamento reutiliza temas e envolvidos existentes e cria os que faltarem. O Gemini recebe os temas, os envolvidos e os marcos (`markers`) já cadastrados como contexto; escolhe de 1 a 4 temas e de 1 a 6 envolvidos, cada um com `kind` (`person`, `organization`, `country` ou `group`). Novos envolvidos e temas são gravados em `timeline.meta.json`. Todo evento recebe pelo menos um tema. Temas de menus, rodapés e seções do site são ignorados; em especial, `Saúde` só é atribuída quando o título ou a descrição tratam diretamente de saúde.

## Atualizar prévias de links

Para buscar título, descrição e imagem OpenGraph das matérias:

```bash
npm run previews
```

O script percorre todos os arquivos `events-AAAA-hN.json`, mantém prévias já completas e ignora links do X/Twitter, que são renderizados como embed no app. Use `npm run previews -- --force` para buscar novamente.

## Atalhos

- Arraste na horizontal para navegar.
- Deslize dois dedos na vertical para dar zoom.
- Deslize dois dedos na horizontal para navegar.
- `+` / `-`: zoom em passos de 1×.
- `0`: ajustar a linha do tempo à tela.
- `←` / `→`: navegar.

## Estrutura

```text
src/
  components/    componentes da timeline e dos cards
  data/          metadados + eventos semestrais locais, não versionados
  lib/           datas, layout, eixo, validação e utilitários
  App.vue        carregamento e validação dos dados
  types.ts       tipos do domínio
public/covers/   capas SVG dos eventos
scripts/         importação de matérias e prévias de links
tests/           testes unitários
```

## Créditos e uso

O projeto reúne informações públicas para fins de acompanhamento cronológico. Cada evento deve apontar para a fonte original sempre que possível.

# bolsoline

Linha do tempo interativa para acompanhar a trajetória pública da família Bolsonaro. O projeto organiza acontecimentos em ordem cronológica, relacionando cada marco a pessoas, temas e fontes.

## O que tem

- Linha do tempo horizontal e infinita, navegável nos dois sentidos.
- Cards alternados acima e abaixo do eixo.
- Marcadores verticais com título para destacar períodos e acontecimentos importantes.
- Pessoas e temas associados a cada evento.
- Embeds do X/Twitter e prévias de links.
- Zoom, arrasto e atalhos de teclado.
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

## Dados

Os dados ficam em `src/data/timeline.json`. Essa pasta não é versionada no repositório, então um clone novo precisa criar o arquivo localmente.

### Regras

- `entities`, `topics` e `events` são obrigatórios.
- `markers` é opcional; quando ausente, é tratado como uma lista vazia.
- Todos os `id` devem ser únicos dentro da própria coleção.
- `occurredAt` e `retrievedAt` aceitam ISO 8601 ou `AAAA-MM-DD`.
- `retrievedAt` deve ser igual ou posterior a `occurredAt`.
- Cada item de `topicIds` e `entityIds` precisa existir nas coleções correspondentes.
- `link` deve ser uma URL absoluta `http` ou `https`.
- `markers` posicionam uma linha vertical no eixo; a data não aparece no card do marcador.

Campos opcionais de um evento:

- `description`
- `link`
- `coverImage` (por exemplo, `/covers/gpt4.svg`)
- `preview`, com `title`, `description`, `image` e `site`

## Adicionar uma matéria

O script aceita um link, extrai os dados da página e grava o evento no JSON:

```bash
npm run add-event -- https://example.com/materia
```

Para testar sem gravar:

```bash
npm run add-event -- https://example.com/materia --dry-run
```

Opções úteis:

```bash
npm run add-event -- <url> --no-ai       # usa somente a extração local
npm run add-event -- <url> --title "..." # sobrescreve o título
npm run add-event -- <url> --date 2024-01-01
npm run add-event -- <url> --force       # permite link duplicado
npm run add-event -- <url> --json        # imprime somente o evento gerado
python3 scripts/add-event.py --help      # lista todas as opções
```

Com uma chave do Gemini disponível no ambiente, o script tenta melhorar a extração:

```bash
export GEMINI_API_KEY="sua-chave"
npm run add-event -- https://example.com/materia
```

Também é aceito `GOOGLE_API_KEY`. Sem chave, o script usa a extração local e avisa no terminal.

## Atualizar prévias de links

Para buscar título, descrição e imagem OpenGraph das matérias:

```bash
npm run previews
```

O script mantém prévias já completas e ignora links do X/Twitter, que são renderizados como embed no app. Use `npm run previews -- --force` para buscar novamente.

## Atalhos

- Arraste na horizontal para navegar.
- Deslize dois dedos na vertical para dar zoom.
- Deslize dois dedos na horizontal para navegar.
- `+` / `-`: zoom.
- `0`: ajustar a linha do tempo à tela.
- `←` / `→`: navegar.

## Estrutura

```text
src/
  components/    componentes da timeline e dos cards
  data/          timeline.json local, não versionado
  lib/           datas, layout, eixo, validação e utilitários
  App.vue        carregamento e validação dos dados
  types.ts       tipos do domínio
public/covers/   capas SVG dos eventos
scripts/         importação de matérias e prévias de links
tests/           testes unitários
```

## Créditos e uso

O projeto reúne informações públicas para fins de acompanhamento cronológico. Cada evento deve apontar para a fonte original sempre que possível.

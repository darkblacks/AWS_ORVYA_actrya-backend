# Arquitetura Actrya 2.0

## Conceito
O Actrya não conhece "Tarefa" como entidade fixa. Ele conhece `project_items` organizados em até três instâncias hierárquicas. O usuário dá nome e significado a cada instância.

- Instância 1: sem pai; possui board raiz.
- Instância 2: board aberto a partir de um item da instância 1.
- Instância 3: board aberto a partir de um item da instância 2.
- Granularidade abaixo disso deve usar campos do card, como `repeater`, tabelas internas, fotos ou listas.

## Tabelas
- `users`: contas e hash de senha.
- `projects`: projetos.
- `project_members`: acesso ao projeto.
- `project_instances`: configuração das três instâncias do projeto.
- `kanban_layouts`: moldes de Kanban reutilizáveis.
- `kanban_layout_columns`: colunas configuráveis do molde.
- `card_layouts`: moldes de card reutilizáveis.
- `card_layout_fields`: campos configuráveis, inclusive `repeater`.
- `boards`: Kanbans reais; um board filho aponta para `parent_item_id`.
- `project_items`: cards reais. É tabela particionada por `project_id`; cada projeto cria sua própria partição física automaticamente.
- `actions`: auditoria before/after.
- `files`: metadados de arquivos; no MVP os bytes ficam em disco da VM.

## Layout x dado real
`kanban_layouts/card_layouts` são modelos. `boards/project_items` são dados reais. `project_instances` define os layouts padrão de cada nível; cada `board` guarda os layouts efetivamente usados, permitindo override futuro por board.

## Senha
Senha não é criptografada reversivelmente. É armazenada somente como hash bcrypt (12 rounds). O login emite JWT.

## Partição por projeto
`project_items` é uma tabela PostgreSQL particionada. Quando um projeto é criado, o backend executa algo como:

```sql
CREATE TABLE project_items_p_<uuid>
PARTITION OF project_items
FOR VALUES IN ('<project_id>');
```

O frontend/backend consulta normalmente `project_items WHERE project_id = ...`; o PostgreSQL faz partition pruning e acessa apenas a partição necessária.

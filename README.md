# Actrya Backend 2.0 — NestJS + PostgreSQL

Backend reconstruído para o novo modelo configurável do Actrya.

## O que está pronto
- Cadastro e login por e-mail/senha.
- bcrypt para senha e JWT Bearer.
- Projetos + membros.
- 3 instâncias configuráveis por projeto.
- Kanban Layout reutilizável com qualquer quantidade/nome de colunas.
- Card Layout reutilizável com campos dinâmicos em JSONB.
- Campo `repeater` para granularidade abaixo da instância 3.
- Boards raiz/filhos.
- Cards dinâmicos (`project_items`).
- Partição física de `project_items` criada automaticamente para cada projeto.
- Soft delete + restore de cards.
- Auditoria `before/after` de alterações.
- Restauração de um card a partir de uma ação anterior.
- Upload de arquivos para disco da VM.
- Swagger em `/api/docs`.
- Linha do tempo global em `GET /api/actions` e por projeto em `GET /api/projects/:id/actions`.

## Rodando localmente com Docker
```bash
cp .env.example .env
# edite DB_PASSWORD e JWT_SECRET
docker compose up -d --build
curl http://localhost:3000/api/health
```

Swagger: `http://localhost:3000/api/docs`

## Instalação simples em uma AWS EC2 (Ubuntu)
1. Crie uma EC2 Ubuntu 24.04/22.04. Para teste, uma `t3.small` é confortável; `t3.micro` pode servir com pouco uso.
2. No Security Group, libere TCP `22` para seu IP e TCP `3000` para quem precisa acessar a API. Mais tarde troque 3000 por Nginx/HTTPS em 80/443.
3. Conecte por SSH.
4. Instale Docker:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```
Saia do SSH e entre novamente para usar Docker sem sudo.

5. Baixe o projeto para a VM (Git ou SCP) e entre na pasta.
6. Configure:
```bash
cp .env.example .env
nano .env
```
Exemplo mínimo:
```env
PORT=3000
CORS_ORIGIN=*
DB_NAME=actrya
DB_USER=actrya
DB_PASSWORD=uma_senha_do_postgres
DB_SSL=false
JWT_SECRET=uma-chave-jwt-bem-grande-e-aleatoria
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=15
```
7. Suba:
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
```
8. Teste da própria VM:
```bash
curl http://localhost:3000/api/health
```
9. Teste externo:
```bash
curl http://IP_PUBLICO_DA_EC2:3000/api/health
```

## Atualizar versão na VM
```bash
git pull
docker compose up -d --build
```
As migrations rodam automaticamente ao iniciar a API.

## Backup rápido do banco
```bash
docker compose exec -T db pg_dump -U actrya actrya > actrya-backup.sql
```

## Primeiras requisições
Veja `docs/REQUESTS.http`. O fluxo é:
1. `POST /api/auth/register`
2. Copiar `accessToken`.
3. Criar layouts, se quiser sair do padrão.
4. `POST /api/projects` — cria projeto, instâncias 1/2/3, partição física e board raiz.
5. `PATCH /api/projects/:id/instances/:level` — define nome e layouts de cada instância.
6. `GET /api/boards/:rootBoardId` — desenha o Kanban de uma só vez.
7. `POST /api/projects/:id/items` — cria cards.
8. `POST /api/projects/:id/items/:itemId/child-board` — entra na próxima instância.
9. `GET /api/projects/:id/actions` — histórico completo.

## Observações do MVP
- Upload usa volume local Docker. Para produção maior, troque por S3 mantendo a tabela `files`.
- JWT de 7 dias é propositalmente simples. Depois podemos adicionar refresh token e revogação.
- Layouts do sistema não podem ser editados; o usuário cria seus próprios layouts.
- Alterar o layout padrão de uma instância afeta novos boards. Boards já existentes guardam seus próprios IDs de layout, o que permite override sem quebrar dados antigos.


## Rotas principais
| Área | Rotas |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH/DELETE /api/auth/me`, `PATCH /api/auth/password` |
| Projetos | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` |
| Instâncias | `PATCH /api/projects/:id/instances/:level` |
| Layout Kanban | `GET/POST /api/layouts/kanbans`, `GET/PUT /api/layouts/kanbans/:id` |
| Layout Card | `GET/POST /api/layouts/cards`, `GET/PUT /api/layouts/cards/:id` |
| Boards | `GET/PATCH /api/boards/:id`, `POST /api/projects/:projectId/items/:itemId/child-board` |
| Cards | `POST /api/projects/:projectId/items`, `GET/PATCH/DELETE /api/projects/:projectId/items/:id` |
| Restauração | `POST .../items/:id/restore`, `POST .../items/:id/restore-action/:actionId` |
| Ações | `GET /api/actions`, `GET /api/projects/:projectId/actions` |
| Arquivos | `POST /api/projects/:projectId/files` (`multipart/form-data`, campo `file`) |

### Regra ao editar layouts
Ao atualizar um Kanban, envie o `id` das colunas que já existem. Assim renomear/reordenar preserva os IDs usados pelos cards. Uma coluna com cards ativos não pode ser excluída até que esses cards sejam movidos. No Card Layout, `fieldKey` é a chave interna e fica imutável depois de criada; o `label`, tipo visual e configurações continuam editáveis.

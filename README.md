# books-up

Aplicação em Spring Boot para registrar jogos, jogadores e reviews, com API REST e interface web.

## Como rodar

Requer Java 21.

```bash
./mvnw spring-boot:run   # Windows: mvnw.cmd spring-boot:run
./mvnw test
```

A interface fica em `http://localhost:8080`. A API responde no mesmo endereço. O console do H2 fica em `/h2-console`
(JDBC URL `jdbc:h2:mem:gamelogdb`, usuário `sa`, senha em branco). O banco é em memória:
os dados são perdidos ao reiniciar.

## Interface

Os arquivos ficam em `src/main/resources/static`, em HTML, CSS e JavaScript puros, sem etapa de build
e sem depender de internet. A fonte TeX Gyre Adventor acompanha o projeto, com a licença em `static/fonts`.

Na interface, cada usuário aparece como jogador e cada review como registro.

- **Registros:** filtra por status, jogador ou texto. Clique em um registro para editar ou excluir.
- **Jogos:** catálogo com a média de notas e a página de cada jogo.
- **Jogadores:** catálogo com os registros, a média e o total por status de cada jogador.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET, POST | `/users` | Lista ou cria usuários |
| GET, PUT, DELETE | `/users/{id}` | Consulta, atualiza ou remove um usuário |
| GET, POST | `/games` | Lista ou cria jogos |
| GET, PUT, DELETE | `/games/{id}` | Consulta, atualiza ou remove um jogo |
| GET, POST | `/reviews` | Lista ou cria reviews |
| GET | `/reviews/user/{userId}` | Reviews de um usuário |
| GET | `/reviews/game/{gameId}` | Reviews de um jogo |
| GET, PUT, DELETE | `/reviews/{id}` | Consulta, atualiza ou remove uma review |

Remover um usuário ou jogo remove também as reviews ligadas a ele.

## Regras

- O e-mail é único e salvo em minúsculas.
- Cada usuário tem no máximo uma review por jogo. Use `PUT /reviews/{id}` para mudar o status ou a nota.
- A nota (`rating`) é opcional e vai de 0 a 10.
- `status` aceita `JOGANDO`, `ZERADO`, `ABANDONADO` ou `PRETENDO_JOGAR`.

## Exemplos

```bash
curl -X POST localhost:8080/users -H 'Content-Type: application/json' \
  -d '{"name":"Ana","email":"ana@example.com","bio":"Fã de RPG"}'

curl -X POST localhost:8080/games -H 'Content-Type: application/json' \
  -d '{"title":"Hollow Knight","genre":"Metroidvania","platform":"PC","releaseYear":2017}'

curl -X POST localhost:8080/reviews -H 'Content-Type: application/json' \
  -d '{"userId":1,"gameId":1,"rating":9.5,"comment":"Excelente","status":"ZERADO","hoursPlayed":40}'
```

## Erros

Todos os erros tratados seguem o mesmo formato:

```json
{
  "timestamp": "2026-11-08T17:30:00",
  "status": 400,
  "error": "Dados inválidos",
  "message": "email: deve ser um e-mail válido; name: é obrigatório",
  "path": "/users"
}
```

| Status | Quando |
|---|---|
| 400 | Campos inválidos, JSON malformado ou parâmetro com tipo errado |
| 404 | Recurso inexistente |
| 409 | E-mail já usado ou review repetida para o mesmo usuário e jogo |

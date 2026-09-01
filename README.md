# Task Health API

Projeto de portfólio/estudo em Node.js que implementa uma API REST pequena para gerenciamento de tarefas e health check operacional.

## O que demonstra

- API HTTP com `node:http`, sem framework ou dependência de runtime.
- Rotas REST para listar, criar, consultar e atualizar tarefas.
- Validação de payload, respostas JSON e códigos HTTP coerentes.
- Testes de integração com `node:test` e `fetch`.
- Dockerfile, documentação OpenAPI e GitHub Actions.

O armazenamento é intencionalmente em memória para manter o projeto didático. Em produção, a camada de store poderia ser substituída por MySQL ou outro banco sem alterar o contrato HTTP.

## Executar

```powershell
npm test
npm start
```

A API inicia em `http://localhost:3000` por padrão.

### Exemplos

```powershell
curl http://localhost:3000/health
curl http://localhost:3000/tasks
curl -X POST http://localhost:3000/tasks `
  -H "content-type: application/json" `
  -d '{"title":"Documentar API","description":"Adicionar exemplos ao README"}'
curl -X PATCH http://localhost:3000/tasks/<id> `
  -H "content-type: application/json" `
  -d '{"completed":true}'
```

O contrato está em [`openapi.yaml`](openapi.yaml).

## Docker

```powershell
docker build -t task-health-api .
docker run --rm -p 3000:3000 task-health-api
```

Este repositório é um projeto independente de portfólio/estudo; não representa um sistema de produção.


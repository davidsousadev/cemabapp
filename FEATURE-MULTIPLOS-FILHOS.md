# Feature: Múltiplos filhos por família

## Contexto
Famílias podem ter mais de um aluno vinculado ao mesmo dispositivo/app.
Atualmente o app suporta apenas um aluno vinculado por dispositivo.

## Impacto na API
- Será necessário adicionar um campo no banco de dados e na API para representar
  a relação família -> múltiplos alunos (ex.: tabela de vínculo N:N ou campo
  `familia_id`/`responsavel_id` agrupando alunos).
- Endpoints de vínculo/desvínculo precisarão aceitar e retornar listas de alunos.
- O token FCM continua sendo do dispositivo, mas o vínculo passa a ser 1:N.

## Impacto nas notificações
- O histórico e as notificações push precisarão ser filtrados/segmentados por aluno,
  ou duplicados para cada aluno vinculado.
- Risco de notificações duplicadas ou atribuídas ao aluno errado se o vínculo
  não for bem definido.
- O armazenamento local (SQLite/localStorage) precisará suportar múltiplos alunos
  e associar cada notificação a um aluno específico.

## Status
Frontend preparado para exibir lista de alunos vinculados. Integração com API
pendente (não implementada nesta etapa).

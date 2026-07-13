# ADR 0003 — Classificação derivada e atualizada ao vivo

**Status:** Aceito  
**Data:** 2026-07-11

## Contexto

A tabela precisa reagir durante as partidas e também permanecer consistente depois de correções. Persistir pontos e estatísticas acumuladas criaria múltiplas fontes de verdade e exigiria sincronização com placares e eventos.

## Decisão

- A classificação será derivada das partidas regulares a cada consulta ou por cache invalidável, nunca mantida como totais editáveis.
- Partidas `PENDING` são ignoradas.
- Partidas `ONGOING` entram provisoriamente usando o placar atual.
- Partidas `COMPLETED` entram de forma consolidada.
- Pontos, vitórias, empates, derrotas e gols derivam do placar autoritativo.
- A ordem usa, nesta sequência, pontos, vitórias, saldo de gols e gols marcados.
- O confronto direto e os gols sofridos isoladamente não são critérios de classificação.
- Cartões derivam dos eventos dos elencos nas partidas regulares.
- Desempates do G4 definem somente a resolução da vaga e não alteram os totais regulares.
- Garantias de classificação e posição são derivadas conservadoramente dos resultados ainda possíveis, sem persistir estado adicional.

## Consequências

### Positivas

- Correções aparecem automaticamente em todas as visualizações.
- Não existe risco de totais armazenados divergirem das partidas.
- A mesma função de domínio pode sustentar interface e testes.

### Negativas

- O cálculo precisa implementar corretamente mini-tabelas e empates compartilhados.
- Consultas podem exigir otimização ou cache no futuro.
- A interface deve distinguir com clareza dados provisórios de consolidados.

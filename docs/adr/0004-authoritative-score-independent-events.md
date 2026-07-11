# ADR 0004 — Placar autoritativo e eventos independentes

**Status:** Aceito  
**Data:** 2026-07-11

## Contexto

O campeonato precisa registrar placar e estatísticas individuais, mas pode haver gol contra, autoria desconhecida ou evento ainda não cadastrado. Assistências também serão informadas separadamente, sem necessidade de reconstruir uma súmula cronológica.

## Decisão

- O placar digitado é a fonte de verdade do resultado e das estatísticas coletivas.
- Eventos de gol, assistência e cartões são ocorrências independentes.
- A quantidade de gols atribuídos não precisa coincidir com o placar.
- Assistências não se vinculam a gols e não possuem limite derivado do placar.
- Eventos não guardam minuto.
- O jogador do evento deve pertencer a um dos dois elencos da partida.
- Pênaltis são placares separados e não produzem eventos individuais.

## Consequências

### Positivas

- O sistema aceita súmulas incompletas e casos como gol contra.
- Cadastro e correção de eventos permanecem simples.
- Resultado coletivo nunca depende da completude das estatísticas individuais.

### Negativas

- Placar e ranking de gols podem divergir legitimamente.
- Não é possível reconstruir a ordem cronológica dos acontecimentos.
- A aplicação não consegue garantir que cada assistência corresponda a um gol específico.

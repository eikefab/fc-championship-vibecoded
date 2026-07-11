# ADR 0002 — Sorteios transacionais e invalidação de fases

**Status:** Aceito  
**Data:** 2026-07-11

## Contexto

Sorteios criam simultaneamente associações, rodadas e várias partidas. Correções retroativas podem trocar classificados ou vencedores e tornar fases posteriores incoerentes. O sistema não terá histórico de versões da chave.

## Decisão

- Sorteios de grupos, quartas e semifinais serão operações transacionais.
- Um sorteio persiste somente seu resultado atual, sem seed aleatório ou histórico.
- Grupos e fases podem ser sorteados novamente apenas antes de qualquer partida afetada receber status, placar ou evento.
- Toda ação de substituição exige confirmação explícita.
- Uma correção que possa mudar a progressão apaga todas as fases dependentes e aplica a correção na mesma transação.
- Depois do reset, as fases aleatórias precisam ser sorteadas novamente; confrontos antigos não são reaproveitados.

## Consequências

### Positivas

- O banco nunca expõe sorteio parcial ou chave esportivamente inconsistente.
- As regras de correção são previsíveis e testáveis.
- Não há necessidade de reconciliar participantes antigos em confrontos posteriores.

### Negativas

- Uma correção tardia pode apagar placares e eventos de várias partidas.
- A confirmação precisa comunicar claramente o impacto antes da operação.
- Sem auditoria, não é possível recuperar automaticamente uma chave anterior.

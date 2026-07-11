# ADR 0001 — Edição única, aplicação confiável e elencos fixos

**Status:** Aceito  
**Data:** 2026-07-11

## Contexto

O projeto organiza um campeonato específico entre dez participantes conhecidos, com 16 jogadores previamente definidos para cada um. A primeira versão precisa concentrar esforço no funcionamento esportivo, não em administração de usuários, temporadas ou cadastros.

## Decisão

- O banco representa uma única edição fixa chamada Campeonato FC.
- Não haverá entidade `Championship` nem seletor de edição.
- A aplicação não terá autenticação ou permissões; quem possui acesso pode consultar e administrar.
- Participantes e jogadores serão carregados pelo seed e apenas consultados pela interface.
- O nome do participante também identifica sua equipe; não haverá identidade de equipe separada.
- Agenda, suspensões e notificações ficam fora do escopo.

## Consequências

### Positivas

- Menor complexidade de modelo, interface e operação.
- Fluxos administrativos diretos para um grupo privado.
- Implementação focada nas regras do campeonato.

### Negativas

- Não há isolamento contra alterações por pessoas com acesso.
- Uma nova edição exigirá evolução explícita do modelo.
- Mudanças de elenco dependem de atualização do seed, migration ou intervenção técnica.

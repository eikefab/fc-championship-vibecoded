# Campeonato FC — Especificação funcional e técnica

**Status:** aprovado para implementação  
**Idioma do produto:** português (pt-BR)  
**Escopo:** primeira e única edição do Campeonato FC

## 1. Objetivo

O Campeonato FC é uma plataforma para organizar um campeonato entre dez participantes, cada um representado por um elenco fixo de jogadores. A aplicação cobre o sorteio dos grupos, a geração automática dos confrontos, o registro ao vivo de placares e eventos, a classificação da fase de grupos, eventuais desempates pela última vaga, os sorteios fase a fase do mata-mata e as lideranças individuais.

O produto é uma aplicação confiável, usada por um grupo privado. Todos que acessam a aplicação podem consultar e administrar o campeonato; não existe autenticação ou separação de permissões na primeira versão.

Este documento é normativo. Em caso de divergência entre exemplos, interface atual ou implementação e as regras abaixo, prevalece este documento, seguido pelos [ADRs](docs/adr/) e pelo [glossário](docs/GLOSSARY.md).

## 2. Estado atual do repositório

### 2.1 Stack

- Next.js 16.2.6 com App Router;
- React 19.2.4;
- TypeScript;
- Prisma 7.8 com PostgreSQL e `@prisma/adapter-pg`;
- Tailwind CSS 4 e componentes shadcn/ui.

### 2.2 Dados existentes

O arquivo `prisma/seed.ts` contém dez participantes fixos e 160 jogadores, exatamente 16 jogadores por participante:

1. Pablo;
2. Davi;
3. Diogo;
4. Daddo;
5. Reinolds;
6. Guilherme;
7. Masio;
8. Eike;
9. Anderson;
10. Guga.

Cada jogador possui nome, clube real no campo `team`, posições e overall. O nome do participante identifica a equipe/elenco participante do campeonato; não existe nome ou escudo separado para essa equipe.

O seed atual executa apenas operações `create`, portanto não é idempotente e duplica os registros quando executado mais de uma vez. A implementação-alvo deve torná-lo idempotente por meio das chaves únicas definidas neste documento, sem apagar grupos, partidas ou eventos já existentes.

### 2.3 Modelo atual e lacunas

O schema atual contém `Participant`, `Player`, `Match`, `MatchParticipant` e `MatchEvent`, além dos enums básicos de tipo, status, fase e evento. Ele ainda não representa:

- Grupo A e Grupo B;
- vínculo de participante com grupo e indicador de cabeça-de-chave;
- cinco rodadas da fase de grupos;
- desempates do corte do G4;
- placar de pênaltis;
- dependência e progressão entre fases;
- restrições de unicidade necessárias ao domínio.

Os campos `Match.startTime` e `Match.endTime` deixam de fazer parte do domínio, pois não haverá agenda. O valor `ROUND_OF_16` também deixa de existir: o mata-mata começa nas quartas de final.

## 3. Escopo

### 3.1 Incluído

- consulta dos participantes e elencos fixos;
- sorteio e eventual novo sorteio dos grupos;
- geração automática das partidas e rodadas dos grupos;
- controle manual do estado das partidas;
- registro e correção de placar e eventos;
- classificação provisória ao vivo e classificação consolidada;
- desempates que decidam a fronteira do G4;
- sorteio livre das quartas e semifinais;
- final automática;
- chave visual do mata-mata;
- Top 5 de gols, assistências, cartões amarelos e cartões vermelhos.

### 3.2 Fora da primeira versão

- autenticação, usuários, papéis e permissões;
- mais de uma edição ou histórico entre campeonatos;
- agenda, data ou horário das partidas;
- criação, edição ou remoção de participantes e jogadores pela interface;
- escalações e minutos jogados;
- suspensões ou elegibilidade disciplinar;
- notificações;
- importação ou exportação;
- trilha de auditoria;
- oitavas de final e disputa de terceiro lugar;
- prorrogação.

## 4. Modelo de domínio

### 4.1 Agregados e entidades

#### Participant

Representa uma pessoa participante e, simultaneamente, a identidade de seu elenco no campeonato. O nome é único. Possui exatamente 16 jogadores no conjunto de dados oficial.

#### Player

Atleta pertencente a exatamente um participante. `team` é o clube real do atleta, não o nome da equipe participante do campeonato. O par `(participantId, name)` é único.

#### Group

Representa um dos dois grupos fixos, identificados por `A` ou `B`. Cada grupo deve conter exatamente cinco participantes depois de um sorteio válido.

#### GroupParticipant

Associação entre participante e grupo. Registra se o participante foi cabeça-de-chave. Um participante aparece em no máximo um grupo e existe exatamente um cabeça-de-chave por grupo.

#### Match

Representa uma partida regular de grupo, uma partida de desempate ou uma partida de mata-mata. Possui exatamente dois participantes, um `HOME` e outro `AWAY`. Esses papéis servem apenas para apresentação e não concedem vantagem esportiva.

#### MatchParticipant

Associação entre partida e participante. Guarda o placar normal e, quando aplicável, o placar da disputa de pênaltis. Placar normal e placar de pênaltis nunca são misturados.

#### MatchEvent

Ocorrência independente de `GOAL`, `ASSIST`, `YELLOW_CARD` ou `RED_CARD`, vinculada a uma partida e a um jogador. Não guarda minuto e não precisa estar vinculada a outro evento.

#### GroupTiebreak

Representa uma série persistida de desempate para resolver somente uma igualdade que atravesse a fronteira entre o quarto e o quinto lugar. Registra grupo, participantes envolvidos, quantidade de vagas em disputa, número da tentativa e estado. Suas partidas são relacionadas explicitamente à série.

### 4.2 Enums-alvo

```text
GroupCode = A | B
MatchType = REGULAR_GROUP | GROUP_TIEBREAK | KNOCKOUT
MatchStatus = PENDING | ONGOING | COMPLETED
KnockoutStage = QUARTER_FINALS | SEMI_FINALS | FINAL
MatchParticipantRole = HOME | AWAY
MatchEventType = GOAL | ASSIST | YELLOW_CARD | RED_CARD
TiebreakStatus = PENDING | ONGOING | COMPLETED
```

### 4.3 Campos estruturais necessários

- `Group`: `id`, `code`, metadados de criação/atualização;
- `GroupParticipant`: `groupId`, `participantId`, `isSeeded`;
- `GroupTiebreak`: `groupId`, `attempt`, `slotsAtStake`, `status`;
- associação entre `GroupTiebreak` e os participantes envolvidos;
- `Match`: `type`, `status`, `groupId?`, `groupTiebreakId?`, `knockoutStage?`, `round?`, `completedAt?`, metadados de criação/atualização;
- `MatchParticipant`: `matchId`, `participantId`, `role`, `score?`, `penaltyScore?`;
- `MatchEvent`: `matchId`, `playerId`, `eventType`.

Não devem existir campos de início ou término agendado. `completedAt` é um metadado do encerramento efetivo, usado para ordenar resultados recentes; não representa agenda nem histórico de alterações.

### 4.4 Restrições e invariantes

- `Group.code` é único;
- `Participant.name` é único;
- `(Player.participantId, Player.name)` é único;
- um participante pertence a no máximo um grupo;
- cada grupo possui cinco participantes e exatamente um cabeça-de-chave após o sorteio;
- cada partida possui exatamente dois participantes distintos;
- `(matchId, participantId)` e `(matchId, role)` são únicos;
- placares são inteiros não negativos;
- `penaltyScore` só é aceito em partida decisiva cujo placar normal esteja empatado;
- uma disputa de pênaltis não pode terminar empatada;
- partida regular de grupo deve possuir grupo e rodada entre 1 e 5;
- partida de desempate deve possuir grupo e `groupTiebreakId`;
- partida de mata-mata deve possuir `knockoutStage` e não possui grupo obrigatório;
- um evento só pode referenciar jogador pertencente a um dos dois participantes da partida;
- partidas `PENDING` têm placares nulos e não possuem eventos;
- iniciar uma partida muda o status para `ONGOING` e inicializa ambos os placares normais em zero;
- completar uma partida exige ambos os placares normais preenchidos;
- completar mata-mata empatado exige placar de pênaltis válido;
- pênaltis não geram eventos de gol ou assistência.

Restrições que o Prisma/PostgreSQL não expressarem integralmente devem ser validadas na camada de domínio dentro da mesma transação da escrita.

## 5. Ciclo do campeonato

### 5.1 Estado inicial

Antes do sorteio existem os dez participantes e seus elencos, mas não existem grupos nem partidas. O dashboard apresenta a ação de selecionar dois cabeças-de-chave distintos.

### 5.2 Sorteio dos grupos

Entrada: exatamente dois IDs distintos de participantes existentes.

Em uma única transação, o sistema deve:

1. validar que existem exatamente dez participantes elegíveis;
2. embaralhar os dois cabeças e atribuir um ao Grupo A e outro ao Grupo B;
3. embaralhar os oito participantes restantes;
4. distribuir quatro restantes para cada grupo;
5. persistir os dois grupos e suas associações;
6. gerar a tabela de turno único de cada grupo pelo método circular;
7. criar cinco rodadas por grupo, com duas partidas e uma folga por participante em cada rodada;
8. garantir que cada par do mesmo grupo se enfrente exatamente uma vez;
9. atribuir `HOME` e `AWAY` sem efeito esportivo;
10. criar as 20 partidas com status `PENDING` e placares nulos.

O sorteio deve usar uma fonte aleatória do servidor e nunca depender da ordem retornada pelo banco. A aplicação persiste apenas o resultado atual, não a sequência aleatória nem um histórico de sorteios.

Se qualquer validação ou escrita falhar, nada do sorteio pode permanecer salvo.

### 5.3 Refazer grupos

É permitido refazer o sorteio somente quando todas as partidas existentes estiverem `PENDING`, com placares nulos e sem eventos. A ação exige confirmação explícita e remove, na mesma transação, as partidas regulares, associações e grupos atuais antes de executar um novo sorteio.

Se qualquer partida estiver `ONGOING` ou `COMPLETED`, ou possuir placar/evento, a operação é rejeitada.

### 5.4 Progressão para o mata-mata

As quartas só podem ser sorteadas quando:

- todas as 20 partidas regulares estiverem `COMPLETED`;
- não existir empate absoluto pendente na fronteira do G4;
- todo desempate necessário estiver concluído;
- existirem exatamente oito classificados, quatro por grupo.

O sorteio das quartas embaralha livremente os oito classificados e agrupa a sequência em quatro pares. Participantes do mesmo grupo podem se enfrentar.

As semifinais só podem ser sorteadas quando as quatro quartas estiverem concluídas e houver exatamente quatro vencedores. Os vencedores são novamente embaralhados e agrupados em dois pares.

Ao concluir as duas semifinais, a aplicação cria automaticamente uma única final com os dois vencedores. Não existe sorteio efetivo da final.

### 5.5 Refazer fase do mata-mata

Quartas ou semifinais podem ser sorteadas novamente somente enquanto todas as partidas daquela fase estiverem `PENDING`, com placares nulos e sem eventos. A ação exige confirmação e substitui a fase inteira em uma transação.

A final não pode ser “ressorteada”, pois sua composição é determinada pelos vencedores das semifinais.

### 5.6 Correções retroativas

Uma partida concluída pode ter placar ou eventos corrigidos. Se a correção puder alterar participantes ou vencedores de fases posteriores já criadas, a interface deve informar exatamente quais fases serão apagadas e pedir confirmação.

Confirmada a operação, uma única transação deve:

1. apagar partidas, placares e eventos de todas as fases dependentes posteriores;
2. aplicar a correção solicitada;
3. recalcular classificação, classificados ou vencedor;
4. deixar o campeonato aguardando os sorteios necessários novamente.

Exemplos:

- corrigir grupo após criar quartas remove quartas, semifinais e final;
- corrigir uma quarta após criar semifinais remove semifinais e final;
- corrigir uma semifinal após criar a final remove a final.

Não se preservam confrontos posteriores potencialmente inconsistentes.

## 6. Partidas, placares e eventos

### 6.1 Fluxo de status

```text
PENDING -> ONGOING -> COMPLETED
```

- `PENDING`: partida ainda não iniciada, sem placar e sem eventos;
- `ONGOING`: placar corrente obrigatório, inicialmente 0–0, com edição livre de placar e eventos;
- `COMPLETED`: resultado consolidado, ainda corrigível conforme as regras de dependência.

Não há transição baseada em relógio. Reabrir uma partida concluída é tratado como correção, com a mesma análise de dependências.

### 6.2 Placar autoritativo

O placar normal digitado é a fonte de verdade para vitória, empate, derrota, pontos, gols marcados e gols sofridos. A contagem de eventos `GOAL` pode divergir do placar para permitir gol contra, autoria desconhecida ou cadastro incompleto.

Salvar um placar não cria nem remove eventos automaticamente. Salvar eventos não altera o placar automaticamente.

### 6.3 Eventos

Cada ocorrência é um registro independente. Para dois gols do mesmo jogador, existem dois eventos `GOAL`. Assistências não são ligadas a gols e não possuem limite derivado do placar.

Uma expulsão decorrente do segundo amarelo deve ser registrada como:

- dois eventos `YELLOW_CARD`;
- um evento `RED_CARD`.

Os três eventos contam em suas respectivas estatísticas. Eventos podem ser adicionados e removidos durante a partida ou em uma correção posterior.

### 6.4 Pênaltis

Em mata-mata e em um desempate decisivo entre exatamente dois participantes, um empate no placar normal vai diretamente aos pênaltis. A aplicação solicita os dois placares da disputa e exige um vencedor.

O resultado exibido mantém a distinção, por exemplo: `2–2 (4–3 nos pênaltis)`. Cobranças da disputa não entram no placar normal e não geram eventos individuais.

## 7. Classificação da fase de grupos

### 7.1 Partidas consideradas

Somente partidas `REGULAR_GROUP` entram nos números da tabela do grupo. Partidas `PENDING` são ignoradas. Partidas `ONGOING` entram provisoriamente usando o placar corrente, inclusive um 0–0 recém-iniciado. Partidas `COMPLETED` entram de forma consolidada.

Partidas de desempate não alteram pontos, vitórias, empates, derrotas, gols ou cartões da tabela regular. Elas determinam somente a ordem necessária ao corte do G4.

### 7.2 Pontuação

- vitória: 3 pontos;
- empate: 1 ponto para cada participante;
- derrota: 0 pontos.

### 7.3 Colunas

A tabela exibe, nesta ordem:

1. posição;
2. participante;
3. pontos;
4. vitórias;
5. empates;
6. derrotas;
7. gols marcados;
8. gols sofridos;
9. cartões amarelos;
10. cartões vermelhos.

Não exibir saldo de gols como coluna ou usá-lo como critério.

### 7.4 Ordem de classificação

Aplicar os critérios na seguinte ordem:

1. maior pontuação global;
2. confronto direto entre os participantes ainda empatados;
3. maior quantidade global de vitórias;
4. maior quantidade global de gols marcados;
5. menor quantidade global de gols sofridos.

No confronto direto, construir uma mini-tabela usando somente as partidas regulares disputadas entre os participantes empatados e comparar, nessa ordem:

1. pontos na mini-tabela;
2. vitórias na mini-tabela;
3. gols marcados na mini-tabela;
4. menos gols sofridos na mini-tabela.

Se a mini-tabela não separar todos, os ainda empatados seguem para os critérios globais 3 a 5; não se reaplica recursivamente uma nova mini-tabela para subconjuntos.

Uma igualdade absoluta que não atravesse o corte entre quarto e quinto não cria desempate. Os participantes compartilham a mesma posição esportiva e são exibidos em ordem alfabética apenas para estabilidade visual. Como o mata-mata é sorteado livremente, a ordem interna dos quatro classificados não produz vantagem.

### 7.5 Desempate do G4

Um desempate é obrigatório somente quando, depois de todos os critérios, participantes permanecem indistinguíveis e essa igualdade deixa incerto quem ocupa uma ou mais vagas entre os quatro classificados.

- Exatamente dois envolvidos: criar uma partida decisiva; empate normal vai aos pênaltis.
- Três ou mais envolvidos: criar turno único entre todos os envolvidos, com pontuação 3/1/0 e os mesmos critérios de mini-tabela.
- Se a fronteira continuar indefinida, criar nova tentativa apenas entre os participantes que continuam empatados.
- Repetir o procedimento; quando restarem exatamente dois, usar partida decisiva com pênaltis.

Se uma igualdade envolver, por exemplo, terceiro, quarto e quinto lugares, `slotsAtStake` será 2 e o desempate deve determinar quais dois avançam.

Na tabela regular, o resultado do desempate aparece como indicação de classificação resolvida, sem incorporar seus números às colunas regulares.

## 8. Rankings individuais

Existem quatro rankings Top 5:

- gols;
- assistências;
- cartões amarelos;
- cartões vermelhos.

Cada ranking:

- conta eventos de partidas regulares, desempates e mata-mata;
- inclui eventos de partidas `ONGOING` e `COMPLETED`;
- ignora partidas `PENDING`;
- não conta cobranças de disputa de pênaltis;
- omite jogadores com contagem zero;
- ordena por maior contagem e, em empate, por nome do jogador em ordem alfabética pt-BR;
- limita a resposta aos cinco primeiros depois da ordenação;
- mostra também o participante ao qual o jogador pertence para desambiguação.

## 9. Experiência e arquitetura de informação

### 9.1 Diretrizes gerais

- interface somente em tema claro;
- layout responsivo;
- textos e rótulos em português;
- ações destrutivas ou de invalidação sempre exigem confirmação;
- erros devem explicar a regra violada e não deixar gravações parciais;
- botões indisponíveis devem permanecer desabilitados com explicação contextual.

### 9.2 Rotas

| Rota                  | Responsabilidade                                            |
| --------------------- | ----------------------------------------------------------- |
| `/`                   | Dashboard de progresso e destaques                          |
| `/grupos`             | Sorteio, tabelas, rodadas, partidas e desempates dos grupos |
| `/mata-mata`          | Sorteios e chave de quartas, semifinais e final             |
| `/participantes/[id]` | Consulta do participante e de seus 16 jogadores             |
| `/partidas/[id]`      | Súmula, status, placar, pênaltis e eventos                  |

### 9.3 Dashboard

Deve apresentar:

- fase atual ou próximo passo necessário;
- quantidade de partidas concluídas, em andamento e pendentes;
- resultados concluídos mais recentes, ordenados por `completedAt` decrescente;
- resumo dos quatro rankings Top 5;
- atalhos para grupos, mata-mata e ação operacional disponível.

Sem grupos sorteados, o principal próximo passo é selecionar os cabeças-de-chave. Com empate pendente no G4, o desempate deve ter prioridade sobre o sorteio das quartas.

### 9.4 Fase de grupos

- mostrar Grupo A e Grupo B em tabelas separadas;
- aplicar fundo azul-claro legível às quatro linhas classificadas;
- indicar que uma classificação é provisória quando houver partida do grupo `ONGOING`;
- organizar os confrontos por rodada, mostrando a folga de cada participante;
- exibir seção separada para desempates do G4 quando existirem;
- oferecer acesso à súmula de cada partida;
- permitir sorteio/novo sorteio apenas conforme as regras de estado.

### 9.5 Mata-mata

A chave usa nós de partida organizados em três colunas: quartas, semifinais e final. Cada nó mostra participantes, placar normal, pênaltis quando houver e status.

Como as fases são sorteadas separadamente, a interface não deve desenhar confrontos futuros fictícios. Colunas ainda não criadas mostram o estado de espera e a condição necessária para o próximo sorteio.

Em telas pequenas, preservar as colunas e permitir rolagem horizontal. A chave deve continuar legível e operável por toque.

### 9.6 Elencos e súmula

A página do participante lista nome do jogador, clube real, posições e overall. Não oferece edição.

Na súmula, os seletores de eventos devem ser limitados aos 32 jogadores dos dois elencos envolvidos e agrupados por participante. A interface deve permitir múltiplos eventos iguais e remoção individual de ocorrências.

## 10. Contratos da camada de aplicação

Os nomes abaixo são conceituais; podem ser implementados como Server Actions ou serviços chamados por Route Handlers, desde que entradas, validações, resultados e atomicidade sejam preservados.

### `drawGroups(seedParticipantIds)`

- recebe exatamente dois IDs distintos;
- rejeita estado incompatível;
- cria grupos, associações, rodadas e 20 partidas atomicamente;
- retorna grupos e partidas criados.

### `redrawGroups(seedParticipantIds, confirmation)`

- exige confirmação explícita;
- valida ausência de dados nas partidas atuais;
- substitui todo o sorteio atomicamente.

### `startMatch(matchId)`

- exige partida `PENDING`;
- define status `ONGOING` e placares 0–0;
- não altera outras partidas.

### `updateMatchScore(matchId, homeScore, awayScore, penalties?)`

- aceita inteiros não negativos em partida `ONGOING` ou numa correção confirmada;
- valida pênaltis apenas quando aplicáveis;
- não modifica eventos.

### `addMatchEvent(matchId, playerId, eventType)` / `removeMatchEvent(eventId)`

- valida status e vínculo do jogador com um participante da partida;
- altera uma única ocorrência;
- não modifica o placar.

### `completeMatch(matchId, confirmation?)`

- valida placares e eventual vencedor nos pênaltis;
- define `COMPLETED` e `completedAt`;
- cria automaticamente a final ao completar a segunda semifinal;
- antes de uma correção, informa e exige confirmação para apagar dependências.

### `calculateGroupStandings(groupId)`

- deriva a tabela a partir de partidas regulares `ONGOING` e `COMPLETED`;
- aplica critérios e resoluções de desempate;
- retorna posição, estatísticas, indicação provisória, classificação e pendência de desempate.

### `calculateLeaderboards()`

- agrega eventos válidos de todo o torneio;
- retorna quatro listas limitadas a cinco jogadores.

### `createGroupTiebreak(groupId)`

- só opera depois de concluir as partidas regulares;
- detecta automaticamente envolvidos e vagas em disputa;
- cria a série e suas partidas atomicamente;
- rejeita chamada sem empate absoluto no corte.

### `drawKnockoutStage(stage)`

- aceita somente `QUARTER_FINALS` ou `SEMI_FINALS`;
- valida conclusão da fase precedente e quantidade exata de elegíveis;
- embaralha e cria todos os jogos da fase atomicamente.

### `redrawKnockoutStage(stage, confirmation)`

- exige confirmação e fase ainda sem dados;
- substitui todos os jogos daquela fase.

### `correctMatch(matchId, changes, downstreamResetConfirmation)`

- calcula dependências antes de gravar;
- exige confirmação quando houver reset;
- apaga fases posteriores e aplica a correção na mesma transação.

Todos os contratos de mutação devem devolver erros de domínio tipados ou discrimináveis, suficientes para a interface distinguir validação, conflito de estado e necessidade de confirmação.

## 11. Seed e evolução do banco

- tornar o seed idempotente usando `Participant.name` e `(participantId, Player.name)` como chaves naturais de bootstrap;
- reexecutar o seed deve atualizar os dados fixos de participantes/jogadores ou mantê-los, sem criar duplicatas;
- o seed não pode apagar grupos, partidas, eventos ou resultados;
- criar migration para o modelo-alvo em vez de alterar migrations já aplicadas;
- remover `startTime`, `endTime` e `ROUND_OF_16` na nova migration;
- preservar participantes e jogadores existentes durante a evolução;
- gerar novamente o Prisma Client depois da migration.

## 12. Critérios de aceite

### Dados e sorteio

- [ ] O bootstrap resulta em dez participantes e 160 jogadores, sem duplicação após uma segunda execução.
- [ ] Cada participante possui 16 jogadores.
- [ ] O sorteio exige dois cabeças distintos e coloca exatamente um em cada grupo.
- [ ] Cada grupo contém cinco participantes.
- [ ] Cada grupo possui cinco rodadas, dez partidas e uma folga por participante em cada rodada.
- [ ] Cada par do mesmo grupo se enfrenta exatamente uma vez.
- [ ] O sorteio cria 20 partidas `PENDING`, sem placar e sem data.
- [ ] Falha intermediária reverte o sorteio inteiro.

### Partidas e eventos

- [ ] Iniciar uma partida produz status `ONGOING` e placar 0–0.
- [ ] A classificação reage imediatamente à alteração do placar em andamento.
- [ ] Placar e quantidade de gols atribuídos podem divergir.
- [ ] Evento com jogador de outro elenco é rejeitado.
- [ ] Segundo amarelo e expulsão podem registrar dois amarelos e um vermelho.
- [ ] Partida eliminatória empatada não pode ser concluída sem pênaltis; os pênaltis precisam indicar vencedor.
- [ ] Pênaltis não alteram placar normal nem rankings individuais.

### Classificação e desempate

- [ ] Aplicam-se pontos, confronto direto, vitórias, gols marcados e gols sofridos exatamente nessa ordem.
- [ ] O confronto direto de três ou mais participantes usa a mini-tabela completa definida neste documento.
- [ ] Saldo de gols nunca interfere na ordem.
- [ ] Partidas em andamento entram provisoriamente; partidas pendentes não entram.
- [ ] Empate absoluto fora do corte compartilha posição e não cria partida extra.
- [ ] Empate absoluto no corte cria partida decisiva para dois ou turno único para três ou mais.
- [ ] Números do desempate não contaminam a tabela regular.

### Mata-mata e correções

- [ ] Quartas possuem quatro jogos, semifinais dois e final um.
- [ ] Não existem oitavas nem terceiro lugar.
- [ ] Quartas e semifinais aceitam qualquer pareamento, inclusive adversários do mesmo grupo.
- [ ] A final é criada automaticamente ao concluir a segunda semifinal.
- [ ] Novo sorteio só é permitido antes de a fase receber dados.
- [ ] Correção retroativa remove todas as fases dependentes após confirmação.

### Interface e rankings

- [ ] As quatro primeiras linhas de cada grupo têm fundo azul-claro legível.
- [ ] A tabela mostra todas as dez colunas especificadas e não mostra saldo de gols.
- [ ] Os quatro rankings exibem no máximo cinco jogadores, incluem todo o torneio e desempataram visualmente por nome.
- [ ] O elenco exibe jogador, clube real, posições e overall.
- [ ] A chave apresenta somente fases já criadas e usa rolagem horizontal no celular.
- [ ] Dashboard e rotas funcionam em tema claro e português.

## 13. Decisões relacionadas

- [ADR 0001 — Edição única, aplicação confiável e elencos fixos](docs/adr/0001-single-edition-trusted-application.md)
- [ADR 0002 — Sorteios transacionais e invalidação de fases](docs/adr/0002-transactional-draws-and-phase-invalidation.md)
- [ADR 0003 — Classificação derivada e atualizada ao vivo](docs/adr/0003-derived-live-standings.md)
- [ADR 0004 — Placar autoritativo e eventos independentes](docs/adr/0004-authoritative-score-independent-events.md)
- [ADR 0005 — Desempate do G4 e mata-mata fase a fase](docs/adr/0005-g4-tiebreak-and-phase-draws.md)

# Glossário do Campeonato FC

Este glossário define a linguagem oficial do projeto. Código, interface, testes e documentação devem usar estes termos de forma consistente.

## Cabeça-de-chave

Participante escolhido manualmente antes do sorteio para ser separado do outro cabeça-de-chave. O sistema sorteia qual cabeça fica no Grupo A e qual fica no Grupo B. Há exatamente um por grupo.

## Campeonato FC

Nome fixo da edição única administrada pela plataforma. Não é uma entidade configurável no banco nesta versão.

## Classificação consolidada

Tabela calculada quando não há partidas regulares em andamento. Pode ainda depender de um desempate do G4 se todos os critérios esportivos tiverem terminado iguais na fronteira de classificação.

## Classificação provisória

Tabela que incorpora placares correntes de uma ou mais partidas `ONGOING`. Pode mudar até que essas partidas sejam concluídas ou corrigidas.

## Clube real

Clube de futebol ao qual um jogador está associado nos dados de origem, armazenado em `Player.team`, como Arsenal ou Napoli. Não representa a equipe do participante no Campeonato FC.

## Confronto direto

Segundo critério da classificação. Compara uma mini-tabela formada somente pelas partidas regulares entre os participantes empatados, usando pontos, vitórias, gols marcados e menos gols sofridos.

## Desempate do G4

Série adicional criada exclusivamente quando uma igualdade absoluta atravessa a fronteira entre quarto e quinto lugares. Seus resultados decidem a vaga, mas não alteram os números da tabela regular.

## Disputa de pênaltis

Mecanismo usado para determinar vencedor após empate no placar normal de uma partida decisiva. O placar da disputa é armazenado separadamente; cobranças não contam como gols ou eventos individuais.

## Equipe ou elenco

Conjunto dos 16 jogadores pertencentes a um participante. A identidade da equipe é o nome do próprio participante; não há nome ou escudo separado.

## Evento

Ocorrência independente vinculada a uma partida e a um jogador: gol, assistência, cartão amarelo ou cartão vermelho. Não possui minuto e não precisa se vincular a outro evento.

## Fase

Etapa competitiva: fase de grupos, quartas de final, semifinais ou final. Um desempate do G4 é uma série auxiliar da fase de grupos, não uma fase do mata-mata.

## G4 ou zona de classificação

As quatro primeiras posições de cada grupo que avançam às quartas. Na interface, essas linhas recebem fundo azul-claro.

## Grupo

Uma das duas divisões fixas da fase inicial, Grupo A ou Grupo B, com cinco participantes e um cabeça-de-chave.

## Jogador

Atleta do elenco de um participante. Pode receber eventos em partidas disputadas por seu participante. Não deve ser confundido com participante.

## Mandante e visitante

Papéis `HOME` e `AWAY` usados para ordenar e apresentar os dois participantes de uma partida. Não produzem vantagem esportiva.

## Mata-mata

Etapa eliminatória composta por quartas, semifinais e final. Quartas e semifinais são sorteadas livremente quando a fase anterior termina; a final é criada automaticamente.

## Mini-tabela

Recálculo restrito às partidas entre participantes empatados. É usado no confronto direto e em turnos com três ou mais participantes num desempate do G4.

## Partida decisiva

Partida que precisa produzir vencedor. Inclui mata-mata e desempate entre exatamente dois participantes. Empate no placar normal vai diretamente aos pênaltis.

## Partida pendente

Partida `PENDING`, ainda não iniciada, com placares nulos e sem eventos. Não entra em tabelas ou rankings.

## Partida regular

Partida de turno único entre dois integrantes do mesmo grupo. Conta integralmente para pontos, vitórias, empates, derrotas, gols e cartões da tabela do grupo.

## Participante

Pessoa inscrita no campeonato e controladora de um elenco. Pablo, Davi e Eike são exemplos. O participante é a identidade exibida nas tabelas e partidas.

## Placar normal

Quantidade de gols digitada para cada participante, sem incluir disputa de pênaltis. É a fonte de verdade para resultado, pontos, gols marcados e gols sofridos, mesmo que divirja dos eventos de gol.

## Ranking individual

Lista Top 5 de jogadores para gols, assistências, amarelos ou vermelhos, agregando eventos da fase de grupos, desempates e mata-mata.

## Rodada

Uma das cinco divisões da tabela de turno único de um grupo. Cada rodada contém duas partidas e deixa um dos cinco participantes de folga.

## Súmula

Visualização e formulário de uma partida, contendo participantes, status, placar normal, pênaltis quando aplicáveis e eventos.

## Turno único

Formato no qual cada par de participantes de um conjunto se enfrenta exatamente uma vez.

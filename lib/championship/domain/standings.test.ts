import assert from "node:assert/strict"
import test from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { StandingsTable } from "../../../components/championship/standings-table"
import { calculateStandingsWithTiebreak } from "./standings"
import type { MatchDto, MatchStatus, ParticipantDto } from "./types"

const participants: ParticipantDto[] = [
  { id: "a", name: "Alfa" },
  { id: "b", name: "Bravo" },
  { id: "c", name: "Charlie" },
  { id: "d", name: "Delta" },
  { id: "e", name: "Eco" },
]

function match(
  id: string,
  homeParticipantId: string,
  awayParticipantId: string,
  homeScore: number | null,
  awayScore: number | null,
  status: MatchStatus
): MatchDto {
  const home = participants.find(
    (participant) => participant.id === homeParticipantId
  )!
  const away = participants.find(
    (participant) => participant.id === awayParticipantId
  )!

  return {
    id,
    type: "REGULAR_GROUP",
    status,
    groupCode: "A",
    round: 1,
    knockoutStage: null,
    completedAt: status === "COMPLETED" ? "2026-07-12T12:00:00.000Z" : null,
    sides: [
      {
        participantId: home.id,
        participantName: home.name,
        role: "HOME",
        score: homeScore,
        penaltyScore: null,
      },
      {
        participantId: away.id,
        participantName: away.name,
        role: "AWAY",
        score: awayScore,
        penaltyScore: null,
      },
    ],
    events: [],
  }
}

test("uses an ongoing score in every provisional standing total", () => {
  const standings = calculateStandingsWithTiebreak(participants, [
    match("live", "a", "b", 0, 0, "ONGOING"),
  ])

  const alfa = standings.find((entry) => entry.participantId === "a")!
  const bravo = standings.find((entry) => entry.participantId === "b")!
  const charlie = standings.find((entry) => entry.participantId === "c")!

  assert.deepEqual(
    {
      points: alfa.points,
      matchesPlayed: alfa.matchesPlayed,
      draws: alfa.draws,
      goalDifference: alfa.goalDifference,
      isLive: alfa.isLive,
    },
    { points: 1, matchesPlayed: 1, draws: 1, goalDifference: 0, isLive: true }
  )
  assert.equal(bravo.isLive, true)
  assert.equal(charlie.isLive, false)
  assert.equal(charlie.matchesPlayed, 0)
})

test("places an unplayed participant ahead of a live participant with negative goal difference", () => {
  const standings = calculateStandingsWithTiebreak(participants, [
    match("live", "a", "b", 2, 0, "ONGOING"),
  ])

  const bravo = standings.find((entry) => entry.participantId === "b")!
  const charlie = standings.find((entry) => entry.participantId === "c")!

  assert.equal(bravo.points, 0)
  assert.equal(bravo.goalDifference, -2)
  assert.equal(charlie.goalDifference, 0)
  assert.ok(charlie.position < bravo.position)
})

test("orders equal points and wins by goal difference", () => {
  const standings = calculateStandingsWithTiebreak(participants, [
    match("a-e", "a", "e", 1, 0, "COMPLETED"),
    match("a-d", "a", "d", 1, 0, "COMPLETED"),
    match("b-e", "b", "e", 3, 0, "COMPLETED"),
    match("b-d", "b", "d", 1, 0, "COMPLETED"),
  ])

  assert.deepEqual(
    standings.slice(0, 2).map((entry) => entry.participantId),
    ["b", "a"]
  )
})

test("uses wins and then goals scored after points and goal difference", () => {
  const byWins = calculateStandingsWithTiebreak(participants, [
    match("a-e", "a", "e", 1, 0, "COMPLETED"),
    match("b-c", "b", "c", 0, 0, "COMPLETED"),
    match("b-d", "b", "d", 0, 0, "COMPLETED"),
    match("b-e", "b", "e", 0, 0, "COMPLETED"),
  ])
  assert.ok(
    byWins.find((entry) => entry.participantId === "a")!.position <
      byWins.find((entry) => entry.participantId === "b")!.position
  )

  const byGoalsScored = calculateStandingsWithTiebreak(participants, [
    match("c-e", "c", "e", 3, 2, "COMPLETED"),
    match("d-a", "d", "a", 2, 1, "COMPLETED"),
  ])
  assert.ok(
    byGoalsScored.find((entry) => entry.participantId === "c")!.position <
      byGoalsScored.find((entry) => entry.participantId === "d")!.position
  )
})

test("ignores pending matches and uses names for stable absolute ties", () => {
  const standings = calculateStandingsWithTiebreak(participants, [
    match("pending", "a", "b", null, null, "PENDING"),
  ])

  assert.deepEqual(
    standings.map((entry) => entry.participantName),
    ["Alfa", "Bravo", "Charlie", "Delta", "Eco"]
  )
  assert.ok(
    standings.every((entry) => entry.matchesPlayed === 0 && !entry.isLive)
  )
  assert.ok(standings.every((entry) => !entry.requiresTiebreak))
})

test("renders played matches after points and a live badge beside the participant", () => {
  const standings = calculateStandingsWithTiebreak(participants, [
    match("live", "a", "b", 1, 0, "ONGOING"),
  ])
  const markup = renderToStaticMarkup(
    createElement(StandingsTable, { standings })
  )

  assert.ok(markup.indexOf(">P</th>") < markup.indexOf(">J</th>"))
  assert.ok(markup.indexOf(">GC</th>") < markup.indexOf(">SG</th>"))
  assert.ok(markup.indexOf(">SG</th>") < markup.indexOf(">CA</th>"))
  assert.match(markup, /Alfa.*AO VIVO/)
})

test("distinguishes guaranteed qualification from an exact guaranteed position", () => {
  const matches = [
    match("a-b", "a", "b", 1, 0, "COMPLETED"),
    match("a-c", "a", "c", 1, 0, "COMPLETED"),
    match("a-d", "a", "d", 1, 0, "COMPLETED"),
    match("a-e", "a", "e", 1, 0, "COMPLETED"),
    match("b-c", "b", "c", null, null, "PENDING"),
    match("b-d", "b", "d", 1, 0, "COMPLETED"),
    match("b-e", "b", "e", 1, 0, "COMPLETED"),
    match("c-d", "c", "d", 1, 0, "COMPLETED"),
    match("c-e", "c", "e", 1, 0, "COMPLETED"),
    match("d-e", "d", "e", 1, 0, "COMPLETED"),
  ]

  const standings = calculateStandingsWithTiebreak(participants, matches)
  const alfa = standings.find((entry) => entry.participantId === "a")!
  const bravo = standings.find((entry) => entry.participantId === "b")!

  assert.deepEqual(
    {
      qualificationGuaranteed: alfa.qualificationGuaranteed,
      positionGuaranteed: alfa.positionGuaranteed,
    },
    { qualificationGuaranteed: true, positionGuaranteed: true }
  )
  assert.deepEqual(
    {
      qualificationGuaranteed: bravo.qualificationGuaranteed,
      positionGuaranteed: bravo.positionGuaranteed,
    },
    { qualificationGuaranteed: true, positionGuaranteed: false }
  )

  const markup = renderToStaticMarkup(
    createElement(StandingsTable, { standings })
  )
  assert.match(markup, /bg-amber-100\/80/)
  assert.match(markup, /bg-emerald-100\/80/)
})

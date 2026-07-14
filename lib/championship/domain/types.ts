export type GroupCode = "A" | "B"

export type MatchType = "REGULAR_GROUP" | "GROUP_TIEBREAK" | "KNOCKOUT"

export type MatchStatus = "PENDING" | "ONGOING" | "COMPLETED"

export type KnockoutStage = "QUARTER_FINALS" | "SEMI_FINALS" | "FINAL"

export type MatchEventType = "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD"

export type ParticipantRole = "HOME" | "AWAY"

export type TiebreakStatus = "PENDING" | "ONGOING" | "COMPLETED"

export interface ParticipantDto {
  id: string
  name: string
}

export interface PlayerDto {
  id: string
  name: string
  team: string
  positions: string[]
  overall: number
  participantId: string
  participantName: string
}

export interface MatchSideDto {
  participantId: string
  participantName: string
  role: ParticipantRole
  score: number | null
  penaltyScore: number | null
}

export interface MatchEventDto {
  id: string
  matchId: string
  playerId: string
  playerName: string
  participantId: string
  eventType: MatchEventType
}

export interface MatchDto {
  id: string
  type: MatchType
  status: MatchStatus
  groupCode: GroupCode | null
  round: number | null
  knockoutStage: KnockoutStage | null
  walkoverWinnerId: string | null
  completedAt: string | null
  sides: MatchSideDto[]
  events: MatchEventDto[]
}

export interface StandingEntryDto {
  position: number
  participantId: string
  participantName: string
  points: number
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  walkoverLosses: number
  goalsScored: number
  goalsConceded: number
  goalDifference: number
  yellowCards: number
  redCards: number
  provisional: boolean
  isLive: boolean
  qualified: boolean
  qualificationGuaranteed: boolean
  positionGuaranteed: boolean
  requiresTiebreak: boolean
}

export interface TiebreakInputMatchDto {
  id: string
  type: MatchType
  status: MatchStatus
  round: number | null
  walkoverWinnerId: string | null
  sides: MatchSideDto[]
}

export interface TiebreakInputDto {
  groupCode: GroupCode
  matches: TiebreakInputMatchDto[]
}

export type TiebreakDecisionNone = {
  kind: "none"
}

export type TiebreakDecisionMatch = {
  kind: "decisive_match"
  participants: ParticipantDto[]
  slotsAtStake: number
}

export type TiebreakDecisionSeries = {
  kind: "series"
  participants: ParticipantDto[]
  slotsAtStake: number
  rounds: ParticipantDto[][][]
}

export type TiebreakDecision =
  TiebreakDecisionNone | TiebreakDecisionMatch | TiebreakDecisionSeries

export interface TiebreakResolutionDto {
  qualifiedIds: string[]
  requiresAnother: boolean
  remainingTied: ParticipantDto[]
}

export interface TiebreakStandingEntryDto {
  position: number
  participantId: string
  participantName: string
  points: number
  wins: number
  draws: number
  losses: number
  walkoverLosses: number
  goalsScored: number
  goalsConceded: number
}

export interface LeaderboardEntryDto {
  playerId: string
  playerName: string
  participantId: string
  participantName: string
  count: number
}

export interface LeaderboardsDto {
  goals: LeaderboardEntryDto[]
  assists: LeaderboardEntryDto[]
  yellowCards: LeaderboardEntryDto[]
  redCards: LeaderboardEntryDto[]
}

export interface KnockoutMatchDto {
  id: string
  status: MatchStatus
  knockoutStage: KnockoutStage
  sides: MatchSideDto[]
}

export interface KnockoutPairDto {
  matchId: string
  homeParticipantId: string
  awayParticipantId: string
}

export interface KnockoutNodeDto {
  matchId: string
  stage: KnockoutStage
  status: MatchStatus
  homeParticipantId: string | null
  homeParticipantName: string | null
  awayParticipantId: string | null
  awayParticipantName: string | null
  homeScore: number | null
  awayScore: number | null
  homePenaltyScore: number | null
  awayPenaltyScore: number | null
  walkoverWinnerId: string | null
  winnerId: string | null
}

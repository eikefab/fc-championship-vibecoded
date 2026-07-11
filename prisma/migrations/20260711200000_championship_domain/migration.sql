-- Safety check: abort if competitive data exists
DO $$
DECLARE
  match_count INT;
  mp_count INT;
  event_count INT;
BEGIN
  SELECT COUNT(*) INTO match_count FROM "Match";
  SELECT COUNT(*) INTO mp_count FROM "MatchParticipant";
  SELECT COUNT(*) INTO event_count FROM "MatchEvent";

  IF match_count > 0 OR mp_count > 0 OR event_count > 0 THEN
    RAISE EXCEPTION 'Migration aborted: Match (%), MatchParticipant (%), MatchEvent (%) must be empty before domain model upgrade',
      match_count, mp_count, event_count;
  END IF;
END $$;

-- Verify no duplicate participant names or (participantId, name) pairs
DO $$
DECLARE
  dup_count INT;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT name FROM "Participant" GROUP BY name HAVING COUNT(*) > 1
  ) sub;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Migration aborted: duplicate participant names exist';
  END IF;

  SELECT COUNT(*) INTO dup_count FROM (
    SELECT "participantId", name FROM "Player" GROUP BY "participantId", name HAVING COUNT(*) > 1
  ) sub;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Migration aborted: duplicate (participantId, name) pairs exist';
  END IF;
END $$;

-- Drop child tables (all must be empty per preflight)
DROP TABLE "MatchEvent";
DROP TABLE "MatchParticipant";
DROP TABLE "Match";

-- Drop enums that changed
DROP TYPE "MatchKnockoutStage";
DROP TYPE "MatchType";
DROP TYPE "MatchStatus";

-- Create new enums
CREATE TYPE "GroupCode" AS ENUM ('A', 'B');
CREATE TYPE "MatchType" AS ENUM ('REGULAR_GROUP', 'GROUP_TIEBREAK', 'KNOCKOUT');
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ONGOING', 'COMPLETED');
CREATE TYPE "MatchKnockoutStage" AS ENUM ('QUARTER_FINALS', 'SEMI_FINALS', 'FINAL');
CREATE TYPE "TiebreakStatus" AS ENUM ('PENDING', 'ONGOING', 'COMPLETED');

-- Add uniqueness constraints on Participant and Player
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_name_key" UNIQUE ("name");
ALTER TABLE "Player" ADD CONSTRAINT "Player_participantId_name_key" UNIQUE ("participantId", "name");

-- Create Group table
CREATE TABLE "Group" (
  "id" TEXT NOT NULL,
  "code" "GroupCode" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- Create GroupParticipant table
CREATE TABLE "GroupParticipant" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "isSeeded" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "GroupParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroupParticipant_participantId_key" ON "GroupParticipant"("participantId");
CREATE UNIQUE INDEX "GroupParticipant_groupId_participantId_key" ON "GroupParticipant"("groupId", "participantId");
-- Partial unique index: at most one seed per group
CREATE UNIQUE INDEX "GroupParticipant_groupId_isSeeded_key" ON "GroupParticipant"("groupId", "isSeeded") WHERE "isSeeded" = true;

-- Create GroupTiebreak table
CREATE TABLE "GroupTiebreak" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL,
  "slotsAtStake" INTEGER NOT NULL,
  "status" "TiebreakStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GroupTiebreak_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroupTiebreak_groupId_attempt_key" ON "GroupTiebreak"("groupId", "attempt");

-- Create GroupTiebreakParticipant table
CREATE TABLE "GroupTiebreakParticipant" (
  "id" TEXT NOT NULL,
  "groupTiebreakId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "resolvedPosition" INTEGER,
  CONSTRAINT "GroupTiebreakParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroupTiebreakParticipant_groupTiebreakId_participantId_key" ON "GroupTiebreakParticipant"("groupTiebreakId", "participantId");

-- Create Match table with new domain columns
CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "type" "MatchType" NOT NULL,
  "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
  "knockoutStage" "MatchKnockoutStage",
  "round" INTEGER,
  "groupId" TEXT,
  "groupTiebreakId" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Match_type_status_idx" ON "Match"("type", "status");
CREATE INDEX "Match_groupId_round_idx" ON "Match"("groupId", "round");
CREATE INDEX "Match_knockoutStage_status_idx" ON "Match"("knockoutStage", "status");

-- Create MatchParticipant table with penaltyScore
CREATE TABLE "MatchParticipant" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "role" "MatchParticipantRole" NOT NULL,
  "score" INTEGER,
  "penaltyScore" INTEGER,
  CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MatchParticipant_matchId_participantId_key" ON "MatchParticipant"("matchId", "participantId");
CREATE UNIQUE INDEX "MatchParticipant_matchId_role_key" ON "MatchParticipant"("matchId", "role");
CREATE INDEX "MatchParticipant_participantId_idx" ON "MatchParticipant"("participantId");

-- Create MatchEvent table
CREATE TABLE "MatchEvent" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "eventType" "MatchEventType" NOT NULL,
  CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MatchEvent_matchId_eventType_idx" ON "MatchEvent"("matchId", "eventType");
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");

-- Foreign Keys

-- GroupParticipant
ALTER TABLE "GroupParticipant" ADD CONSTRAINT "GroupParticipant_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupParticipant" ADD CONSTRAINT "GroupParticipant_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- GroupTiebreak
ALTER TABLE "GroupTiebreak" ADD CONSTRAINT "GroupTiebreak_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GroupTiebreakParticipant
ALTER TABLE "GroupTiebreakParticipant" ADD CONSTRAINT "GroupTiebreakParticipant_groupTiebreakId_fkey"
  FOREIGN KEY ("groupTiebreakId") REFERENCES "GroupTiebreak"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupTiebreakParticipant" ADD CONSTRAINT "GroupTiebreakParticipant_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Match
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupTiebreakId_fkey"
  FOREIGN KEY ("groupTiebreakId") REFERENCES "GroupTiebreak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MatchParticipant
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MatchEvent
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data integrity checks
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_score_check"
  CHECK ("score" IS NULL OR "score" >= 0);
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_penaltyScore_check"
  CHECK ("penaltyScore" IS NULL OR "penaltyScore" >= 0);
ALTER TABLE "Match" ADD CONSTRAINT "Match_round_check"
  CHECK ("round" IS NULL OR ("round" >= 1 AND "round" <= 5));
ALTER TABLE "Match" ADD CONSTRAINT "Match_type_consistency_check"
  CHECK (
    ("type" = 'REGULAR_GROUP' AND "groupId" IS NOT NULL AND "groupTiebreakId" IS NULL AND "knockoutStage" IS NULL) OR
    ("type" = 'GROUP_TIEBREAK' AND "groupTiebreakId" IS NOT NULL AND "knockoutStage" IS NULL) OR
    ("type" = 'KNOCKOUT' AND "groupId" IS NULL AND "groupTiebreakId" IS NULL AND "knockoutStage" IS NOT NULL)
  );

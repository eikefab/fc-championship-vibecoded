/*
  Warnings:

  - Made the column `startTime` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MatchKnockoutStage" AS ENUM ('ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "knockoutStage" "MatchKnockoutStage",
ALTER COLUMN "startTime" SET NOT NULL;

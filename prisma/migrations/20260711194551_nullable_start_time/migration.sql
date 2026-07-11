/*
  Warnings:

  - You are about to drop the column `eventTime` on the `MatchEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "startTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MatchEvent" DROP COLUMN "eventTime";

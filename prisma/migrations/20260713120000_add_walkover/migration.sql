ALTER TABLE "Match" ADD COLUMN "walkoverWinnerId" TEXT;

CREATE INDEX "Match_walkoverWinnerId_idx" ON "Match"("walkoverWinnerId");

ALTER TABLE "Match" ADD CONSTRAINT "Match_walkoverWinnerId_fkey"
  FOREIGN KEY ("walkoverWinnerId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

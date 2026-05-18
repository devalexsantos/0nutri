-- CreateTable
CREATE TABLE "AiCoachReport" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "periodStart" DATE,
    "periodEnd" DATE,
    "inputSnapshot" JSONB NOT NULL,
    "outputJson" JSONB NOT NULL,
    "summary" TEXT,
    "model" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCoachReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCoachReport_personaId_type_createdAt_idx" ON "AiCoachReport"("personaId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "AiCoachReport" ADD CONSTRAINT "AiCoachReport_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

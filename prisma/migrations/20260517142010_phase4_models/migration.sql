-- CreateTable
CREATE TABLE "FreeMeal" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "impact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPrep" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "portions" INTEGER NOT NULL DEFAULT 5,
    "protein" TEXT,
    "carb" TEXT,
    "vegetables" TEXT,
    "notes" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPrep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "category" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreeMeal_personaId_date_idx" ON "FreeMeal"("personaId", "date");

-- CreateIndex
CREATE INDEX "MealPrep_personaId_weekStartDate_idx" ON "MealPrep"("personaId", "weekStartDate");

-- CreateIndex
CREATE INDEX "ShoppingItem_personaId_idx" ON "ShoppingItem"("personaId");

-- AddForeignKey
ALTER TABLE "FreeMeal" ADD CONSTRAINT "FreeMeal_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPrep" ADD CONSTRAINT "MealPrep_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "countryTaxId" TEXT,
ADD COLUMN     "taxName" TEXT DEFAULT 'ITBMS';

-- CreateTable
CREATE TABLE "CountryTax" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "taxName" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryTax_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CountryTax_country_key" ON "CountryTax"("country");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_countryTaxId_fkey" FOREIGN KEY ("countryTaxId") REFERENCES "CountryTax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

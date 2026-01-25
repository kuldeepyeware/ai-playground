-- CreateIndex
CREATE INDEX "Response_provider_idx" ON "Response"("provider");

-- CreateIndex
CREATE INDEX "Response_promptId_provider_idx" ON "Response"("promptId", "provider");

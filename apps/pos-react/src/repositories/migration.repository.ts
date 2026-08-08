import {
  MigrationService,
  type ImportV1Input,
  type MigrationProgressEvent,
  type MigrationSummary,
} from "@/services/migration.service";

export const MigrationRepository = {
  async importV1(
    input: ImportV1Input,
    onProgress?: (progress: MigrationProgressEvent) => void,
  ): Promise<MigrationSummary> {
    return MigrationService.importV1(input, onProgress);
  },
};

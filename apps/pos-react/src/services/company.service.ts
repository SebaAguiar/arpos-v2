import { apiClient } from "./api-client";
import type { Company, UpdateCompanyInput } from "@/lib/types";

export const CompanyService = {
  async getCompany(): Promise<Company> {
    return apiClient.get<Company>("/api/company");
  },

  async updateCompany(input: UpdateCompanyInput): Promise<Company> {
    return apiClient.patch<Company>("/api/company", input);
  },
};

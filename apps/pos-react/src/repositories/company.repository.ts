import { CompanyService } from "@/services/company.service";
import type { Company, UpdateCompanyInput } from "@/lib/types";

export const CompanyRepository = {
  async getCompany(): Promise<Company> {
    const data = await CompanyService.getCompany();
    return {
      id: data.id,
      name: data.name,
      taxId: data.taxId,
      address: data.address ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async updateCompany(input: UpdateCompanyInput): Promise<Company> {
    const data = await CompanyService.updateCompany(input);
    return {
      id: data.id,
      name: data.name,
      taxId: data.taxId,
      address: data.address ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },
};

import {
  SetupService,
  type InitCompanyInput,
} from "../services/setup.service";

export interface SetupStatus {
  isInitialized: boolean;
}

export interface InitResult {
  companyId: string;
  storeId: string;
  userId: string;
}

export const SetupRepository = {
  async getStatus(): Promise<SetupStatus> {
    return SetupService.getStatus();
  },

  async initCompany(input: InitCompanyInput): Promise<InitResult> {
    const response = await SetupService.initCompany(input);
    return {
      companyId: response.companyId,
      storeId: response.storeId,
      userId: response.userId,
    };
  },
};

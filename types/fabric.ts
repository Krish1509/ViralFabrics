export interface Fabric {
  _id: string;
  qualityCode: string;
  qualityName: string;
  weaver: string;
  weaverQualityName: string;
  greighWidth: number;
  finishWidth: number;
  weight: number;
  gsm: number;
  danier: string;
  reed: number;
  pick: number;
  greighRate: number;
  label: string;
  createdAt: string;
  updatedAt: string;
}

export interface FabricFormData {
  qualityCode: string;
  qualityName: string;
  weaver: string;
  weaverQualityName: string;
  greighWidth: string;
  finishWidth: string;
  weight: string;
  gsm: string;
  danier: string;
  reed: string;
  pick: string;
  greighRate: string;
}

export interface QualityName {
  _id: string;
  name: string;
  weavers: Weaver[];
  createdAt: string;
  updatedAt: string;
}

export interface Weaver {
  _id: string;
  name: string;
  qualityNameId: string;
  weaverQualityNames: WeaverQualityName[];
  createdAt: string;
  updatedAt: string;
}

export interface WeaverQualityName {
  _id: string;
  name: string;
  weaverId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FabricFilters {
  qualityName: string;
  weaver: string;
  weaverQualityName: string;
  search: string;
}

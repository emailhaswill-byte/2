
export interface PhysicalProperties {
  color?: string;
  hardness?: string;
  lustre?: string;
  transparency?: string;
  streak?: string;
  cleavage?: string;
  fracture?: string;
  specificGravity?: string;
}

export interface AlternativeRock {
  name: string;
  reason: string;
}

export interface RockAnalysis {
  isRock: boolean;
  name: string;
  scientificName?: string;
  chemicalFormula?: string;
  category: string; // Igneous, Sedimentary, Metamorphic, Mineral, etc.
  description: string;
  physicalProperties: PhysicalProperties;
  crystalSystem?: string;
  occurrence?: string;
  commonUses?: string[];
  funFact?: string;
  confidenceScore?: number;
  estimatedValue: string; // Market value
  valuableElements: string[]; // Potential valuable elements (Au, Ag, Cu, etc.)
  alternatives: AlternativeRock[]; // Suggested alternatives if ID is wrong
}

export interface SavedRock extends RockAnalysis {
  id: string;
  date: number;
  image: string; // Base64
}

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';
  data: RockAnalysis | null;
  error: string | null;
  imagePreview: string | null;
}
import { RockAnalysis, AlternativeRock } from "../types";

// Helper function to sanitize the API response and prevent "Object Object" errors in React.
function sanitizeRockData(data: any): RockAnalysis {
  const asString = (val: any, defaultVal = ''): string => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return (val as any).text || (val as any).value || JSON.stringify(val);
    }
    return defaultVal;
  };

  const asStringArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => asString(item));
    }
    if (typeof val === 'string') {
      return [val];
    }
    return [];
  };

  const asAlternatives = (val: any): AlternativeRock[] => {
    if (Array.isArray(val)) {
        return val.map((v: any) => ({
            name: asString(v.name, "Unknown"),
            reason: asString(v.reason, "No reason provided")
        }));
    }
    if (typeof val === 'object' && val !== null && (val as any).name) {
       return [{
          name: asString((val as any).name, "Unknown"),
          reason: asString((val as any).reason, "No reason provided")
       }];
    }
    return [];
  };

  const props = data.physicalProperties || {};

  return {
    isRock: !!data.isRock,
    name: asString(data.name, "Unknown Specimen"),
    scientificName: data.scientificName ? asString(data.scientificName) : undefined,
    chemicalFormula: data.chemicalFormula ? asString(data.chemicalFormula) : undefined,
    category: asString(data.category, "Unknown"),
    description: asString(data.description, "No description available."),
    physicalProperties: {
      color: asString(props.color),
      hardness: asString(props.hardness),
      lustre: asString(props.lustre),
      transparency: asString(props.transparency),
      streak: asString(props.streak),
      cleavage: asString(props.cleavage),
      fracture: asString(props.fracture),
      specificGravity: asString(props.specificGravity),
    },
    crystalSystem: data.crystalSystem ? asString(data.crystalSystem) : undefined,
    occurrence: data.occurrence ? asString(data.occurrence) : undefined,
    commonUses: asStringArray(data.commonUses),
    estimatedValue: asString(data.estimatedValue, "Unknown"),
    valuableElements: asStringArray(data.valuableElements),
    alternatives: asAlternatives(data.alternatives),
    funFact: data.funFact ? asString(data.funFact) : undefined,
    confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : 0,
  };
}

/**
 * Identifies a rock/mineral from a base64 image string.
 * This now calls the secure Netlify serverless function.
 */
export const identifyRock = async (base64Image: string): Promise<RockAnalysis> => {
  try {
    // Call the serverless function
    // Note: In development, this requires `netlify dev` to work correctly.
    // In production, this routes to the deployed function.
    const response = await fetch('/.netlify/functions/identify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      let errorMessage = `Server Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {
        // failed to parse json error
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) {
      throw new Error("Empty response received from server.");
    }

    let rawData;
    try {
      rawData = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid response format from AI server.");
    }
    
    // Sanitize the data on the client side to ensure it fits the UI models
    return sanitizeRockData(rawData);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(error.message || "Failed to identify the image. Please try again.");
  }
};
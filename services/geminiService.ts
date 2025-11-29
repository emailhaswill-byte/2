
import { GoogleGenAI, Type } from "@google/genai";
import { RockAnalysis, AlternativeRock } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured output
const rockAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isRock: {
      type: Type.BOOLEAN,
      description: "True if the image contains a rock, mineral, crystal, or gemstone. False if it is something else (animal, plant, object, etc.)."
    },
    name: {
      type: Type.STRING,
      description: "Common name of the rock or mineral."
    },
    scientificName: {
      type: Type.STRING,
      description: "Scientific or chemical name if applicable."
    },
    chemicalFormula: {
      type: Type.STRING,
      description: "Chemical formula (e.g., SiO2, CaCO3). Use standard notation."
    },
    category: {
      type: Type.STRING,
      description: "Classification: Igneous, Sedimentary, Metamorphic, Mineral, Gemstone, etc."
    },
    description: {
      type: Type.STRING,
      description: "A concise summary of what the rock is, how it forms, and its typical uses."
    },
    physicalProperties: {
      type: Type.OBJECT,
      properties: {
        color: { type: Type.STRING },
        hardness: { type: Type.STRING, description: "Mohs hardness scale estimate" },
        lustre: { type: Type.STRING },
        transparency: { type: Type.STRING },
        streak: { type: Type.STRING },
        cleavage: { type: Type.STRING, description: "Description of cleavage properties" },
        fracture: { type: Type.STRING, description: "Description of fracture pattern" },
        specificGravity: { type: Type.STRING, description: "Specific gravity or density estimate" }
      }
    },
    crystalSystem: {
      type: Type.STRING,
      description: "Crystal system (e.g., Hexagonal, Cubic, Triclinic, Amorphous)."
    },
    occurrence: {
      type: Type.STRING,
      description: "Typical geological environment where this is found (e.g., 'Hydrothermal veins', 'Metamorphic rocks')."
    },
    commonUses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of common industrial, jewelry, or decorative uses."
    },
    estimatedValue: {
      type: Type.STRING,
      description: "Estimated market value range (e.g., '$5 - $20 per gram', '$50 for a specimen', 'Very low commercial value', or 'High value gemstone'). Be realistic."
    },
    valuableElements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific valuable elements, rare earth metals, or industrial minerals that might be chemically present in or associated with this rock type (e.g., 'Gold', 'Silver', 'Copper', 'Tungsten', 'Lithium', 'Thorium'). Return an empty array if typically containing no economically significant elements."
    },
    alternatives: {
      type: Type.ARRAY,
      description: "Provide exactly 2 distinct alternative identifications. These MUST be rocks/minerals that are visually VERY similar to the uploaded image (common visual look-alikes) that a user might confuse with the primary result. Do not provide random alternatives.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          reason: { type: Type.STRING, description: "Specific visual cue to distinguish it from the primary result (e.g. 'Has 90-degree cleavage unlike Quartz')." }
        },
        required: ["name", "reason"]
      }
    },
    funFact: {
      type: Type.STRING,
      description: "An interesting or unique fact about this specimen."
    },
    confidenceScore: {
      type: Type.INTEGER,
      description: "A number between 0 and 100 representing confidence in this identification based on visual clarity and distinctiveness of features."
    }
  },
  required: ["isRock", "name", "category", "description", "physicalProperties", "estimatedValue", "valuableElements", "alternatives", "confidenceScore"]
};

// Helper function to sanitize the AI response and prevent "Object Object" errors in React
function sanitizeRockData(data: any): RockAnalysis {
  const asString = (val: any, defaultVal = ''): string => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      // If the model returned an object where a string was expected, try to extract text or stringify
      return (val as any).text || (val as any).value || JSON.stringify(val);
    }
    return defaultVal;
  };

  const asStringArray = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => asString(item));
    }
    // Handle edge case where LLM returns a single string instead of an array
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
    // Handle edge case where LLM returns a single object instead of an array
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
    locationFound: data.locationFound // Preserved from input if available
  };
}

/**
 * Identifies a rock/mineral from a base64 image string.
 */
export const identifyRock = async (base64Image: string, location?: string): Promise<RockAnalysis> => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    let promptText = "Identify this object. If it is a rock, mineral, or crystal, provide a detailed geological analysis. Provide the chemical formula, crystal system, cleavage, fracture, and specific gravity. Include an estimated market value, list any potential valuable elements, and provide a confidence score (0-100) for your identification. Critically evaluate visual look-alikes for the 'alternatives' section.";

    if (location && location.trim().length > 0) {
      promptText += `\n\nGEOGRAPHIC CONTEXT: The user found this specimen in or near: "${location}". Use this location to narrow down possibilities to rocks and minerals known to occur in this region.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, API handles standard types well
              data: cleanBase64
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: rockAnalysisSchema,
        systemInstruction: "You are an expert geologist and mineralogist. Your goal is to accurately identify rocks and minerals from images. Be extremely precise with physical properties (hardness, cleavage, streak). When suggesting 'alternatives', focus on visual accuracy—suggest rocks that look almost identical to the image but are different species (e.g., Citrine vs. Heat-treated Amethyst, Pyrite vs. Gold). Be honest with your confidence score. Use provided location context to rule out geologically impossible matches for that area.",
        temperature: 0.3, // Lower temperature for more factual accuracy
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    const rawData = JSON.parse(text);
    
    // Sanitize the data to prevent UI crashes from unexpected types
    return sanitizeRockData(rawData);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to identify the image. Please try again.");
  }
};

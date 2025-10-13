import { createUserContent, GoogleGenAI, Modality } from "@google/genai";
import type { PartListUnion } from "@google/genai";

export async function generateImage({
  prompt,
  dataUrl,
}: {
  prompt: string;
  dataUrl?: string;
}) {
  const ai = new GoogleGenAI({
    apiKey: localStorage.getItem("geminiApiKey") || "",
  });

  const _contents: PartListUnion = [prompt];
  if (dataUrl) {
    _contents.push({
      inlineData: {
        mimeType: "image/png",
        data: dataUrl.split(",")[1], // Extract base64 part
      },
    });
  }

  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash-image-preview",
    contents: createUserContent(_contents),
    config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
  });

  const firstCandidateContent = response.candidates?.[0].content;
  const inlineData = firstCandidateContent?.parts?.filter(
    (part) => part.inlineData,
  )[0];
  if (inlineData && inlineData.inlineData) {
    const { mimeType, data } = inlineData.inlineData;
    const imageSrc = `data:${mimeType};base64,${data}`;
    return imageSrc;
  } else {
    console.error("No image data found in the response.");
  }
}

export async function analyzeImage({
  prompt,
  dataUrl,
}: {
  prompt: string;
  dataUrl: string;
}) {
  const ai = new GoogleGenAI({
    apiKey: localStorage.getItem("geminiApiKey") || "",
  });

  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: createUserContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: dataUrl.split(",")[1], // Extract base64 part
        },
      },
    ]),
  });

  const firstCandidateContent = response.candidates?.[0].content;
  const textPart = firstCandidateContent?.parts?.[0]?.text;

  if (textPart) {
    try {
      return textPart;
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  } else {
    console.error("No text data found in the response.");
    return null;
  }
}

export async function generateContent(prompt: string) {
  const ai = new GoogleGenAI({
    apiKey: localStorage.getItem("geminiApiKey") || "",
  });

  const response = await ai!.models.generateContent({
    model: "gemini-2.5-flash",
    contents: createUserContent([prompt]),
  });

  const firstCandidateContent = response.candidates?.[0].content;
  const textPart = firstCandidateContent?.parts?.[0]?.text;

  if (textPart) {
    try {
      return textPart;
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  } else {
    console.error("No text data found in the response.");
    return null;
  }
}

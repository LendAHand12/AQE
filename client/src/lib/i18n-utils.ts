import type { TFunction } from "i18next";

/**
 * Parses a string in the format "key|{params}" and returns a translated string.
 * Supports nested translations if the value in params starts with "|".
 */
export const translateWithParams = (t: TFunction, input: string): string => {
  if (!input || typeof input !== "string") return input;

  if (input.includes("|")) {
    const parts = input.split("|");
    const key = parts[0];
    const paramsStr = parts.slice(1).join("|");

    try {
      const params = JSON.parse(paramsStr);
      
      // Process nested translations in params
      const processedParams: any = {};
      for (const [pKey, pValue] of Object.entries(params)) {
        if (typeof pValue === "string" && pValue.startsWith("|")) {
          processedParams[pKey] = translateWithParams(t, pValue.substring(1));
        } else {
          processedParams[pKey] = pValue;
        }
      }
      
      return t(key, processedParams) as string;
    } catch (e) {
      // If parsing fails, try to translate the key directly
      return (t(key) as string) || input;
    }
  }

  return t(input) as string;
};

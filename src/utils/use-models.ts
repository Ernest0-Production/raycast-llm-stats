import { useCachedPromise } from "@raycast/utils";
import { ZeroEvalAPI } from "./zeroeval-api";
import { ModelListItem } from "../types";

const api = new ZeroEvalAPI();

/**
 * Hook to fetch and cache the list of all models
 * @param justCanonicals - Return only canonical models (default: true)
 * @param includeBenchmarks - Include benchmark data (default: true)
 */
export function useModels(
  justCanonicals: boolean = true,
  includeBenchmarks: boolean = true
) {
  return useCachedPromise(
    async (justCanonicals: boolean, includeBenchmarks: boolean) => {
      return api.getModels(justCanonicals, includeBenchmarks);
    },
    [justCanonicals, includeBenchmarks]
  );
}

/**
 * Helper function to find a model by ID
 * @param models - Array of models
 * @param modelId - The model ID to find
 * @returns The model if found, undefined otherwise
 */
export function findModelById(models: ModelListItem[] | undefined, modelId: string): ModelListItem | undefined {
  if (!models) return undefined;
  return models.find((model) => model.model_id === modelId);
}

/**
 * Helper function to find a model by name
 * @param models - Array of models
 * @param modelName - The model name to find
 * @returns The model if found, undefined otherwise
 */
export function findModelByName(models: ModelListItem[] | undefined, modelName: string): ModelListItem | undefined {
  if (!models) return undefined;
  return models.find((model) => model.name === modelName);
}

/**
 * Helper function to find models by organization
 * @param models - Array of models
 * @param organizationId - The organization ID to filter by
 * @returns Array of models from the organization
 */
export function findModelsByOrganization(
  models: ModelListItem[] | undefined,
  organizationId: string
): ModelListItem[] {
  if (!models) return [];
  return models.filter((model) => model.organization_id === organizationId);
}

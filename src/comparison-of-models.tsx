import { ActionPanel, Action, Icon, List, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState, useMemo } from "react";

interface Preferences {
  apiKey: string;
}

interface ModelCreator {
  id: string;
  name: string;
  slug: string;
}

interface Evaluations {
  artificial_analysis_intelligence_index?: number | null;
  artificial_analysis_coding_index?: number | null;
  artificial_analysis_math_index?: number | null;
  mmlu_pro?: number | null;
  gpqa?: number | null;
  hle?: number | null;
  livecodebench?: number | null;
  scicode?: number | null;
  math_500?: number | null;
  aime?: number | null;
  aime_25?: number | null;
  ifbench?: number | null;
  lcr?: number | null;
  terminalbench_hard?: number | null;
  tau2?: number | null;
}

interface Pricing {
  price_1m_blended_3_to_1?: number;
  price_1m_input_tokens?: number;
  price_1m_output_tokens?: number;
}

interface Model {
  id: string;
  name: string;
  slug: string;
  release_date?: string;
  model_creator: ModelCreator;
  evaluations: Evaluations;
  pricing: Pricing;
  median_output_tokens_per_second?: number | null;
  median_time_to_first_token_seconds?: number | null;
  median_time_to_first_answer_token?: number | null;
}

interface APIResponse {
  status: number;
  prompt_options?: {
    parallel_queries?: number;
    prompt_length?: number;
  };
  data: Model[];
}

type SortOption =
  | "speed"
  | "pricing_input"
  | "pricing_output"
  | "pricing_blended"
  | "artificial_analysis_intelligence_index"
  | "artificial_analysis_coding_index"
  | "artificial_analysis_math_index"
  | "mmlu_pro"
  | "gpqa"
  | "hle"
  | "livecodebench"
  | "scicode"
  | "math_500"
  | "aime"
  | "aime_25"
  | "ifbench"
  | "lcr"
  | "terminalbench_hard"
  | "tau2";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "speed", label: "Speed (Tokens/sec)" },
  { value: "pricing_input", label: "Pricing (Input Tokens)" },
  { value: "pricing_output", label: "Pricing (Output Tokens)" },
  { value: "pricing_blended", label: "Pricing (Blended 3:1)" },
  { value: "artificial_analysis_intelligence_index", label: "Intelligence Index" },
  { value: "artificial_analysis_coding_index", label: "Coding Index" },
  { value: "artificial_analysis_math_index", label: "Math Index" },
  { value: "mmlu_pro", label: "MMLU-Pro" },
  { value: "gpqa", label: "GPQA" },
  { value: "hle", label: "HLE" },
  { value: "livecodebench", label: "LiveCodeBench" },
  { value: "scicode", label: "SciCode" },
  { value: "math_500", label: "Math 500" },
  { value: "aime", label: "AIME" },
  { value: "aime_25", label: "AIME 25" },
  { value: "ifbench", label: "IFBench" },
  { value: "lcr", label: "LCR" },
  { value: "terminalbench_hard", label: "TerminalBench Hard" },
  { value: "tau2", label: "TAU2" },
];

async function fetchModels(apiKey: string): Promise<Model[]> {
  const response = await fetch("https://artificialanalysis.ai/api/v2/data/llms/models", {
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid API key. Please check your API key in preferences.");
    }
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data: APIResponse = await response.json();
  return data.data;
}

function getSortValue(model: Model, sortBy: SortOption): number {
  switch (sortBy) {
    case "speed":
      return model.median_output_tokens_per_second ?? -Infinity;
    case "pricing_input":
      return model.pricing.price_1m_input_tokens ?? Infinity;
    case "pricing_output":
      return model.pricing.price_1m_output_tokens ?? Infinity;
    case "pricing_blended":
      return model.pricing.price_1m_blended_3_to_1 ?? Infinity;
    default: {
      const evaluationValue = model.evaluations[sortBy as keyof Evaluations];
      return evaluationValue ?? -Infinity;
    }
  }
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "N/A";
  }
  if (value >= 1000) {
    return value.toFixed(1);
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(3);
}

function getAccessoryText(model: Model, sortBy: SortOption): string {
  const value = getSortValue(model, sortBy);
  if (value === -Infinity || value === Infinity) {
    return "N/A";
  }

  switch (sortBy) {
    case "speed":
      return `${formatValue(value)} tokens/s`;
    case "pricing_input":
    case "pricing_output":
    case "pricing_blended":
      return `$${formatValue(value)}/1M`;
    default:
      return formatValue(value);
  }
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [sortBy, setSortBy] = useState<SortOption>("speed");

  const { data: models, isLoading, error } = useCachedPromise(
    async (apiKey: string) => {
      if (!apiKey) {
        throw new Error("API key is required. Please set it in preferences.");
      }
      return fetchModels(apiKey);
    },
    [preferences.apiKey],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load models",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      },
    }
  );

  const sortedModels = useMemo(() => {
    if (!models) return [];

    const sorted = [...models].sort((a, b) => {
      const aValue = getSortValue(a, sortBy);
      const bValue = getSortValue(b, sortBy);

      // For pricing, lower is better (ascending)
      // For everything else, higher is better (descending)
      if (sortBy.startsWith("pricing_")) {
        return aValue - bValue;
      }
      return bValue - aValue;
    });

    return sorted;
  }, [models, sortBy]);

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error loading models"
          description={error instanceof Error ? error.message : "Unknown error occurred"}
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search models..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Sort by"
          storeValue={false}
          defaultValue={sortBy}
          onChange={(newValue) => setSortBy(newValue as SortOption)}
        >
          <List.Dropdown.Section title="Performance">
            {SORT_OPTIONS.filter((opt) => opt.value === "speed").map((option) => (
              <List.Dropdown.Item key={option.value} title={option.label} value={option.value} />
            ))}
          </List.Dropdown.Section>
          <List.Dropdown.Section title="Pricing">
            {SORT_OPTIONS.filter((opt) => opt.value.startsWith("pricing_")).map((option) => (
              <List.Dropdown.Item key={option.value} title={option.label} value={option.value} />
            ))}
          </List.Dropdown.Section>
          <List.Dropdown.Section title="Evaluations">
            {SORT_OPTIONS.filter(
              (opt) => !opt.value.startsWith("pricing_") && opt.value !== "speed"
            ).map((option) => (
              <List.Dropdown.Item key={option.value} title={option.label} value={option.value} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {sortedModels.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No models found"
          description="Try adjusting your search or check your API key"
        />
      ) : (
        sortedModels.map((model) => {
          const logoUrl = `https://artificialanalysis.ai/img/logos/${model.model_creator.slug}_small.svg`;
          const accessoryText = getAccessoryText(model, sortBy);

          return (
            <List.Item
              key={model.id}
              icon={{
                source: logoUrl,
                fallback: Icon.Circle,
              }}
              title={model.name}
              subtitle={model.model_creator.name}
              accessories={[
                {
                  text: accessoryText,
                  tooltip: `Sorted by: ${SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}`,
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title="Copy Model Name"
                    content={model.name}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.CopyToClipboard
                    title="Copy Model ID"
                    content={model.id}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                  <Action.OpenInBrowser
                    title="Open Model Page"
                    url={`https://artificialanalysis.ai/models/${model.slug}`}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}

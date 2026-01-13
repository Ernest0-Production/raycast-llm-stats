import {
  ActionPanel,
  Action,
  Icon,
  List,
  showToast,
  Toast,
  Image,
  Color,
} from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { useEffect } from "react";
import { ZeroEvalAPI } from "./utils/zeroeval-api";
import { ModelDetailForm } from "./components/views/ModelDetailForm";
import { getOrganizationLogo } from "./utils/organization-logos";
import { useModels, findModelById } from "./utils/use-models";
import { ModelDetailsLinkAction } from "./components/actions/ModelDetailsLinkAction";

const api = new ZeroEvalAPI();

/**
 * Static mapping of category_id to Raycast icons
 */
const categoryIcons: Record<string, Image.ImageLike | undefined> = {
  "3d": Icon.Box,
  agent: Icon.Person,
  agents: Icon.TwoPeople,
  audio: Icon.Headphones,
  chemistry: Icon.Pill,
  code: Icon.Code,
  coding: Icon.CodeBlock,
  general: Icon.Star,
  healthcare: Icon.MedicalSupport,
  finance: Icon.Coins,
  math: Icon.Calculator,
  reasoning: Icon.MagnifyingGlass,
  spatial_reasoning: Icon.Eye,
  vision: Icon.Eye,
  multimodal: Icon.Image,
  language: Icon.Globe,
  physics: Icon.Bolt,
  long_context: Icon.Document,
  structured_output: Icon.List,
  tool_calling: Icon.WrenchScrewdriver,
  frontend_development: Icon.AppWindow,
  safety: Icon.Shield,
  communication: Icon.Bubble,
  summarization: Icon.Document,
  "image-to-text": Icon.Camera,
  "speech-to-text": Icon.Headphones,
  "text-to-image": Icon.Text,
  document: Icon.Book,
  economics: Icon.BankNote,
  roleplay: Icon.TwoPeople,
  legal: `https://api.iconify.design/mdi/gavel.svg`,
  video: Icon.Video,
  writing: Icon.Pencil,
  search: Icon.MagnifyingGlass,
  robotics: `https://api.iconify.design/mdi/robot-outline.svg`,
  psychology: `https://api.iconify.design/mdi/brain.svg`,
  creativity: Icon.LightBulb,
};

/**
 * Gets icon for a category
 */
function getCategoryIcon(categoryId: string): Image.ImageLike | undefined {
  return categoryIcons[categoryId] || Icon.Stars;
}

/**
 * Formats benchmark score based on max_score
 * @param score - The benchmark score
 * @param maxScore - Maximum possible score for the benchmark
 * @returns Formatted score string
 */
function formatBenchmarkScore(score: number, maxScore: number): string {
  if (maxScore === 1) {
    // Percentage format for max_score = 1
    return `${(score * 100).toFixed(2)}%`;
  }
  // Integer format for larger values
  return score.toFixed(2);
}


export default function Command() {
  const [selectedCategoryId, setSelectedCategoryId] = useCachedState<string>(
    "selected-category-id",
    "general"
  );

  // Load and cache all models
  const { data: allModels, isLoading: isLoadingModels } = useModels(true, true);

  // Load categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useCachedPromise(async () => api.getCategories(), [], {
    onError: (error) => {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load categories",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Load benchmarks for selected category
  const {
    data: categoryData,
    isLoading: isLoadingBenchmarks,
    error: benchmarksError,
  } = useCachedPromise(
    async (categoryId: string | undefined) => {
      if (!categoryId) return null;

      try {
        return await api.getCategoryBenchmarks(categoryId);
      } catch (error) {
        console.error(`Failed to load benchmarks for category ${categoryId}:`, error);
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load benchmarks",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
      }
    },
    [selectedCategoryId],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load benchmarks",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      },
    }
  );

  // Auto-select first category if none selected and categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      const firstCategory = categories.find((c) => c.category_id === "general") || categories[0];
      if (firstCategory) {
        setSelectedCategoryId(firstCategory.category_id);
      }
    }
  }, [categories, selectedCategoryId, setSelectedCategoryId]);

  const isLoading = isLoadingCategories || isLoadingBenchmarks || isLoadingModels;
  const error = categoriesError || benchmarksError;

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error loading data"
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
          tooltip="Select Category"
          value={selectedCategoryId}
          onChange={(newValue) => setSelectedCategoryId(newValue)}
        >
          {categories
            ?.sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => (
              <List.Dropdown.Item
                key={category.category_id}
                title={category.name}
                value={category.category_id}
                icon={getCategoryIcon(category.category_id)}
              />
            ))}
        </List.Dropdown>
      }
    >
      {!selectedCategoryId ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Select a category"
          description="Choose a category from the dropdown to view benchmarks"
        />
      ) : categoryData && categoryData.benchmarks.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No models found"
          description="No models available for benchmarks in this category"
        />
      ) : (
        categoryData?.benchmarks.map((benchmark) => (
          <List.Section
            key={benchmark.benchmark_id}
            title={benchmark.name}
          >
            {benchmark.top_models.slice(0, 5).map((model, index) => {
              const scoreText = formatBenchmarkScore(
                model.benchmark_score,
                benchmark.max_score
              );

              // Find model in cached list to get additional info
              const cachedModel = findModelById(allModels, model.model_id);
              const organizationId = cachedModel?.organization_id || model.organization_name.toLowerCase();
              const modelName = cachedModel?.name || model.model_name;

              // Add Trophy icon to first element in each section
              const accessories: List.Item.Accessory[] = [
                index === 0 ? {
                  tag: {
                    value: scoreText,
                    color: Color.Yellow,
                  },
                  icon: Icon.Trophy,
                  tooltip: benchmark.description || benchmark.name,
                } : {
                  text: scoreText,
                  tooltip: benchmark.description || benchmark.name,
                },
              ];

              return (
                <List.Item
                  key={`${benchmark.benchmark_id}-${model.model_id}`}
                  icon={getOrganizationLogo(organizationId)}
                  title={modelName}
                  subtitle={cachedModel?.organization || model.organization_name}
                  keywords={[
                    cachedModel?.organization || model.organization_name,
                    benchmark.name
                  ]}
                  accessories={accessories}
                  actions={
                    <ActionPanel>
                      <Action.Push
                        title="Show Details"
                        target={<ModelDetailForm modelId={model.model_id} />}
                        icon={Icon.Info}
                      />
                      <Action.OpenInBrowser
                        title="Open Model in Browser"
                        url={`https://zeroeval.com/models/${model.model_id}`}
                        shortcut={{ modifiers: ["cmd"], key: "o" }}
                      />
                      <ModelDetailsLinkAction modelId={model.model_id} />
                      <Action.CopyToClipboard
                        title="Copy Model Name"
                        content={modelName}
                        shortcut={{ modifiers: ["cmd"], key: "c" }}
                      />
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        ))
      )}
    </List>
  );
}

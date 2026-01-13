import { Detail, showToast, Toast, Icon, ActionPanel } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { ZeroEvalAPI } from "../../utils/zeroeval-api";
import { ORGANIZATION_LOGOS } from "../../utils/organization-logos";
import { ModelDetailsLinkAction } from "../actions/ModelDetailsLinkAction";

interface ModelDetailFormProps {
  modelId: string;
}

const api = new ZeroEvalAPI();

export function ModelDetailForm({ modelId }: ModelDetailFormProps) {
  const { data: modelInfo, isLoading, error } = useCachedPromise(
    async (id: string) => {
      return api.getModelInfo(id);
    },
    [modelId],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load model information",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      },
    }
  );

  if (error) {
    return (
      <Detail
        markdown={error instanceof Error ? error.message : "Failed to load model information"}
      />
    );
  }

  // Get pricing and context info from first provider
  const primaryProvider = modelInfo?.providers?.[0];
  const inputPrice = primaryProvider?.pricing?.input_per_million;
  const outputPrice = primaryProvider?.pricing?.output_per_million;
  const contextSize = primaryProvider?.limits?.max_input_tokens;
  const throughput = primaryProvider?.performance?.throughput;
  const latency = primaryProvider?.performance?.latency;
  const modalities = primaryProvider?.modalities;
  const quantization = primaryProvider?.quantization;

  // Build markdown content
  const markdownParts: string[] = [];

  if (modelInfo?.name) {
    // Get organization logo URL
    const organizationId = modelInfo.organization?.id;
    const logoUrl = organizationId && typeof ORGANIZATION_LOGOS[organizationId] === 'string'
      ? ORGANIZATION_LOGOS[organizationId] as string
      : null;

    // Build header with logo if available
    const headerContent = logoUrl
      ? `<img src="${logoUrl}" alt="${modelInfo.organization?.name || ''}" width="24" height="24" style="vertical-align: middle;" /> ${modelInfo.name}`
      : modelInfo.name;

    markdownParts.push(`# ${headerContent}`);
  }

  if (modelInfo?.description) {
    markdownParts.push(modelInfo.description);
  }

  // Add benchmarks section if they exist
  if (modelInfo?.benchmarks && modelInfo.benchmarks.length > 0) {
    markdownParts.push("---");
    markdownParts.push("## Benchmarks");

    // Build table with single line breaks
    const tableRows: string[] = [];
    tableRows.push("");
    tableRows.push("| Benchmark | Score |");
    tableRows.push("|-----------|-------|");
    modelInfo.benchmarks.forEach((benchmark) => {
      const benchmarkLink = `[${benchmark.name}](https://llm-stats.com/benchmarks/${benchmark.benchmark_id})`;
      tableRows.push(`| ${benchmarkLink} | ${benchmark.score} |`);
    });
    tableRows.push("");

    // Add table as single block with single line breaks
    markdownParts.push(tableRows.join("\n"));
  }

  const markdown = markdownParts.length > 0 ? markdownParts.join("\n\n") : "";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <ModelDetailsLinkAction modelId={modelId} />
        </ActionPanel>
      }
      metadata={
        modelInfo && (
          <Detail.Metadata>
            {/* Context Window, Parameters, Latency Section */}
            {(contextSize !== null) && (
              <>
                <Detail.Metadata.Label title="Context Window" text={formatContextSize(contextSize ?? 0)} />
                {modelInfo.param_count !== null && (
                  <Detail.Metadata.Label title="Parameters" text={formatParamCount(modelInfo.param_count)} icon={Icon.Calculator} />
                )}
                {quantization !== null && (
                  <Detail.Metadata.Label title="Quantization" text={quantization} icon={Icon.ArrowsContract} />
                )}
                {throughput !== null && (
                  <Detail.Metadata.Label title="Throughput" text={`${throughput} tokens/second`} icon={Icon.Bolt} />
                )}
                {latency !== null && (
                  <Detail.Metadata.Label title="Latency" text={latency} icon={Icon.Signal2} />
                )}
                <Detail.Metadata.Separator />
              </>
            )}

            {/* Pricing Section */}
            {inputPrice && (
              <Detail.Metadata.Label title="Input Price" text={formatPrice(inputPrice)} />
            )}
            {outputPrice && (
              <Detail.Metadata.Label title="Output Price" text={formatPrice(outputPrice)} />
            )}
            {modelInfo.license && (
              <Detail.Metadata.Label title="License" text={modelInfo.license.name} icon={Icon.Shield} />
            )}

            {/* Modalities Section */}
            {modalities && (
              <>
                <Detail.Metadata.Separator />
                {(() => {
                  const inputModalities: Detail.Metadata.TagList.Item.Props[] = [];
                  if (modalities.input.text) inputModalities.push({ text: "Text", icon: Icon.Text });
                  if (modalities.input.image) inputModalities.push({ text: "Image", icon: Icon.Image });
                  if (modalities.input.audio) inputModalities.push({ text: "Audio", icon: Icon.Headphones });
                  if (modalities.input.video) inputModalities.push({ text: "Video", icon: Icon.Video });

                  const outputModalities = [];
                  if (modalities.output.text) outputModalities.push({ text: "Text", icon: Icon.Text });
                  if (modalities.output.image) outputModalities.push({ text: "Image", icon: Icon.Image });
                  if (modalities.output.audio) outputModalities.push({ text: "Audio", icon: Icon.Headphones });
                  if (modalities.output.video) outputModalities.push({ text: "Video", icon: Icon.Video });

                  return (
                    <>
                      {inputModalities.length > 0 && (
                        <Detail.Metadata.TagList title="Input Modalities">
                          {inputModalities.map((modality) => (
                            <Detail.Metadata.TagList.Item key={modality.text} {...modality} />
                          ))}
                        </Detail.Metadata.TagList>
                      )}
                      {outputModalities.length > 0 && (
                        <Detail.Metadata.TagList title="Output Modalities">
                          {outputModalities.map((modality) => (
                            <Detail.Metadata.TagList.Item key={modality.text} {...modality} />
                          ))}
                        </Detail.Metadata.TagList>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* Dates Section */}
            {(modelInfo.release_date || modelInfo.announcement_date || modelInfo.knowledge_cutoff) && (
              <>
                <Detail.Metadata.Separator />
                {modelInfo.release_date && (
                  <Detail.Metadata.Label title="Release Date" text={modelInfo.release_date} />
                )}
                {modelInfo.announcement_date && (
                  <Detail.Metadata.Label title="Announcement Date" text={modelInfo.announcement_date} />
                )}
                {modelInfo.knowledge_cutoff && (
                  <Detail.Metadata.Label title="Knowledge Cutoff" text={modelInfo.knowledge_cutoff} />
                )}
              </>
            )}

            {/* Sources Section */}
            {modelInfo.sources && (() => {
              const sourcesList: React.ReactElement[] = [];

              if (modelInfo.sources.api_ref) {
                sourcesList.push(
                  <Detail.Metadata.Link
                    key="api_ref"
                    title="API Reference"
                    target={modelInfo.sources.api_ref}
                    text={getHostnameFromUrl(modelInfo.sources.api_ref)}
                  />
                );
              }
              if (modelInfo.sources.playground) {
                sourcesList.push(
                  <Detail.Metadata.Link
                    key="playground"
                    title="Playground"
                    target={modelInfo.sources.playground}
                    text={getHostnameFromUrl(modelInfo.sources.playground)}
                  />
                );
              }
              if (modelInfo.sources.paper) {
                sourcesList.push(
                  <Detail.Metadata.Link
                    key="paper"
                    title="Paper"
                    target={modelInfo.sources.paper}
                    text={getHostnameFromUrl(modelInfo.sources.paper)}
                  />
                );
              }
              if (modelInfo.sources.scorecard_blog) {
                sourcesList.push(
                  <Detail.Metadata.Link
                    key="scorecard_blog"
                    title="Scorecard Blog"
                    target={modelInfo.sources.scorecard_blog}
                    text={getHostnameFromUrl(modelInfo.sources.scorecard_blog)}
                  />
                );
              }
              if (modelInfo.sources.repo) {
                sourcesList.push(
                  <Detail.Metadata.Link
                    key="repo"
                    title="Repository"
                    target={modelInfo.sources.repo}
                    text={getHostnameFromUrl(modelInfo.sources.repo)}
                  />
                );
              }
              if (modelInfo.sources.weights) {
                sourcesList.push(
                  <Detail.Metadata.Link
                    key="weights"
                    title="Weights"
                    target={modelInfo.sources.weights}
                    text={getHostnameFromUrl(modelInfo.sources.weights)}
                  />
                );
              }

              return sourcesList.length > 0 ? (
                <>
                  <Detail.Metadata.Separator />
                  {sourcesList}
                </>
              ) : null;
            })()}
          </Detail.Metadata>
        )
      }
    />
  );
}

function formatParamCount(count: number): string {
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatPrice(pricePerMillion: number): string {
  return `$${pricePerMillion.toFixed(2)}/1M tokens`;
}

function formatContextSize(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M tokens`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K tokens`;
  }
  return `${tokens} tokens`;
}

function getHostnameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, return the original URL or a fallback
    return url;
  }
}

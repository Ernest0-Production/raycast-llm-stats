import { ActionPanel, Action, Icon } from "@raycast/api";
import { ModelDetailForm } from "../views/ModelDetailForm";
import { ModelDetailsLinkAction } from "./ModelDetailsLinkAction";
import { getOrganizationLogo } from "../../utils/organization-logos";
import { useModels } from "../../utils/use-models";

/**
 * Common ActionPanel component for model list items
 */
export function ModelActions({ modelId }: { modelId: string }) {
  // Fetch models list but don't execute the promise (use cached data if available)
  const { data: allModels } = useModels(true, true, false);

  // Filter out current model from comparison list
  const otherModels = allModels?.filter((model) => model.model_id !== modelId) || [];

  return (
    <ActionPanel>
      <Action.Push title="Show Details" target={<ModelDetailForm modelId={modelId} />} icon={Icon.Info} />
      <ModelDetailsLinkAction modelId={modelId} />
      <Action.OpenInBrowser
        title="Open Playground"
        url={`https://llm-stats.com/playground?m1=${modelId}`}
        icon={Icon.GameController}
      />
      {otherModels.length > 0 && (
        <ActionPanel.Submenu
          title="Compare with"
          icon={`https://api.iconify.design/material-symbols/compare-arrows-rounded.svg`}
        >
          {otherModels.map((otherModel) => (
            <Action.OpenInBrowser
              key={otherModel.model_id}
              title={otherModel.name}
              url={`https://llm-stats.com/models/compare/${modelId}-vs-${otherModel.model_id}`}
              icon={getOrganizationLogo(otherModel.organization_id)}
            />
          ))}
        </ActionPanel.Submenu>
      )}
    </ActionPanel>
  );
}

import { ActionPanel, Action, Icon, List, showToast, Toast, Color } from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";
import { ZeroEvalAPI } from "./utils/zeroeval-api";
import { ArenaModel } from "./types";
import { ModelDetailForm } from "./components/views/ModelDetailForm";
import { getOrganizationLogo } from "./utils/organization-logos";
import { useModels, findModelById } from "./utils/use-models";
import { ModelDetailsLinkAction } from "./components/actions/ModelDetailsLinkAction";

interface Arena {
  id: string;
  name: string;
  icon: Icon;
}

// Static hashmap of arenas grouped by sections
const ARENAS_BY_SECTION = new Map<string, Arena[]>([
  [
    "Chat Arena",
    [{ id: "chat-arena", name: "Chat Arena", icon: Icon.Message }],
  ],
  [
    "Coding Arena",
    [
      { id: "text-to-website", name: "Website", icon: Icon.Globe },
      { id: "threejs", name: "3D", icon: Icon.Box },
      { id: "text-to-game", name: "Game", icon: Icon.GameController },
      { id: "p5-animation", name: "Animation", icon: Icon.Brush },
      { id: "text-to-svg", name: "Text to SVG", icon: Icon.Code },
      { id: "dataviz", name: "Data Visualization", icon: Icon.BarChart },
      { id: "tonejs", name: "MIDI", icon: Icon.Livestream },
    ],
  ],
  [
    "Image Arena",
    [
      { id: "text-to-image", name: "Text to Image", icon: Icon.Wand },
      { id: "image-to-image", name: "Image to Image", icon: Icon.Image },
    ],
  ],
  [
    "Video Arena",
    [
      { id: "text-to-video", name: "Text to Image", icon: Icon.Wand },
      { id: "image-to-video", name: "Image to Video", icon: Icon.Image },
      { id: "video-editing", name: "Video Editing", icon: Icon.FilmStrip },
    ],
  ],
  [
    "Audio Arena",
    [
      { id: "text-to-speech", name: "Text to Speech", icon: Icon.SpeakerHigh },
      { id: "music", name: "Text to Music", icon: Icon.Music },
    ],
  ],
  [
    "Trading Arena",
    [{ id: "stock-arena", name: "Stocks Arena", icon: Icon.LineChart }],
  ],
]);

const api = new ZeroEvalAPI();

export default function Command() {
  const [selectedArena, setSelectedArena] = useCachedState<string>("selected-arena", ARENAS_BY_SECTION.get("Chat Arena")?.[0].id || "");

  // Load and cache all models
  const { data: allModels, isLoading: isLoadingModels } = useModels(true, true);

  const { data: leaderboardData, isLoading: isLoadingLeaderboard, error, revalidate } = useCachedPromise(
    async (arenaId: string) => {
      return api.getArenaLeaderboard(arenaId, 50, 0);
    },
    [selectedArena],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load leaderboard",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      },
    }
  );

  const handleArenaChange = (newArenaId: string) => {
    setSelectedArena(newArenaId);
    revalidate();
  };

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error loading leaderboard"
          description={error instanceof Error ? error.message : "Unknown error occurred"}
        />
      </List>
    );
  }

  const models = leaderboardData?.leaderboard || [];
  const isLoading = isLoadingLeaderboard || isLoadingModels;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search models..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Arena"
          value={selectedArena}
          onChange={handleArenaChange}
        >
          {Array.from(ARENAS_BY_SECTION.entries()).map(([sectionName, section]) => (
            <List.Dropdown.Section key={sectionName} title={sectionName}>
              {section.map((arena) => (
                <List.Dropdown.Item
                  key={arena.id}
                  title={arena.name}
                  value={arena.id}
                  icon={arena.icon}
                />
              ))}
            </List.Dropdown.Section>
          ))}
        </List.Dropdown>
      }
    >
      {models.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No models found"
          description="Try selecting a different arena"
        />
      ) : (
        models.map((model: ArenaModel, index) => {
          // Find model in cached list to get additional info
          const cachedModel = findModelById(allModels, model.model_id);
          const organizationId = cachedModel?.organization_id || model.organization.toLowerCase();
          const modelName = cachedModel?.name || model.model_name;

          const votesAccessory: List.Item.Accessory = {
            text: `${model.wins}`,
            icon: Icon.ThumbsUp,
            tooltip: `Votes`,
          };

          let accessory: List.Item.Accessory;

          if (model.percent_gain !== undefined) {
            const value = `${model.percent_gain >= 0 ? "+" : ""}${model.percent_gain.toFixed(2)}%`;
            if (index === 0) {
              accessory = {
                tag: {
                  value,
                  color: Color.Yellow,
                },
                icon: Icon.Trophy,
                tooltip: `Percent Gain`,
              };
            } else if (index === 1) {
              accessory = {
                tag: {
                  value,
                  color: Color.SecondaryText,
                },
                icon: Icon.Trophy,
                tooltip: `Percent Gain`,
              };
            } else if (index === 2) {
              accessory = {
                tag: {
                  value,
                  color: Color.Orange,
                },
                icon: Icon.Trophy,
                tooltip: `Percent Gain`,
              };
            } else {
              accessory = {
                text: {
                  value,
                  color: model.percent_gain >= 0 ? Color.Green : Color.Red
                },
                tooltip: `Percent Gain`,
              };
            }
          } else {
            const value = `${model.conservative_rating?.toFixed(2) || "-"}`;
            if (index === 0) {
              accessory = {
                tag: {
                  value,
                  color: Color.Yellow,
                },
                icon: Icon.Trophy,
                tooltip: `Score`,
              };
            } else if (index === 1) {
              accessory = {
                tag: {
                  value,
                  color: Color.PrimaryText,
                },
                icon: Icon.Trophy,
                tooltip: `Score`,
              };
            } else if (index === 2) {
              accessory = {
                tag: {
                  value,
                  color: Color.Orange,
                },
                icon: Icon.Trophy,
                tooltip: `Score`,
              };
            } else {
              accessory = {
                tag: {
                  value,
                  color: Color.SecondaryText
                },
                tooltip: `Score`,
              };
            }
          }

          return (
            <List.Item
              key={model.variant_id}
              icon={getOrganizationLogo(organizationId)}
              title={modelName}
              subtitle={cachedModel?.organization || model.organization}
              keywords={[cachedModel?.organization || model.organization]}
              accessories={[votesAccessory, accessory]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Show Details"
                    target={<ModelDetailForm modelId={model.model_id} />}
                    icon={Icon.Info}
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
        })
      )}
    </List>
  );
}

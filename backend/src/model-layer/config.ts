import type { ModelLayerStrategy } from "../../../shared/types";

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

export const getConfiguredModelLayer = (): ModelLayerStrategy =>
  (process.env.TRACECHECK_MODEL_LAYER ?? "rule-engine").trim() === "azure-openai"
    ? "azure-openai"
    : "rule-engine";

export const getOpenAiConfig = () => {
  const endpoint = trimTrailingSlash(process.env.AZURE_OPENAI_ENDPOINT ?? "");
  const apiKey = (process.env.AZURE_OPENAI_API_KEY ?? "").trim();
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT ?? "").trim();
  const timeoutMs = Number(process.env.AZURE_OPENAI_TIMEOUT_MS ?? "15000");

  return {
    endpoint,
    apiKey,
    deployment,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000,
  };
};

export const truncateText = (value: string, limit = 12000) =>
  value.length <= limit ? value : `${value.slice(0, limit)}\n...[truncated]`;

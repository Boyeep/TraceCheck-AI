import assert from "node:assert/strict";
import { createRequire } from "node:module";

type BuildAzureIntegrationStatus =
  typeof import("../../shared/server/integration-status").buildAzureIntegrationStatus;

const require = createRequire(import.meta.url);
const { buildAzureIntegrationStatus } = require("../../shared/server/integration-status") as {
  buildAzureIntegrationStatus: BuildAzureIntegrationStatus;
};

type TestCase = {
  name: string;
  input: Parameters<typeof buildAzureIntegrationStatus>[0];
  expected: {
    mode: "azure" | "fallback";
    readiness: {
      binaryOcr: "azure" | "fallback";
      fieldExtraction: "azure" | "fallback";
      decisionSummary: "azure" | "fallback";
    };
    reason: string;
  };
};

const cases: TestCase[] = [
  {
    name: "falls back cleanly when no Azure services are configured",
    input: {
      documentIntelligenceConfigured: false,
      modelId: "prebuilt-read",
      mode: "fallback",
    },
    expected: {
      mode: "fallback",
      readiness: {
        binaryOcr: "fallback",
        fieldExtraction: "fallback",
        decisionSummary: "fallback",
      },
      reason:
        "Azure credentials are not configured, so TraceCheck is running in safe local fallback mode.",
    },
  },
  {
    name: "marks only binary OCR as ready when Document Intelligence is configured",
    input: {
      documentIntelligenceConfigured: true,
      modelId: "prebuilt-read",
      mode: "azure",
    },
    expected: {
      mode: "azure",
      readiness: {
        binaryOcr: "azure",
        fieldExtraction: "fallback",
        decisionSummary: "fallback",
      },
      reason:
        "Azure Document Intelligence is configured for binary document extraction and TraceCheck uses the rule engine for extraction and explanation.",
    },
  },
  {
    name: "reports OpenAI readiness separately from binary OCR readiness",
    input: {
      documentIntelligenceConfigured: false,
      modelId: "prebuilt-read",
      mode: "fallback",
      modelLayerStatus: {
        openAiConfigured: true,
        openAiDeployment: "gpt-4o-mini",
        extractionStrategy: "azure-openai",
        explanationStrategy: "azure-openai",
      },
    },
    expected: {
      mode: "fallback",
      readiness: {
        binaryOcr: "fallback",
        fieldExtraction: "azure",
        decisionSummary: "azure",
      },
      reason:
        "Azure OpenAI is ready for field extraction and decision summaries, but binary OCR still needs Azure Document Intelligence credentials.",
    },
  },
  {
    name: "lets request-level fallback override execution mode without losing readiness",
    input: {
      documentIntelligenceConfigured: true,
      modelId: "prebuilt-read",
      mode: "fallback",
      reason:
        "Azure extraction failed and TraceCheck used fallback mode instead. Upstream timeout.",
      modelLayerStatus: {
        openAiConfigured: true,
        openAiDeployment: "gpt-4o-mini",
        extractionStrategy: "azure-openai",
        explanationStrategy: "azure-openai",
      },
    },
    expected: {
      mode: "fallback",
      readiness: {
        binaryOcr: "azure",
        fieldExtraction: "azure",
        decisionSummary: "azure",
      },
      reason:
        "Azure extraction failed and TraceCheck used fallback mode instead. Upstream timeout.",
    },
  },
  {
    name: "supports Azure-backed decision summaries even when extraction stays deterministic",
    input: {
      documentIntelligenceConfigured: false,
      modelId: "prebuilt-read",
      mode: "azure",
      modelLayerStatus: {
        openAiConfigured: true,
        openAiDeployment: "gpt-4o-mini",
        extractionStrategy: "rule-engine",
        explanationStrategy: "azure-openai",
      },
    },
    expected: {
      mode: "azure",
      readiness: {
        binaryOcr: "fallback",
        fieldExtraction: "fallback",
        decisionSummary: "azure",
      },
      reason:
        "Azure OpenAI is ready for decision summaries, but binary OCR still needs Azure Document Intelligence credentials.",
    },
  },
];

cases.forEach(({ name, input, expected }) => {
  const actual = buildAzureIntegrationStatus(input);

  assert.deepEqual(
    {
      mode: actual.mode,
      readiness: actual.readiness,
      reason: actual.reason,
    },
    expected,
    name,
  );
});

console.log(`integration-status test matrix passed (${cases.length} cases)`);

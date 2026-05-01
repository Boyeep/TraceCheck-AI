import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  FileStack,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import {
  buildFeaturePath,
  routePaths,
} from "../routes";

export type FeatureSection = {
  title: string;
  copy: string;
  bullets: string[];
};

export type FeatureArchitectureColumn = {
  title: string;
  items: string[];
};

export type FeatureSpotlight = {
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  includes: string[];
  sections: FeatureSection[];
  architectureColumns?: FeatureArchitectureColumn[];
  next: {
    href: string;
    label: string;
  };
};

export const featureSpotlights: FeatureSpotlight[] = [
  {
    slug: "intake",
    href: buildFeaturePath("intake"),
    eyebrow: "Intake & Extraction",
    title: "Bring incoming documents into one verified intake stream.",
    summary:
      "TraceCheck accepts the three core material documents, extracts the traceability fields, and prepares them for QA review in one place.",
    icon: FileStack,
    includes: ["Three-document intake", "Field extraction pipeline"],
    sections: [
      {
        title: "Source coverage",
        copy:
          "The workflow is designed around the three files QA teams actually depend on at receiving time.",
        bullets: [
          "Delivery note, certificate of analysis, and material label live in one queue.",
          "Each slot keeps its own file name, processing source, and extracted data.",
          "The workspace keeps the document order stable so reviewers can scan quickly.",
        ],
      },
      {
        title: "Extraction behavior",
        copy:
          "TraceCheck extracts the same six traceability fields from every source before comparison begins.",
        bullets: [
          "Material name, item code, supplier, batch number, expiry date, and quantity are normalized.",
          "Text uploads parse immediately through the local workflow or API path.",
          "Binary uploads are shaped for OCR-backed extraction when the backend path is live.",
        ],
      },
    ],
    next: {
      href: buildFeaturePath("review"),
      label: "QA review",
    },
  },
  {
    slug: "review",
    href: buildFeaturePath("review"),
    eyebrow: "QA Review Layer",
    title: "Keep human review in the loop before any release decision lands.",
    summary:
      "Reviewers can edit captured values, compare them against the OCR baseline, and explicitly approve each document before low-confidence warnings are cleared.",
    icon: ScanSearch,
    includes: ["Editable review layer", "OCR baseline restore"],
    sections: [
      {
        title: "Field-by-field editing",
        copy:
          "Each extracted field stays editable so the product supports correction instead of pretending OCR is final.",
        bullets: [
          "Manual overrides update the recommendation immediately in the browser.",
          "Review state moves between pending, edited, and approved.",
          "Overrides are counted and included in the exported report.",
        ],
      },
      {
        title: "Review controls",
        copy:
          "TraceCheck preserves the original OCR capture so QA can reverse mistakes without re-uploading a file.",
        bullets: [
          "Restore a single field back to the OCR baseline.",
          "Reset an entire document to OCR output.",
          "Approve review to clear low-confidence warnings while keeping true mismatches visible.",
        ],
      },
    ],
    next: {
      href: buildFeaturePath("decision"),
      label: "Decision engine",
    },
  },
  {
    slug: "decision",
    href: buildFeaturePath("decision"),
    eyebrow: "Decision Engine",
    title: "Compare the documents and surface a release-safe recommendation.",
    summary:
      "TraceCheck turns extracted values into a cross-document matrix, raises mismatch and expiry issues, and rolls the result into an explainable release recommendation.",
    icon: ShieldCheck,
    includes: [
      "Mismatch and expiry flags",
      "Explainable release logic",
      "Validation matrix",
    ],
    sections: [
      {
        title: "Cross-document checks",
        copy:
          "The product evaluates the same fields across all available documents instead of judging each upload in isolation.",
        bullets: [
          "Each field gets a verdict such as match, mismatch, missing, or warning.",
          "Near-expiry dates escalate into warnings even when the documents agree.",
          "The matrix stays visible so reviewers can see the exact disagreement source.",
        ],
      },
      {
        title: "Recommendation logic",
        copy:
          "Release, manual review, and hold outcomes are driven by issue severity and confidence thresholds.",
        bullets: [
          "High-severity discrepancies push the recommendation to hold.",
          "Medium and low issues contribute to risk scoring and manual review outcomes.",
          "The final summary explains why the recommendation was reached in plain language.",
        ],
      },
    ],
    next: {
      href: buildFeaturePath("integration"),
      label: "Deployment path",
    },
  },
  {
    slug: "integration",
    href: buildFeaturePath("integration"),
    eyebrow: "Deployment Path",
    title: "Keep the verification flow deployable across local and Azure paths.",
    summary:
      "The frontend is already split from the backend, and the product can target browser fallback, Express, or the Azure Functions shape without changing the core workflow.",
    icon: Cloud,
    includes: [
      "Azure-ready backend",
      "Split frontend/backend structure",
      "Fallback-safe runtime",
    ],
    sections: [
      {
        title: "Runtime modes",
        copy:
          "TraceCheck is designed to stay usable even when the live API path is unavailable.",
        bullets: [
          "Frontend fallback keeps the demo flow working when the API cannot be reached.",
          "The Express API exposes extraction, analysis, and integration-status routes.",
          "The Function App mirrors the same route shape for Azure deployment.",
        ],
      },
      {
        title: "Azure path",
        copy:
          "The binary document path is prepared for Azure Document Intelligence and aligned to a hackathon-ready deployment story.",
        bullets: [
          "Image and PDF uploads can flow through Azure OCR when credentials are configured.",
          "The frontend can point to local Express, local Functions, or deployed Functions.",
          "The product shell and validation logic stay consistent across those modes.",
        ],
      },
    ],
    architectureColumns: [
      {
        title: "Frontend",
        items: [
          "Multi-page React app with shared product shell",
          "Document upload and field-review workspace",
          "Validation matrix, issues, and report export",
        ],
      },
      {
        title: "API Layer",
        items: [
          "Secure document extraction endpoints",
          "Analysis endpoint for recommendation payloads",
          "Fallback behavior when Azure is unavailable",
        ],
      },
      {
        title: "Azure Path",
        items: [
          "Azure AI Document Intelligence for OCR",
          "Azure Functions deployment shape",
          "Static Web Apps friendly frontend integration",
        ],
      },
    ],
    next: {
      href: routePaths.workspace,
      label: "Live workspace",
    },
  },
];

const featureSpotlightMap = new Map(
  featureSpotlights.map((feature) => [feature.slug, feature]),
);

export const getFeatureSpotlightBySlug = (slug?: string) =>
  slug ? featureSpotlightMap.get(slug) : undefined;

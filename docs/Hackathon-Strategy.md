# Hackathon Strategy

## Best Idea Shortlist

Assumption: the goal is to maximize odds of winning a prototype-focused AI hackathon with visible Azure usage, a strong live demo, and limited build time.

### 1. TraceCheck AI
Theme match: `9. Proses Verifikasi Material`

Why it is strong:
- Very clear pain point: manual verification of labels and documents.
- AI is easy to show live through OCR, extraction, and mismatch detection.
- Azure usage is obvious and relevant, not forced.
- Demo can use synthetic invoices, labels, COA sheets, and receiving forms.
- Strong business and social impact story through product quality and patient safety.

MVP:
- Upload or photograph material label and supporting document.
- Extract fields automatically.
- Compare batch number, expiry date, supplier, quantity, and item code.
- Flag mismatch risk and recommend `release`, `hold`, or `manual review`.

### 2. SkillBridge
Theme match: `22. Job Matching & Workforce Upskilling`

Why it is strong:
- Very strong public impact and easy for judges to understand.
- AI fit is natural through resume parsing, job matching, and skill-gap analysis.
- Easy to design a polished web prototype.
- Big differentiation opportunity if the wedge is "match plus learning path", not just job search.

MVP:
- User uploads CV.
- System extracts skills and matches to role requirements.
- Generates skill-gap score and a short upskilling roadmap.

Main risk:
- Crowded category, so differentiation must be sharp.

### 3. YardWatch
Theme match: `2. Monitoring Aktivitas Operasional`

Why it is strong:
- Real-time operations monitoring is visually compelling in a demo.
- Fraud and productivity are high-value business pains.
- Can combine computer vision events with a dashboard story.

MVP:
- Upload sample yard footage or event feed.
- Detect unsafe or suspicious operational events.
- Show alerts and productivity dashboard.

Main risk:
- Computer vision can become brittle if the dataset is weak.

### 4. TaniFlow
Theme match: `20. Digitalisasi Rantai Pasok & Distribusi Pangan`

Why it is strong:
- High societal relevance.
- Easy to connect impact to producers, distributors, and price stability.
- Good fit for route tracking, demand prediction, and inventory visibility.

MVP:
- Producer logs harvest and stock.
- Buyer sees availability and estimated delivery.
- System predicts spoilage or distribution risk.

Main risk:
- Scope can sprawl quickly if you try to build a full marketplace.

### 5. UMKM Trust Score
Theme match: `19. Akses Pembiayaan & Credit Scoring UMKM`

Why it is strong:
- High impact and strong AI narrative.
- Easy to explain economic relevance.
- Good potential for differentiation with alternative data.

MVP:
- Intake business profile and transaction summary.
- Produce transparent risk bands and funding readiness score.
- Explain key factors improving eligibility.

Main risk:
- Judges may attack data realism, fairness, and compliance if the prototype overclaims.

## One-Page Strategic Summary

### What this hackathon rewards
- `AI + Azure` is the highest-weight criterion, so the product must make AI visible in the main user flow.
- `Innovation` here should mean a sharper workflow and more credible execution, not a broad futuristic platform.
- `Design and usability` matter as much as innovation, so the UI cannot look like a technical admin demo only.
- `Social relevance` matters most when the impact can be explained in one sentence.

### What to optimize for
- One primary user.
- One painful workflow.
- One end-to-end demo loop.
- Two to four must-have features only.
- Honest architecture that judges can understand in under a minute.

### Best hackathon pattern for this brief
- Pick a narrow operational problem from the theme list.
- Use AI to remove a manual step, detect risk, or improve decision quality.
- Use Azure in a way the judge can see in the architecture and demo.
- Build a web prototype first because it is faster to polish and present than mobile.

### What to avoid
- Generic chatbot ideas with weak domain depth.
- Large marketplace or platform concepts with no strong core loop.
- Heavy dependence on proprietary or copyrighted data.
- Complex IoT or hardware requirements unless you can simulate them cleanly.
- Claims like `fully autonomous`, `production ready`, or `solves fraud` without proof.

### Best scoring strategy
- Win `30% AI + Azure` by making Azure services central to the workflow.
- Win `25% innovation` by choosing a specific, underserved operational pain point.
- Win `25% UX` with a clean step-by-step workflow, status labels, and visible outputs.
- Win `20% impact` by showing time saved, error reduction, safety improvement, or access expansion.

### Recommended build stack direction
- Frontend: React or Next.js web app.
- Hosting: Azure Static Web Apps.
- API: Azure Functions.
- AI layer: choose one to two Azure AI services that directly support the core loop.
- Data: synthetic or open data only, plus your own generated sample cases.

## Recommended Project Concept

### Pick: TraceCheck AI
One-line product:

`TraceCheck AI is an AI-powered verification assistant for pharma receiving and QA teams that checks incoming material labels and documents in seconds so they can reduce errors, delays, and compliance risk.`

### Why this is the best fit
- It directly matches a listed theme.
- It has a narrow and painful workflow.
- It shows real AI, not cosmetic AI.
- It is very demoable with synthetic inputs.
- It can be built honestly as a prototype in hackathon time.
- It maps well to all four rubric categories.

### Primary user
- Warehouse receiving staff or QA verifier in a pharma manufacturing environment.

### Problem one-line
- `Receiving teams manually verify material labels and supporting documents, causing delays, mismatch risk, and traceability errors before materials can be released.`

### Core demo loop
1. User uploads a delivery note, COA, and a label photo.
2. AI extracts key fields.
3. System compares the documents and finds mismatches.
4. Dashboard shows a confidence score, risk flags, and recommended action.
5. User exports or saves a verification report.

### Must-have features
- Multi-document OCR and field extraction.
- Cross-document validation.
- Risk scoring with plain-language explanation.
- Verification dashboard with audit trail.

### Nice-to-have only if time remains
- Barcode scan.
- Supplier history view.
- Trend analytics by mismatch type.
- Role-based approval flow.

### Rubric match

Innovation and novelty `25%`
- Not just OCR. The differentiator is cross-document validation plus action guidance.

Design and usability `25%`
- Simple 3-step flow: `upload -> verify -> decide`.
- Strong visual states: matched, warning, blocked.

AI and Azure usage `30%`
- Azure AI Document Intelligence for structured extraction from forms and documents.
- Azure Vision for image OCR if needed for label photos.
- Azure Language for explanation, summarization, or anomaly reasoning text.
- Azure Functions for validation logic.
- Azure Static Web Apps for delivery.

Benefit and social relevance `20%`
- Better material verification improves manufacturing quality, reduces operational waste, and supports safer downstream healthcare supply chains.

### Build honesty
What should be live:
- Upload flow.
- Extraction from sample documents.
- Validation logic.
- Risk result page.

What can be mocked carefully:
- ERP integration.
- Supplier master sync.
- Historical analytics beyond a few seeded cases.

### Suggested demo script
1. Show the current manual pain in 15 seconds.
2. Upload three materials-related files.
3. Let the system extract and compare fields live.
4. Surface one intentional mismatch such as expiry date or batch code.
5. Show `hold` recommendation and verification report.
6. Close with time saved, error reduction, and compliance value.

### Judge defense
- `Why is this better than a normal OCR tool?`
  Because the value is not extraction alone; it is validation, exception handling, and release decision support.
- `What is the hardest technical part?`
  Handling messy document layouts and resolving conflicting fields across sources.
- `Why is this realistic for a prototype?`
  The scope is one verification workflow with synthetic documents and live AI-assisted extraction.
- `How does it scale?`
  Add more document templates, integrate ERP data, and build supplier-level anomaly trends.

## Azure Fit Notes

As of April 30, 2026, Microsoft’s official Azure free-services pages show options that are compatible with this direction, including:
- Azure Static Web Apps free plan.
- Azure Functions with a monthly free grant.
- Azure AI Search with a free tier.
- Azure Language with an always-free quota.
- Azure Document Intelligence and Azure Vision free amounts for eligible free-account usage.

Before building, the team should verify region and account eligibility for the specific Azure services they choose.

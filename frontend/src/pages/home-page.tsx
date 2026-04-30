import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { TypedText } from "../components/typed-text";

const pathCards = [
  {
    eyebrow: "Features",
    title: "See the verification system end to end",
    description:
      "Understand how TraceCheck extracts material fields, surfaces discrepancies, and keeps QA review visible.",
    href: "/features",
    cta: "View features",
  },
  {
    eyebrow: "Workspace",
    title: "Run the intake workflow with your own documents",
    description:
      "Upload a delivery note, COA, and material label to verify alignment inside the live product workspace.",
    href: "/workspace",
    cta: "Open workspace",
  },
];

const tickerItems = [
  "Delivery Note",
  "Certificate of Analysis",
  "Material Label",
  "Expiry Check",
  "Batch Check",
  "QA Review",
  "Release Decision",
  "Azure OCR",
];

const workflowCards = [
  {
    icon: FileSearch,
    title: "Ingest",
    copy: "Load incoming supplier documents into one receiving queue.",
  },
  {
    icon: BrainCircuit,
    title: "Extract",
    copy: "Capture critical fields from text, image, or PDF inputs.",
  },
  {
    icon: ClipboardCheck,
    title: "Review",
    copy: "Confirm OCR output, correct misses, and approve verified values.",
  },
  {
    icon: ShieldCheck,
    title: "Decide",
    copy: "Generate a release, manual review, or hold recommendation with reasons.",
  },
];

export const HomePage = () => (
  <main className="route-main">
    <section className="home-hero">
      <div className="page-shell home-hero-shell">
        <div className="home-hero-grid">
          <div className="home-copy">
            <h1 className="route-title home-title">
              TraceCheck AI
            </h1>
            <TypedText
              as="p"
              className="lede home-lede"
              cursor
              startDelay={180}
              text="TraceCheck AI helps receiving and QA teams compare delivery notes, certificates of analysis, and material labels in one clear workflow."
              typingSpeed={12}
            />
            <div className="cta-row">
              <Link className="site-pill site-pill-strong site-pill-large" to="/workspace">
                Open workspace
              </Link>
              <Link className="site-pill site-pill-light site-pill-large" to="/features">
                Explore features
              </Link>
            </div>
          </div>

          <div className="home-visual">
            <div className="hero-image-frame">
              <img
                alt="TraceCheck AI hero product illustration"
                className="hero-image"
                src="/Hero-Image.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <div className="page-shell home-content">
      <section className="ticker-shell">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div className="ticker-chip" key={`${item}-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="route-section split-paths split-paths-shell">
        {pathCards.map((card) => (
          <article className="path-card" key={card.title}>
            <p className="eyebrow">{card.eyebrow}</p>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <Link className="inline-link" to={card.href}>
              {card.cta}
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </section>

      <section className="route-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Operational Loop</p>
            <h2 className="section-title">From intake desk to release decision.</h2>
          </div>
        </div>

        <div className="ops-grid">
          {workflowCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="ops-card" key={card.title}>
                <div className="ops-icon">
                  <Icon size={18} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  </main>
);

import { ArrowRight, Cloud, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { PanelHeader } from "../components/page";
import {
  documentKinds,
  getDocumentByKind,
  getProcessingLabel,
  useWorkspaceFlow,
  workspaceUploadAccept,
} from "../workspace";
import { workspacePaths } from "../routes";

export const WorkspaceUploadPage = () => {
  const {
    documents,
    integrationModeLabel,
    integrationStatus,
    updateDocument,
  } = useWorkspaceFlow();

  return (
    <div className="workspace">
      <section className="main-column">
        <article className="surface-card intake-card">
          <PanelHeader label="Document Intake" title="Upload source documents" />

          <p className="section-copy">
            Uploads pass through the TraceCheck flow first. Text files are parsed
            directly, while images and PDFs are prepared for OCR-backed extraction
            when the backend path is live.
          </p>

          <div className="upload-grid">
            {documentKinds.map((entry) => {
              const currentDocument = getDocumentByKind(documents, entry.kind);

              return (
                <label className="upload-card" key={entry.kind}>
                  <div className="upload-card-top">
                    <div>
                      <h3>{entry.label}</h3>
                      <p>{entry.helper}</p>
                    </div>
                    <div className="upload-icon">
                      <Upload size={18} />
                    </div>
                  </div>
                  <input
                    accept={workspaceUploadAccept}
                    className="sr-only"
                    onChange={(event) =>
                      updateDocument(entry.kind, event.target.files?.[0])
                    }
                    type="file"
                  />
                  <div className={`upload-slot ${currentDocument ? "" : "is-empty"}`.trim()}>
                    {currentDocument ? (
                      <>
                        <span className="upload-name">{currentDocument.displayName}</span>
                        <span className="upload-meta">
                          {getProcessingLabel(currentDocument)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true" className="upload-slot-icon">
                          <Upload size={18} />
                        </span>
                        <span className="upload-name">Add document</span>
                        <span className="upload-meta">
                          Click to attach a file to this slot
                        </span>
                      </>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </article>
      </section>

      <aside className="side-column">
        <article className="surface-card">
          <PanelHeader label="Upload Readiness" title="What this step prepares" />
          <ol className="workflow-list">
            <li>Collect the delivery note, COA, and material label.</li>
            <li>Capture extracted fields and processing metadata per file.</li>
            <li>Move into the QA review step with the OCR baseline preserved.</li>
          </ol>
          <Link
            className="site-pill site-pill-light workspace-step-cta"
            to={workspacePaths.review}
          >
            Continue to review
            <ArrowRight size={16} />
          </Link>
        </article>

        <article className="surface-card">
          <PanelHeader label="Integration Mode" title="Current processing path" />
          <div
            className={`integration-badge ${integrationStatus.readiness.binaryOcr === "azure" ? "is-live" : "is-fallback"}`}
          >
            <Cloud size={16} />
            {integrationModeLabel}
          </div>
          <p className="integration-note">
            {integrationStatus.reason ?? "TraceCheck is checking Azure connectivity."}
          </p>
        </article>

        <article className="surface-card">
          <PanelHeader label="Loaded Files" title="Current intake state" />
          <div className="workspace-mini-stack">
            {documentKinds.map((entry) => {
              const document = getDocumentByKind(documents, entry.kind);
              return (
                <div className="workspace-mini-row" key={entry.kind}>
                  <div>
                    <strong>{entry.label}</strong>
                    <span>{document?.displayName ?? "Waiting for upload"}</span>
                  </div>
                  <span className={`workspace-mini-pill ${document ? "is-ready" : ""}`}>
                    {document ? "Loaded" : "Empty"}
                  </span>
                </div>
              );
            })}
          </div>
        </article>
      </aside>
    </div>
  );
};

import {
  CheckCircle2,
  FileSearch,
  RefreshCcw,
} from "lucide-react";
import type {
  TraceDocument,
  TraceFieldKey,
} from "../../../../shared/types";
import {
  countDocumentOverrides,
  fieldLabels,
  fieldOrder,
  formatReviewedAt,
  reviewTheme,
} from "../../workspace";

type ReviewDocumentCardProps = {
  document?: TraceDocument;
  title: string;
  subtitle: string;
  onApprove: (documentId: string) => void;
  onResetToOcr: (documentId: string) => void;
  onRestoreField: (documentId: string, field: TraceFieldKey) => void;
  onUpdateField: (
    documentId: string,
    field: TraceFieldKey,
    value: string,
  ) => void;
};

export const ReviewDocumentCard = ({
  document,
  title,
  subtitle,
  onApprove,
  onResetToOcr,
  onRestoreField,
  onUpdateField,
}: ReviewDocumentCardProps) => {
  const reviewConfig = document
    ? reviewTheme[document.reviewStatus ?? "pending"]
    : null;

  return (
    <section className={`document-card ${document ? reviewConfig?.tone : ""}`}>
      <div className="document-card-head">
        <div>
          <h3>{title}</h3>
          <p>{document?.displayName ?? subtitle}</p>
        </div>
        {document ? (
          <div className="document-card-meta">
            <span className={`review-pill ${reviewConfig?.tone}`}>
              {reviewConfig?.label}
            </span>
            <span className="confidence-chip">
              {Math.round(document.confidence * 100)}% confidence
            </span>
          </div>
        ) : null}
      </div>

      {document ? (
        <>
          <div className="document-actions">
            <button
              className="mini-action"
              disabled={document.reviewStatus === "approved"}
              onClick={() => onApprove(document.id)}
              type="button"
            >
              <CheckCircle2 size={15} />
              Approve review
            </button>
            <button
              className="mini-action"
              disabled={!countDocumentOverrides(document)}
              onClick={() => onResetToOcr(document.id)}
              type="button"
            >
              <RefreshCcw size={15} />
              Reset to OCR
            </button>
          </div>

          <p className="reviewed-at">
            Reviewed: {formatReviewedAt(document.reviewedAt)}
          </p>

          <div className="field-list">
            {fieldOrder.map((field) => {
              const currentValue = document.extractedFields[field] ?? "";
              const ocrValue = document.ocrExtractedFields?.[field] ?? "";
              const isOverridden = currentValue.trim() !== ocrValue.trim();

              return (
                <div
                  className={`field-editor ${isOverridden ? "is-overridden" : ""}`}
                  key={field}
                >
                  <div className="field-label-row">
                    <span>{fieldLabels[field]}</span>
                    <strong>
                      {isOverridden ? "Manual override" : "Matches OCR"}
                    </strong>
                  </div>
                  <input
                    aria-label={`${title} ${fieldLabels[field]}`}
                    className={`field-input ${isOverridden ? "is-overridden" : ""}`}
                    onChange={(event) =>
                      onUpdateField(document.id, field, event.target.value)
                    }
                    placeholder="Not found"
                    type="text"
                    value={currentValue}
                  />
                  <div className="field-helper-row">
                    <span className="field-helper">
                      OCR baseline: {ocrValue || "No OCR value detected"}
                    </span>
                    {isOverridden ? (
                      <button
                        className="field-restore"
                        onClick={() => onRestoreField(document.id, field)}
                        type="button"
                      >
                        Restore field
                      </button>
                    ) : (
                      <span className="field-helper subtle">
                        Verified output is aligned with the captured OCR field.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ul className="note-list">
            {document.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      ) : (
        <div className="empty-card">
          <FileSearch size={24} />
          <p>This slot is waiting for a document.</p>
        </div>
      )}
    </section>
  );
};

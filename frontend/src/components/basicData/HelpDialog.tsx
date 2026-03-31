type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function HelpDialog({ open, title, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="bd-modal-root" role="presentation" onClick={onClose}>
      <div
        className="bd-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bd-help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bd-modal-header">
          <h2 id="bd-help-title" style={{ margin: 0, fontSize: "1.05rem" }}>
            {title}
          </h2>
          <button type="button" className="bd-modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className="bd-modal-body">{children}</div>
      </div>
    </div>
  );
}

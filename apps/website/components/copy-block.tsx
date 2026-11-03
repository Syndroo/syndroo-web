import { ui } from "@syndroo/content/site-data";
import type { Locale } from "@syndroo/content/site-data";

export function CopyBlock({
  locale,
  id,
  label,
  code,
}: {
  locale: Locale;
  id: string;
  label: string;
  code: string;
}): React.JSX.Element {
  const messages = ui[locale].docs;
  return (
    <div className="copy-block">
      <div className="copy-block__head">
        <span>{label}</span>
        <span className="copy-block__actions">
          <button
            className="copy-btn"
            type="button"
            data-copy-target={id}
            aria-label={messages.copyCode}
          >
            <span className="copy-btn__label">{messages.copy}</span>
          </button>
          <span className="copy-status" role="status" aria-live="polite"></span>
        </span>
      </div>
      <pre id={id}><code>{code}</code></pre>
    </div>
  );
}

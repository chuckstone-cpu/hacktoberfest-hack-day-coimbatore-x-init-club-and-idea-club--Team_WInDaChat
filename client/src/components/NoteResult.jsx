import { TagList } from './TagChip.jsx';
import { linkColor, linkLabel } from '../linkTypes.js';

// What Gemma did with a newly saved note: summary, tags and the links it made.
export default function NoteResult({ result, nodesById }) {
  const { summary, terms, links, tagError, linkError } = result;
  return (
    <div className="flex flex-col gap-3">
      {tagError ? (
        <p className="text-sm text-warn-ink">Note saved, but tagging failed. {tagError}</p>
      ) : (
        <p className="font-display text-lg font-semibold leading-snug text-ink">{summary}</p>
      )}
      <TagList terms={terms} />

      {!tagError && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          {linkError ? (
            <p className="text-sm text-warn-ink">{linkError}</p>
          ) : (
            <p className="text-sm font-medium text-muted">
              {links.length === 0
                ? 'No strong connections to older notes.'
                : `Linked to ${links.length} note${links.length > 1 ? 's' : ''}`}
            </p>
          )}
          {links.map((l) => (
            <div key={l.dst} className="text-sm">
              <span className="font-medium" style={{ color: linkColor(l.type) }}>{linkLabel(l.type)}</span>
              <span className="text-ink"> → {nodesById.get(l.dst)?.label ?? `Note #${l.dst}`}</span>
              <p className="text-muted">{l.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

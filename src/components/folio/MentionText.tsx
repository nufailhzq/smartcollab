import Link from "next/link";
import { Fragment } from "react";
import { MATRIC_MENTION_REGEX } from "@/schemas/folio";

type Props = {
  content: string;
  /** Set of matric numbers (uppercased) that resolved to real users. */
  resolvedMatrics?: Set<string>;
};

/**
 * Renders post text with @matric mentions converted to links to the
 * mentioned student's Folio profile. Falls back to plain text for matrics
 * that did not resolve to a real user.
 */
export function MentionText({ content, resolvedMatrics }: Props) {
  if (!content) return null;
  const segments: Array<React.ReactNode> = [];
  let cursor = 0;
  let key = 0;

  // Reset lastIndex because we share a global regex.
  const re = new RegExp(MATRIC_MENTION_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const idx = match.index;
    if (idx > cursor) {
      segments.push(<Fragment key={key++}>{content.slice(cursor, idx)}</Fragment>);
    }
    const matric = match[1]!;
    const upper = matric.toUpperCase();
    const isResolved = resolvedMatrics ? resolvedMatrics.has(upper) : true;
    if (isResolved) {
      segments.push(
        <Link
          key={key++}
          href={`/folio/u/${upper.toLowerCase()}`}
          className="font-semibold text-ukm-teal hover:underline"
        >
          @{matric}
        </Link>,
      );
    } else {
      segments.push(<Fragment key={key++}>@{matric}</Fragment>);
    }
    cursor = idx + match[0].length;
  }
  if (cursor < content.length) {
    segments.push(<Fragment key={key++}>{content.slice(cursor)}</Fragment>);
  }
  return <>{segments}</>;
}

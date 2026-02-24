import { Fragment } from "react";

interface RichTextContentProps {
  text?: string;
  className?: string;
}

const BULLET_PATTERN = /^[-*•]\s+/;

function renderInlineBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

export function RichTextContent({ text = "", className = "" }: RichTextContentProps) {
  const lines = text.split("\n");
  const nodes: JSX.Element[] = [];
  let paragraphLines: string[] = [];
  let bulletLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const joined = paragraphLines.join(" ").trim();
    if (!joined) {
      paragraphLines = [];
      return;
    }
    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-relaxed">
        {renderInlineBold(joined)}
      </p>
    );
    paragraphLines = [];
  };

  const flushBullets = () => {
    if (bulletLines.length === 0) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="list-disc list-inside space-y-2 ml-4">
        {bulletLines.map((line, idx) => (
          <li key={`${idx}`}>{renderInlineBold(line)}</li>
        ))}
      </ul>
    );
    bulletLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }

    if (BULLET_PATTERN.test(line)) {
      flushParagraph();
      bulletLines.push(line.replace(BULLET_PATTERN, ""));
      continue;
    }

    flushBullets();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushBullets();

  return <div className={`space-y-3 ${className}`.trim()}>{nodes}</div>;
}

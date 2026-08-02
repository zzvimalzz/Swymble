import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../../motion/Reveal';
import { CLEAR_SIGNAL, runCommand, type TerminalContext, type TerminalLine } from './terminalCommands';

type Block = {
  id: number;
  input: string;
  output: TerminalLine[];
};

const BOOT: TerminalLine[] = [
  { text: 'swymble shell :: career.git mounted read-only', tone: 'accent' },
  { text: 'type "help" for commands, or just poke around.', tone: 'muted' },
];

const SUGGESTIONS = ['whoami', 'git log', 'git branch', 'cat README.md', 'stack', 'ls labs'];

const OutputLine = ({ line }: { line: TerminalLine }) => {
  const className = `terminal__line${line.tone ? ` terminal__line--${line.tone}` : ''}`;

  if (line.href) {
    return line.href.startsWith('/') ? (
      <Link className={`${className} terminal__link`} to={line.href}>
        {line.text}
      </Link>
    ) : (
      <a
        className={`${className} terminal__link`}
        href={line.href}
        {...(line.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {line.text}
      </a>
    );
  }

  return <span className={className}>{line.text || ' '}</span>;
};

/**
 * A real (if small) shell over the career data. Everything it prints comes from the same source
 * the graph and the log render, so it can't drift into fiction; the interpreter itself lives in
 * terminalCommands.ts and is covered by tests.
 */
export default function CareerTerminal({ context }: { context: TerminalContext }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    // Follow the output rather than the page: the terminal scrolls its own screen.
    screenRef.current?.scrollTo({ top: screenRef.current.scrollHeight });
  }, [blocks]);

  const submit = (raw: string) => {
    const command = raw.trim();
    if (!command) return;

    const output = runCommand(command, context);
    setHistory((current) => [command, ...current]);
    setHistoryIndex(null);
    setValue('');

    if (output.length === 1 && output[0].text === CLEAR_SIGNAL) {
      setBlocks([]);
      return;
    }

    nextId.current += 1;
    setBlocks((current) => [...current, { id: nextId.current, input: command, output }]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit(value);
      return;
    }

    // Shell-style history recall. `historyIndex` counts back from the most recent command.
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const next = historyIndex === null ? 0 : Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      setValue(history[next]);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex === null) return;
      const next = historyIndex - 1;
      if (next < 0) {
        setHistoryIndex(null);
        setValue('');
        return;
      }
      setHistoryIndex(next);
      setValue(history[next]);
    }
  };

  return (
    <Reveal as="section" className="terminal-section" id="shell" y={24} margin="-80px">
      <div className="terminal-section__head">
        <p className="about-section__kicker">05 &middot; /bin/swymble</p>
        <h2 className="about-section__heading">Ask it yourself</h2>
        <p className="about-section__lede">
          Everything above, queryable. It runs against the same data the graph does. Try{' '}
          <code>git log</code>, <code>git show</code> on any sha, or <code>whoami</code>.
        </p>
      </div>

      <div
        className="terminal"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <div className="terminal__chrome">
          <span className="terminal__dot terminal__dot--red" />
          <span className="terminal__dot terminal__dot--amber" />
          <span className="terminal__dot terminal__dot--green" />
          <span className="terminal__chrome-title">swymble &middot; zsh &middot; 80×24</span>
        </div>

        <div className="terminal__screen" ref={screenRef}>
          {BOOT.map((line) => (
            <OutputLine key={line.text} line={line} />
          ))}

          {blocks.map((block) => (
            <div key={block.id} className="terminal__block">
              <span className="terminal__echo">
                <span className="terminal__prompt">~/swymble $</span> {block.input}
              </span>
              {block.output.map((line, index) => (
                <OutputLine key={`${block.id}-${index}`} line={line} />
              ))}
            </div>
          ))}

          <label className="terminal__inputline">
            <span className="terminal__prompt">~/swymble $</span>
            <input
              ref={inputRef}
              className="terminal__input"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal input. Type a command and press Enter."
              placeholder="type a command…"
            />
          </label>
        </div>
      </div>

      <div className="terminal__suggestions">
        <span className="terminal__suggestions-label">Try</span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="terminal__suggestion"
            onClick={() => {
              submit(suggestion);
              inputRef.current?.focus();
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </Reveal>
  );
}

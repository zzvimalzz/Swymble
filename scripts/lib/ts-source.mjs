// Reading data out of the repo's hand-written TypeScript data files, from Node, without a build.
//
// The data under src/data is plain object literals in .ts files. Node can strip the types, but
// several of those files import values from other .ts files using extensionless relative
// specifiers, which ESM resolution rejects — so a native import() of them fails. Rather than
// reshaping data files to suit the build scripts, these helpers read the fields out of the
// source text.
//
// They are deliberately not a TypeScript parser. They handle exactly the shapes the data files
// use — string fields, string arrays, and arrays of objects with string fields — and they walk
// string literals properly rather than pattern-matching them, because the content is prose and
// prose contains brackets, colons and apostrophes.

/**
 * Reads the string literal whose opening quote is at `index`.
 * Returns `{ value, end }` where `end` is the index just past the closing quote, or null if
 * `index` is not the start of a string literal.
 */
export const readStringLiteral = (source, index) => {
  const quote = source[index];

  if (quote !== "'" && quote !== '"' && quote !== '`') {
    return null;
  }

  let value = '';

  for (let cursor = index + 1; cursor < source.length; cursor += 1) {
    const char = source[cursor];

    if (char === '\\') {
      const escaped = source[cursor + 1];
      value += escaped === 'n' ? '\n' : escaped === 't' ? '\t' : escaped;
      cursor += 1;
      continue;
    }

    if (char === quote) {
      return { value, end: cursor + 1 };
    }

    value += char;
  }

  return null;
};

const skipWhitespace = (source, index) => {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
  return cursor;
};

/** `key: 'value'` → `'value'`. Null when the key is absent or its value is not a plain string. */
export const readStringField = (source, key) => {
  const match = new RegExp(`\\b${key}\\s*:\\s*`).exec(source);
  if (!match) return null;

  const literal = readStringLiteral(source, skipWhitespace(source, match.index + match[0].length));
  return literal?.value ?? null;
};

/** Index just past the opener of `key`'s `[` or `{` value, or null if the key is absent. */
export const findBlockStart = (source, key, opener) => {
  const match = new RegExp(`\\b${key}\\s*:\\s*\\${opener}`).exec(source);
  return match ? match.index + match[0].length : null;
};

/**
 * The slice between the opener at `start - 1` and its matching closer. String literals are
 * skipped over, so a bracket inside prose cannot unbalance the count.
 */
export const readBalancedBlock = (source, start, opener, closer) => {
  let depth = 1;

  for (let cursor = start; cursor < source.length; cursor += 1) {
    const char = source[cursor];

    if (char === "'" || char === '"' || char === '`') {
      const literal = readStringLiteral(source, cursor);
      if (literal) {
        cursor = literal.end - 1;
        continue;
      }
    }

    if (char === opener) depth += 1;
    else if (char === closer) {
      depth -= 1;
      if (depth === 0) return source.slice(start, cursor);
    }
  }

  return null;
};

/** `key: ['a', 'b']` → `['a', 'b']`. Empty array when the key is absent. */
export const readStringArrayField = (source, key) => {
  const start = findBlockStart(source, key, '[');
  if (start === null) return [];

  const body = readBalancedBlock(source, start, '[', ']');
  if (body === null) return [];

  const values = [];

  for (let cursor = 0; cursor < body.length; cursor += 1) {
    const literal = readStringLiteral(body, cursor);
    if (literal) {
      values.push(literal.value);
      cursor = literal.end - 1;
    }
  }

  return values;
};

/** Splits a `[{…}, {…}]` body into its top-level object bodies. */
export const splitObjectEntries = (body) => {
  const entries = [];

  for (let cursor = 0; cursor < body.length; cursor += 1) {
    if (body[cursor] !== '{') continue;

    const objectBody = readBalancedBlock(body, cursor + 1, '{', '}');
    if (objectBody === null) break;

    entries.push(objectBody);
    cursor += objectBody.length + 1;
  }

  return entries;
};

/**
 * `export const NAME: SomeType[] = [{…}, …]` → the object bodies, reading only `fields`.
 *
 * Separate from readObjectArrayField because a top-level export carries a type annotation
 * between the name and the `=`, so it does not look like an object key at all.
 */
export const readExportedObjectArray = (source, name, fields) => {
  const match = new RegExp(`export const ${name}\\b[^=]*=\\s*\\[`).exec(source);
  if (!match) return [];

  const body = readBalancedBlock(source, match.index + match[0].length, '[', ']');
  if (body === null) return [];

  return splitObjectEntries(body).map((objectBody) =>
    Object.fromEntries(fields.map((field) => [field, readStringField(objectBody, field) ?? ''])),
  );
};

/** `key: [{ a: '…' }, …]` → `[{ a: '…' }, …]`, reading only the string fields named in `fields`. */
export const readObjectArrayField = (source, key, fields) => {
  const start = findBlockStart(source, key, '[');
  if (start === null) return [];

  const body = readBalancedBlock(source, start, '[', ']');
  if (body === null) return [];

  return splitObjectEntries(body).map((objectBody) =>
    Object.fromEntries(fields.map((field) => [field, readStringField(objectBody, field) ?? ''])),
  );
};

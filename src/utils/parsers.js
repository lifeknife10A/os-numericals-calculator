export function parseNumberList(text, label) {
  const tokens = String(text)
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error(`${label} cannot be empty.`);
  }

  const values = tokens.map((token) => Number(token));
  const hasInvalidValue = values.some((value) => !Number.isFinite(value));

  if (hasInvalidValue) {
    throw new Error(`${label} must contain only numbers.`);
  }

  return values;
}

export function parseIntegerList(text, label) {
  const values = parseNumberList(text, label);
  const hasInvalidValue = values.some((value) => !Number.isInteger(value));

  if (hasInvalidValue) {
    throw new Error(`${label} must contain only whole numbers.`);
  }

  return values;
}

export function parseMatrix(text, rows, columns, label) {
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length !== rows) {
    throw new Error(`${label} must have ${rows} rows.`);
  }

  return lines.map((line, rowIndex) => {
    const values = parseNumberList(line, `${label} row ${rowIndex + 1}`);

    if (values.length !== columns) {
      throw new Error(`${label} row ${rowIndex + 1} must have ${columns} values.`);
    }

    return values;
  });
}

export function parsePageTable(text) {
  const entries = {};
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Page table cannot be empty.");
  }

  lines.forEach((line) => {
    const parts = line.split(/[:=\s,]+/).filter(Boolean);

    if (parts.length < 2) {
      throw new Error("Use page table format like 0:3 or 0 3.");
    }

    const pageNumber = Number(parts[0]);
    const frameNumber = Number(parts[1]);

    if (!Number.isInteger(pageNumber) || !Number.isInteger(frameNumber)) {
      throw new Error("Page table page and frame values must be whole numbers.");
    }

    entries[pageNumber] = frameNumber;
  });

  return entries;
}

export function parseSegmentTable(text) {
  const entries = {};
  const lines = String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("Segment table cannot be empty.");
  }

  lines.forEach((line) => {
    const parts = line.split(/[:=\s,]+/).filter(Boolean);

    if (parts.length < 3) {
      throw new Error("Use segment table format like 0:1000:400 or 0 1000 400.");
    }

    const segmentNumber = Number(parts[0]);
    const baseAddress = Number(parts[1]);
    const limit = Number(parts[2]);

    if (
      !Number.isInteger(segmentNumber) ||
      !Number.isFinite(baseAddress) ||
      !Number.isFinite(limit)
    ) {
      throw new Error("Segment number, base, and limit must be valid numbers.");
    }

    entries[segmentNumber] = {
      baseAddress,
      limit,
    };
  });

  return entries;
}

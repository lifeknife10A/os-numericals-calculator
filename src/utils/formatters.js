export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  const numberValue = Number(value);

  if (Number.isInteger(numberValue)) {
    return String(numberValue);
  }

  return Number(numberValue.toFixed(4)).toString();
}

export function formatVector(values) {
  return `[${values
    .map((value) => (typeof value === "boolean" ? (value ? "True" : "False") : formatNumber(value)))
    .join(", ")}]`;
}

export function sumValues(values) {
  return values.reduce((total, value) => total + Number(value), 0);
}

export function averageValues(values) {
  if (values.length === 0) {
    return 0;
  }

  return sumValues(values) / values.length;
}

export function isPowerOfTwo(value) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return false;
  }

  return (numberValue & (numberValue - 1)) === 0;
}

const recentCalculationsKey = "os-numericals-recent-calculations";

export function getRecentCalculations() {
  try {
    const savedValue = localStorage.getItem(recentCalculationsKey);
    return savedValue ? JSON.parse(savedValue) : [];
  } catch {
    return [];
  }
}

export function saveRecentCalculation(moduleName, summary) {
  try {
    const oldItems = getRecentCalculations();
    const newItem = {
      id: Date.now(),
      moduleName,
      summary,
      time: new Date().toLocaleString(),
    };
    const newItems = [newItem, ...oldItems].slice(0, 8);
    localStorage.setItem(recentCalculationsKey, JSON.stringify(newItems));
    window.dispatchEvent(new Event("recent-calculations-updated"));
  } catch {
    // Local storage is optional for this app.
  }
}

export function clearRecentCalculations() {
  localStorage.removeItem(recentCalculationsKey);
  window.dispatchEvent(new Event("recent-calculations-updated"));
}

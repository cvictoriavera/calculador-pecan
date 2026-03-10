let cachedTrialMode: boolean | null = null;

export function isTrialMode(): boolean {
  if (cachedTrialMode === null) {
    cachedTrialMode = localStorage.getItem('isTrialMode') === 'true';
  }
  return cachedTrialMode;
}

export function setTrialMode(value: boolean): void {
  cachedTrialMode = value;
  localStorage.setItem('isTrialMode', value.toString());
}

export function clearTrialModeCache(): void {
  cachedTrialMode = null;
}

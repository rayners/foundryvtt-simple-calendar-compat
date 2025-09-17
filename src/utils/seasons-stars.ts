const MODULE_ID = 'seasons-and-stars';

export interface SeasonsStarsExposure {
  global: any | null;
  module: any | null;
  namespace: any | null;
}

/**
 * Collect all known exposure points for the Seasons & Stars module.
 */
export function collectSeasonsStarsExposure(): SeasonsStarsExposure {
  const gameAny = game as any;
  const global = gameAny?.seasonsStars ?? gameAny?.seasonsAndStars ?? null;
  const module = (game.modules?.get(MODULE_ID) as any) ?? null;
  const windowAny = window as any;
  const namespace =
    windowAny?.SeasonsStars ?? windowAny?.SeasonsAndStars ?? windowAny?.SeasonsStarsCore ?? null;

  return { global, module, namespace };
}

function isIntegrationCandidate(candidate: any): boolean {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const hasApi = 'api' in candidate && typeof candidate.api === 'object';
  const hasHooks = 'hooks' in candidate && typeof candidate.hooks === 'object';
  const available = candidate.isAvailable === undefined ? true : !!candidate.isAvailable;

  return hasApi && hasHooks && available;
}

function callDetectionFunction(fn: (() => unknown) | undefined, context: unknown): any | null {
  if (typeof fn !== 'function') {
    return null;
  }

  try {
    return fn.call(context);
  } catch (error) {
    console.warn('Seasons & Stars integration detection failed:', error);
    return null;
  }
}

/**
 * Resolve the Seasons & Stars integration interface regardless of how the module exposes it.
 */
export function resolveSeasonsStarsIntegration(
  exposure: SeasonsStarsExposure = collectSeasonsStarsExposure()
): any | null {
  const { global, module, namespace } = exposure;

  const candidates = [
    global?.integration,
    module?.integration,
    module?.api?.integration,
    namespace?.integration,
  ];

  for (const candidate of candidates) {
    if (isIntegrationCandidate(candidate)) {
      return candidate;
    }
  }

  const detectionFns: Array<{ fn: (() => unknown) | undefined; context: unknown }> = [
    { fn: global?.integration?.detect, context: global?.integration },
    { fn: module?.integration?.detect, context: module?.integration },
    { fn: module?.api?.integration?.detect, context: module?.api?.integration },
    { fn: namespace?.integration?.detect, context: namespace?.integration },
    { fn: namespace?.detectIntegration, context: namespace },
    { fn: namespace?.detect, context: namespace },
  ];

  for (const { fn, context } of detectionFns) {
    const detected = callDetectionFunction(fn, context);
    if (isIntegrationCandidate(detected)) {
      return detected;
    }
  }

  return null;
}

function isCalendarApi(candidate: any): boolean {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const hasCurrentDate = typeof candidate.getCurrentDate === 'function';
  const hasWorldTimeToDate = typeof candidate.worldTimeToDate === 'function';
  const hasDateToWorldTime = typeof candidate.dateToWorldTime === 'function';

  return hasCurrentDate && (hasWorldTimeToDate || hasDateToWorldTime);
}

/**
 * Resolve the Seasons & Stars calendar API regardless of exposure style.
 */
export function resolveSeasonsStarsAPI(
  exposure: SeasonsStarsExposure = collectSeasonsStarsExposure(),
  integration: any = resolveSeasonsStarsIntegration(exposure)
): any | null {
  if (integration?.api && isCalendarApi(integration.api)) {
    return integration.api;
  }

  const { global, module, namespace } = exposure;

  const candidates = [
    global?.api,
    global?.calendar,
    module?.api,
    module?.api?.calendar,
    module?.calendar,
    namespace?.api,
    namespace?.calendar,
    namespace,
  ];

  for (const candidate of candidates) {
    if (isCalendarApi(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Resolve the module version from any available exposure.
 */
export function resolveSeasonsStarsVersion(
  exposure: SeasonsStarsExposure = collectSeasonsStarsExposure(),
  integration: any = resolveSeasonsStarsIntegration(exposure)
): string | null {
  const { global, module, namespace } = exposure;

  const versions = [
    integration?.version,
    module?.version,
    module?.data?.version,
    module?.api?.version,
    global?.version,
    global?.api?.version,
    namespace?.version,
  ];

  for (const version of versions) {
    if (typeof version === 'string' && version.length > 0) {
      return version;
    }
  }

  return null;
}

/**
 * Resolve widget classes exposed by Seasons & Stars (for sidebar button integration, etc.).
 */
export function resolveSeasonsStarsWidgetClass(
  widgetName: string,
  exposure: SeasonsStarsExposure = collectSeasonsStarsExposure()
): any | null {
  const { global, module, namespace } = exposure;

  const candidates = [
    namespace?.[widgetName],
    namespace?.widgets?.[widgetName],
    namespace?.ui?.[widgetName],
    namespace?.components?.[widgetName],
    global?.[widgetName],
    global?.widgets?.[widgetName],
    module?.api?.widgets?.[widgetName],
    module?.widgets?.[widgetName],
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

/**
 * Convenience helper to determine if any Seasons & Stars exposure is available.
 */
export function hasSeasonsStarsExposure(
  exposure: SeasonsStarsExposure = collectSeasonsStarsExposure()
): boolean {
  return !!(exposure.global || exposure.module || exposure.namespace);
}

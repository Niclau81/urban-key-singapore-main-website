/**
 * Managed Maps credential metadata.
 *
 * The platform-issued frontend credential can temporarily remain bound to the
 * preview origin that existed when it was provisioned. Keeping that binding in
 * one metadata module makes it auditable and replaceable without coupling the
 * relay implementation to a sandbox hostname.
 *
 * Production can override this value with MAPS_CREDENTIAL_ORIGINS (a
 * comma-separated list of absolute HTTPS origins). The request's actual origin
 * is still tried first by the relay, so published and custom domains take
 * precedence whenever the platform has registered them.
 */
const PROVISIONED_MAPS_CREDENTIAL_ORIGINS = [
  "https://3000-igilwc6tytceqafieei6y-570834de.sg1.manus.computer",
] as const;

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getMapsCredentialOrigins(
  configuredValue = process.env.MAPS_CREDENTIAL_ORIGINS,
): string[] {
  const configuredOrigins = configuredValue
    ?.split(",")
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

  return Array.from(
    new Set(
      configuredOrigins?.length
        ? configuredOrigins
        : PROVISIONED_MAPS_CREDENTIAL_ORIGINS,
    ),
  );
}

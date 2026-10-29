/* BACKEND SECURITY */
import * as Sentry from "@sentry/node";

let nodeProfilingIntegration = null;

try {
    ({ nodeProfilingIntegration } = await import("@sentry/profiling-node"));
} catch (error) {
    console.warn("Sentry profiling integration unavailable in this environment:", error.message);
}

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: nodeProfilingIntegration ? [nodeProfilingIntegration()] : [],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0
});
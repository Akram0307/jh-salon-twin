import { ErrorReporting } from '@google-cloud/error-reporting';

let errorReportingClient: ErrorReporting | null = null;

export function getErrorReporting(): ErrorReporting | null {
  if (errorReportingClient) return errorReportingClient;
  
  const projectId = process.env.GCP_PROJECT_ID;
  const serviceName = process.env.SERVICE_NAME || 'salonos-backend';
  const enabled = process.env.OTEL_ENABLED === 'true' || process.env.NODE_ENV === 'production';
  
  if (!enabled || !projectId) {
    return null;
  }
  
  try {
    errorReportingClient = new ErrorReporting({
      projectId,
      serviceContext: { service: serviceName },
      reportMode: 'always',
    });
    return errorReportingClient;
  } catch (err) {
    console.error('[ERROR_REPORTING] Failed to initialize:', err);
    return null;
  }
}

export function reportError(error: Error, context?: Record<string, unknown>): void {
  const client = getErrorReporting();
  if (client) {
    client.report(error, context);
  }
}

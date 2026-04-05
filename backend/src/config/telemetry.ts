
import logger from './logger';
let telemetry: import('@opentelemetry/sdk-node').NodeSDK | null = null;

export async function startTelemetry() {
  if (telemetry) return;
  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { resourceFromAttributes } = await import('@opentelemetry/resources');
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'https://otlp.googleapis.com/v1/traces'
    });

    telemetry = new NodeSDK({
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
      resource: resourceFromAttributes({
        [SemanticResourceAttributes.SERVICE_NAME]: 'salonos-backend'
      })
    });

    await telemetry.start();
    logger.info('✅ OpenTelemetry started');
  } catch (err) {
    logger.error({ err: err }, 'Telemetry start failed (non-fatal):');
  }
}

export async function shutdownTelemetry() {
  if (telemetry) {
    try {
      await telemetry.shutdown();
    } catch (err) {
      logger.error({ err: err }, 'Telemetry shutdown failed:');
    }
  }
}

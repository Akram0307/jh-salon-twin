import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'https://otlp.googleapis.com/v1/traces'
});

export const telemetry = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: 'salonos-backend'
  })
});

export async function startTelemetry() {
  try {
    await telemetry.start();
    console.log('✅ OpenTelemetry started');
  } catch (err) {
    console.error('Telemetry start failed:', err);
  }
}

import { PubSub } from '@google-cloud/pubsub';

const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

export const pubsub = new PubSub({ projectId });

export async function publishEvent(topicName: string, payload: any) {
  const topic = pubsub.topic(topicName);
  const dataBuffer = Buffer.from(JSON.stringify(payload));

  const messageId = await topic.publishMessage({ data: dataBuffer });

  console.log(`📨 Pub/Sub event published to ${topicName}: ${messageId}`);

  return messageId;
}

export function subscribe(topicName: string, subscriptionName: string, handler: (data: any) => Promise<void>) {
  const subscription = pubsub.topic(topicName).subscription(subscriptionName);

  subscription.on('message', async (message) => {
    try {
      const data = JSON.parse(message.data.toString());

      await handler(data);

      message.ack();
    } catch (err) {
      console.error('Pub/Sub handler error:', err);
      message.nack();
    }
  });

  console.log(`✅ Subscribed to ${topicName}/${subscriptionName}`);
}

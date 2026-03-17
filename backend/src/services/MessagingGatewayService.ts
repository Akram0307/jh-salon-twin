import Twilio from 'twilio';

import logger from '../config/logger';

export type MessageChannel = 'whatsapp' | 'sms';

export interface MessagePayload {
  channel: MessageChannel;
  to: string;
  template?: string;
  variables?: Record<string, string>;
  body?: string;
  salonId?: string;
}

export class MessagingGatewayService {
  private client: Twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
    const authToken = process.env.TWILIO_AUTH_TOKEN as string;

    this.client = Twilio(accountSid, authToken);

    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!this.fromNumber) {
      logger.warn('TWILIO_WHATSAPP_NUMBER not configured');
    }
  }

  async send(payload: MessagePayload) {
    if (payload.template) {
      return this.sendTemplateMessage(payload);
    }

    if (payload.body) {
      return this.sendTextMessage(payload);
    }

    throw new Error('Invalid message payload');
  }

  private async sendTextMessage(payload: MessagePayload) {
    const to = this.formatTo(payload.channel, payload.to);
    const from = this.formatTo(payload.channel, this.fromNumber);

    const message = await this.client.messages.create({
      to,
      from,
      body: payload.body
    });

    return message.sid;
  }

  private async sendTemplateMessage(payload: MessagePayload) {
    if (!payload.template) {
      throw new Error('Template name required');
    }

    const to = this.formatTo(payload.channel, payload.to);
    const from = this.formatTo(payload.channel, this.fromNumber);

    const contentSid = payload.template;

    const message = await this.client.messages.create({
      to,
      from,
      contentSid,
      contentVariables: JSON.stringify(payload.variables || {})
    } as any);

    return message.sid;
  }

  private formatTo(channel: MessageChannel, number: string) {
    if (channel === 'whatsapp') {
      if (number.startsWith('whatsapp:')) return number;
      return `whatsapp:${number}`;
    }

    return number;
  }
}

export const messagingGateway = new MessagingGatewayService();

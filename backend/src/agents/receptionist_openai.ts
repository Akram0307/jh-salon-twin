import OpenAI from 'openai';
import { ClientRepository } from '../repositories/ClientRepository';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { StaffRepository } from '../repositories/StaffRepository';

import logger from '../config/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

const sessions = new Map<string, any>();

const SYSTEM_PROMPT = `You are Aura, the AI receptionist for JH Salon Twin. Be warm, short, and WhatsApp-friendly.`;

export async function handleIncomingMessage(from: string, message: string): Promise<string> {
  const normalizedPhone = from.replace('whatsapp:', '');
  const text = message.toLowerCase().trim();

  let session = sessions.get(normalizedPhone);

  if (!session) {
    const client = await ClientRepository.findByPhone(normalizedPhone);

    session = {
      phone: normalizedPhone,
      clientId: client?.id || null,
      state: client ? 'READY' : 'ONBOARDING_NAME',
      history: [],
      context: {},
      bookingSession: {
        state: 'BOOKING_INIT',
        serviceId: null,
        preferredDate: null,
        availableSlots: [],
        selectedSlot: null
      }
    };

    sessions.set(normalizedPhone, session);
  }

  const booking = session.bookingSession;

  // Cancel anytime
  if (text.includes('cancel')) {
    session.bookingSession = {
      state: 'BOOKING_INIT',
      serviceId: null,
      preferredDate: null,
      availableSlots: [],
      selectedSlot: null
    };
    return 'No problem. I cancelled the booking process. How else can I help?';
  }

  // Onboarding
  if (session.state === 'ONBOARDING_NAME') {
    session.context.name = message.trim();
    session.state = 'ONBOARDING_PREFS';

    return `Hi ${message.trim()}! Welcome to JH Salon Twin. What service would you like today?`;
  }

  if (session.state === 'ONBOARDING_PREFS') {
    const service = message.toLowerCase();

    const newClient = await ClientRepository.create({
      phone_number: normalizedPhone,
      full_name: session.context.name,
      preferences: service
    });

    session.clientId = newClient.id;
    session.state = 'READY';

    return `Great! You're all set. Would you like to book an appointment today?`;
  }

  session.history.push({ role: 'user', content: message });
const userText = message.toLowerCase();

  const intent = classifyIntent(message);

  if (intent === 'BOOKING' || booking.state !== 'BOOKING_INIT') {

    if (booking.state === 'BOOKING_INIT') {
      const services = await ServiceRepository.findAll();
      let match = services.find((s: any) => text.includes(s.name.toLowerCase()));
      if (!match && text.includes("hair")) {
        match = services.find((s: any) => s.name.toLowerCase().includes("hair"));
      }
      if (match) {
        booking.serviceId = match.id;
        booking.state = 'DATE_SELECTION';
      } else {
        booking.state = 'SERVICE_SELECTION';
        return 'Sure! What service would you like to book?';
      }
    }

    if (booking.state === 'SERVICE_SELECTION') {
      const services = await ServiceRepository.findAll();

      const match = services.find((s: any) =>
        text.includes(s.name.toLowerCase())
      );

      if (!match) return 'Which service would you like? Haircut, coloring, styling, spa, or bridal?';

      booking.serviceId = match.id;
      booking.state = 'DATE_SELECTION';

      return 'Great. Which day works for you? (today, tomorrow, or a date)';
    }

    if (booking.state === 'DATE_SELECTION') {
      let date = new Date();

      if (text.includes('tomorrow')) {
        date.setDate(date.getDate() + 1);
      }

      booking.preferredDate = date.toISOString().split('T')[0];
      booking.state = 'AVAILABILITY_CHECK';
    }

    if (booking.state === 'AVAILABILITY_CHECK') {

      const slots = await AppointmentRepository.checkAvailability({
        service_id: booking.serviceId,
        preferred_date: booking.preferredDate
      } as any);

      if (!slots || slots.length === 0) {
        return 'That day is full. Would you like the next available day?';
      }

      booking.availableSlots = slots.slice(0, 3);
      booking.state = 'SLOT_PRESENTED';

      const msg = booking.availableSlots
        .map((s: any, i: number) => {
          const t = new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `${i + 1}. ${t}`;
        })
        .join('\n');

      return `Here are available times:\n${msg}\nReply 1, 2, or 3.`;
    }

    if (booking.state === 'SLOT_PRESENTED') {

      const index = parseInt(text) - 1;

      if (isNaN(index) || !booking.availableSlots[index]) {
        return 'Please reply with 1, 2, or 3.';
      }

      booking.selectedSlot = booking.availableSlots[index];
      booking.state = 'BOOKING_CONFIRMATION';

      const time = new Date(booking.selectedSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `Confirm appointment at ${time}? (yes/no)`;
    }

    if (booking.state === 'BOOKING_CONFIRMATION') {

      if (!text.includes('yes')) {
        booking.state = 'SLOT_PRESENTED';
        return 'Okay. Choose another slot: 1, 2, or 3.';
      }

      booking.state = 'BOOKING_EXECUTION';
    }

    if (booking.state === 'BOOKING_EXECUTION') {

      try {

        const staffList = await StaffRepository.findAll();
        const staff = staffList[0];

        await AppointmentRepository.create({
          client_id: session.clientId,
          staff_id: staff?.id,
          services: [booking.serviceId],
          start_time: booking.selectedSlot.start_time
        } as any);

        const time = new Date(booking.selectedSlot.start_time).toLocaleString();

        session.bookingSession = {
          state: 'BOOKING_INIT',
          serviceId: null,
          preferredDate: null,
          availableSlots: [],
          selectedSlot: null
        };

        return `✅ Your appointment is confirmed for ${time}. See you at JH Salon Twin!`;

      } catch (err) {

        booking.state = 'AVAILABILITY_CHECK';
        return 'That slot was just taken. Let me check other times.';

      }
    }
  }

  // GENERAL fallback using OpenRouter

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...session.history.slice(-10)
  ];

  try {

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 200
    });

    const reply = response.choices[0]?.message?.content || 'Sorry, could you rephrase that?';

    session.history.push({ role: 'assistant', content: reply });

    return reply;

  } catch (error: any) {

    logger.error(error);

    return 'I am having trouble responding right now. Please try again shortly.';

  }
}

function classifyIntent(message: string): string {

  const m = message.toLowerCase();

  if (m.includes('book') || m.includes('appointment') || m.includes('schedule')) return 'BOOKING';

  if (m.includes('reschedule') || m.includes('change')) return 'RESCHEDULE';

  if (m.includes('manager') || m.includes('human')) return 'ESCALATION';

  return 'GENERAL';
}

export function getSession(phone: string) {
  return sessions.get(phone.replace('whatsapp:', ''));
}

export function clearSession(phone: string) {
  sessions.delete(phone.replace('whatsapp:', ''));
}

export const handleMessage = handleIncomingMessage;

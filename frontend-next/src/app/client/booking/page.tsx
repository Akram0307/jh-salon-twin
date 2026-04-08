"use client";

import { useEffect, useState } from "react";
import { get, post } from "@/lib/api-client";
import { CLIENT_BOOKING_ENDPOINTS } from "@/lib/api-endpoints";
import ServiceSelector from "@/components/booking/ServiceSelector";
import TimeSlotPicker from "@/components/booking/TimeSlotPicker";
import LoadingSpinner from "@/components/ui/LoadingSpinner"; // Assuming standard component exists

// AC-01: Main Client Booking Page
export default function BookingPage() {
  const [step, setStep] = useState<'service' | 'time' | 'success'>('service');
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    // 1. Fetch services
    get<{ data: Record<string, any[]> }>(CLIENT_BOOKING_ENDPOINTS.services)
      .then(res => {
        // Flatten the grouped categories
        const allServices = Object.values(res.data).flat();
        setServices(allServices as any);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch services', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (step === 'service' || !selectedService?.id) return;

    // 2. Fetch slots when entering time step
    setSlotLoading(true);
    get<{ data: { slots: any[] } }>(CLIENT_BOOKING_ENDPOINTS.availability, {
      params: { serviceId: selectedService.id, date }
    })
    .then(res => setSlots(res.data.slots || []))
    .finally(() => setSlotLoading(false));
  }, [step, date, selectedService]);

  useEffect(() => {
    // Refresh slots when date changes
    if (!selectedService?.id) return;
    setSlotLoading(true);
    get<{ data: { slots: any[] } }>(CLIENT_BOOKING_ENDPOINTS.availability, {
      params: { serviceId: selectedService.id, date }
    })
    .then(res => setSlots(res.data.slots || []))
    .finally(() => setSlotLoading(false));
  }, [date]);

  const handleBooking = async (slot: any) => {
    try {
      setSelectedSlot(slot);
      const clientId = '00000000-0000-0000-0000-000000000000'; // Replace with actual auth ID
      await post(CLIENT_BOOKING_ENDPOINTS.book, {
        serviceId: selectedService.id,
        slotTime: slot.time,
        clientId
      });
      setStep('success');
    } catch (error) {
      console.error('Booking failed', error);
      alert('Failed to book the selected time.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {step === 'service' && (
        <ServiceSelector services={services} onSelect={(s) => { setSelectedService(s); setStep('time'); }} />
      )}
      {step === 'time' && selectedService && (
        <div className="space-y-6">
          <button onClick={() => setStep('service')} className="text-blue-600 hover:underline">&larr; Back to Services</button>
          <TimeSlotPicker slots={slots} onSelect={handleBooking} date={date} onDateChange={setDate} loading={slotLoading} />
        </div>
      )}
      {step === 'success' && (
        <div className="text-center p-10 bg-green-50 rounded-lg">
          <h2 className="text-2xl font-bold text-green-700">Booking Confirmed!</h2>
          <p className="mt-2">You have successfully booked your appointment.</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ServiceSelector from "@/components/booking/ServiceSelector";
import TimeSlotPicker from "@/components/booking/TimeSlotPicker";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import { post } from "@/lib/api-client";
import { CLIENT_BOOKING_ENDPOINTS } from "@/lib/api-endpoints";

export default function BookingFlow({ clientId }: { clientId?: string }) {
  const [step, setStep] = useState<"service" | "time" | "confirm">("service");
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [bookingResult, setBookingResult] = useState<{ confirmation: string; booking_id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleBook = async () => {
    if (!selectedServiceId || !selectedTime || !clientId) {
      setError("Missing required booking details.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await post<{ data: { confirmation: string; booking_id: string } }>(
        CLIENT_BOOKING_ENDPOINTS.book,
        {
          serviceId: selectedServiceId,
          slotTime: selectedTime,
          clientId, // TODO: Ensure clientId is retrieved from auth context
        }
      );
      setBookingResult(response.data);
      setStep("confirm");
    } catch (err: any) {
      setError(err.body?.message || err.message || "Failed to create booking.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "confirm" && bookingResult) {
    return (
      <BookingConfirmation 
        confirmation={bookingResult.confirmation} 
        bookingId={bookingResult.booking_id} 
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {step === "service" && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select a Service</h2>
          <ServiceSelector 
            selectedId={selectedServiceId} 
            onSelect={(id) => {
              setSelectedServiceId(id);
              setStep("time");
            }} 
          />
        </div>
      )}

      {step === "time" && (
        <div>
          <button 
            onClick={() => setStep("service")} 
            className="mb-4 text-sm text-blue-600 hover:underline"
          >
            &larr; Back to services
          </button>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Select a Time</h2>
          <TimeSlotPicker
            serviceId={selectedServiceId!}
            selectedTime={selectedTime}
            onSelect={(t) => {
              setSelectedTime(t);
              handleBook();
            }}
          />
          {loading && <div className="mt-4 text-center text-gray-500">Processing booking...</div>}
          {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">{error}</div>}
        </div>
      )}
    </div>
  );
}

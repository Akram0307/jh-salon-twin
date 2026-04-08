'use client';

export default function BookingConfirmation({ confirmation, bookingId }: { confirmation?: string; bookingId?: string }) {
  if (!confirmation) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
      <div className="text-4xl">✨</div>
      <h2 className="text-2xl font-bold text-green-800">Booking Confirmed!</h2>
      <p className="text-green-700">Confirmation Code: <span className="font-mono font-bold">{confirmation}</span></p>
      {bookingId && <p className="text-sm text-green-600">Booking ID: {bookingId}</p>}
      <p className="text-sm text-green-700">We have sent a confirmation to your profile.</p>
    </div>
  );
}

"use client";

import { useState } from "react";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface ServiceSelectorProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

// AC-02: Service selection component
export default function ServiceSelector({ services, onSelect }: ServiceSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Select a Service</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left bg-white"
          >
            <div className="font-bold text-lg">{service.name}</div>
            <div className="text-gray-500">{service.duration_minutes} minutes</div>
            <div className="mt-2 font-semibold text-blue-600">${service.price}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

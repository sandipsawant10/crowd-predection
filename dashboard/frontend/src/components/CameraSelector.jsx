import React from "react";
import { VideoCameraIcon } from "@heroicons/react/24/solid";

export default function CameraSelector({ locations, selected, onChange }) {
  return (
    <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 shadow">
      <label className="font-bold mr-4 flex items-center gap-2 text-blue-700">
        <VideoCameraIcon className="w-5 h-5" /> Select Camera Feed:
      </label>
      <select
        className="border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}

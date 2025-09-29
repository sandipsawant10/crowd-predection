import React from "react";
import { VideoCameraIcon } from "@heroicons/react/24/solid";

export default function CameraSelector({ locations, selected, onChange }) {
  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-gray-900 shadow-lg border border-gray-700 hover:shadow-indigo-700/30 transition">
      <label className="font-semibold flex items-center gap-2 text-indigo-300 mb-3">
        <VideoCameraIcon className="w-6 h-6 text-indigo-400" />
        <span className="text-lg">Select Camera Feed</span>
      </label>
      <select
        className="w-full bg-slate-800 border-2 border-indigo-500 rounded-lg px-4 py-2 text-gray-100 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {locations.map((loc) => (
          <option
            key={loc.id}
            value={loc.id}
            className="bg-slate-900 text-gray-100"
          >
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}

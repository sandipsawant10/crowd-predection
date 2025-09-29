import React from "react";

export default function SystemHealth({ health }) {
  const getStatusStyle = (status) => {
    if (status === "running")
      return "bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md ring-2 ring-green-400";
    if (status === "stopped")
      return "bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md ring-2 ring-red-400";
    return "bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold shadow-md ring-2 ring-yellow-300";
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-5 text-blue-300 flex items-center gap-2">
        ⚙️ System Health
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {health.map((service, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-xl border border-gray-700 shadow hover:shadow-blue-500/20 transition"
          >
            <span className="text-lg font-medium text-gray-100">
              {service.name}
            </span>
            <span className={getStatusStyle(service.status)}>
              {service.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

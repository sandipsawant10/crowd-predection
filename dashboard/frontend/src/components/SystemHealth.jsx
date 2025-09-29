import React from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

export default function SystemHealth({ health }) {
  return (
    <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-blue-700 flex items-center gap-2">
        <span>System Health</span>
        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      </h2>
      <table className="w-full text-left border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-200">
            <th className="px-4 py-2">Service</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {health.map((svc, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}>
              <td className="px-4 py-2 font-medium">{svc.name}</td>
              <td className="px-4 py-2 flex items-center gap-2">
                {svc.status === "running" ? (
                  <span className="flex items-center gap-1 text-green-600 font-bold">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Running</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-bold">
                    <XCircleIcon className="w-5 h-5" />
                    <span>Stopped</span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

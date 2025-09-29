import React from "react";
import { ArrowPathIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export default function CrowdControl({
  onRedirect,
  onRequestPolice,
  actionsLog,
}) {
  return (
    <div className="mb-10 p-6 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg">
      <div className="flex gap-6 mb-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          onClick={onRedirect}
        >
          <ArrowPathIcon className="w-5 h-5" /> Redirect Crowd
        </button>
        <button
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:bg-red-700 transition-all flex items-center gap-2"
          onClick={onRequestPolice}
        >
          <ShieldCheckIcon className="w-5 h-5" /> Request Police/Staff
        </button>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-700">
          Crowd Control Actions Log
        </h2>
        <table className="w-full text-left border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-purple-200">
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {actionsLog.length === 0 ? (
              <tr>
                <td className="px-4 py-2 text-gray-500" colSpan={3}>
                  No actions yet.
                </td>
              </tr>
            ) : (
              actionsLog.map((log, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-purple-50"}
                >
                  <td className="px-4 py-2">{log.time}</td>
                  <td className="px-4 py-2 font-semibold text-blue-700">
                    {log.action}
                  </td>
                  <td className="px-4 py-2">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

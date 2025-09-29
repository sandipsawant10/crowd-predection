import React from "react";
import { ArrowPathIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export default function CrowdControl({
  onRedirect,
  onRequestPolice,
  actionsLog,
}) {
  return (
    <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-gray-900 shadow-xl border border-gray-700 hover:shadow-purple-700/30 transition">
      {/* Action Buttons */}
      <div className="flex gap-6 mb-6">
        <button
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 ring-2 ring-blue-400/50"
          onClick={onRedirect}
        >
          <ArrowPathIcon className="w-5 h-5" /> Redirect Crowd
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 ring-2 ring-red-400/50"
          onClick={onRequestPolice}
        >
          <ShieldCheckIcon className="w-5 h-5" /> Request Police/Staff
        </button>
      </div>

      {/* Actions Log */}
      <div className="bg-slate-800 rounded-2xl shadow p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-5 text-purple-300 flex items-center gap-2">
          📋 Crowd Control Actions Log
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700 text-gray-200">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {actionsLog.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-3 text-gray-400 text-center"
                    colSpan={3}
                  >
                    No actions yet.
                  </td>
                </tr>
              ) : (
                actionsLog.map((log, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-slate-900" : "bg-slate-800"
                    } hover:bg-slate-700 transition`}
                  >
                    <td className="px-4 py-3 text-gray-200">{log.time}</td>
                    <td className="px-4 py-3 font-semibold text-blue-300">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-gray-100">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

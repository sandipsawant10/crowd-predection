import React from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";

export default function LogsTable({ logs, onDownload }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span>System Logs</span>
        <span className="inline-block px-2 py-1 bg-gray-200 text-xs rounded-full font-semibold">
          {logs.length} entries
        </span>
      </h2>
      <div className="mb-4 flex gap-4">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-900 transition-all flex items-center gap-2"
          onClick={() => onDownload("json")}
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> Download JSON
        </button>
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-900 transition-all flex items-center gap-2"
          onClick={() => onDownload("csv")}
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> Download CSV
        </button>
      </div>
      <table className="w-full text-left border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td className="px-4 py-2 text-gray-500" colSpan={3}>
                No logs yet.
              </td>
            </tr>
          ) : (
            logs.map((log, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-2">{log.time}</td>
                <td className="px-4 py-2 font-semibold text-gray-700">
                  {log.type}
                </td>
                <td className="px-4 py-2">{log.value}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

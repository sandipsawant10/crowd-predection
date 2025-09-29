export function downloadFile(data, format, filename = "logs") {
  let dataStr = "";
  if (format === "json") {
    dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(data, null, 2));
  } else {
    // CSV
    const header = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    dataStr =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent([header, ...rows].join("\n"));
  }
  const a = document.createElement("a");
  a.href = dataStr;
  a.download = `${filename}.${format}`;
  a.click();
}

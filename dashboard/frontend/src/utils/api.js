export async function fetchPeopleCount(api) {
  const res = await fetch(api);
  return res.json();
}

export async function fetchCrowdHistory(api) {
  const res = await fetch(api);
  return res.json();
}

export async function fetchCrowdForecast(api) {
  const res = await fetch(api);
  return res.json();
}

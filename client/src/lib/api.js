const API_URL = "http://localhost:3001/api";

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`);
  return res.json();
}

export async function createUser(name) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function updateProgress(id, taps, rebirths, balance) {
  const res = await fetch(`${API_URL}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, taps, rebirths, balance }),
  });
  return res.json();
}

export async function getMarket() {
  const res = await fetch(`${API_URL}/market`);
  return res.json();
}

export async function buyItem(buyer_id, item_id) {
  const res = await fetch(`${API_URL}/market/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyer_id, item_id }),
  });
  return res.json();
}

export async function sellItem(item_id, price) {
  const res = await fetch(`${API_URL}/market/sell`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_id, price }),
  });
  return res.json();
}

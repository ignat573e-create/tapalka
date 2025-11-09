import React, { useState, useEffect } from "react";
import { getUsers, createUser, updateProgress, getMarket, buyItem, sellItem } from "./lib/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [market, setMarket] = useState([]);
  const [taps, setTaps] = useState(0);
  const [rebirths, setRebirths] = useState(0);
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState([]);
  const [clickValue, setClickValue] = useState(1);
  const [username, setUsername] = useState("");

  // загрузка пользователей и рынка
  useEffect(() => {
    loadUsers();
    loadMarket();
  }, []);

  async function loadUsers() {
    const data = await getUsers();
    setUsers(data);
  }

  async function loadMarket() {
    const data = await getMarket();
    setMarket(data);
  }

  async function register() {
    if (!username.trim()) return alert("Введите имя!");
    const newUser = await createUser(username.trim());
    setUser(newUser);
    setTaps(0);
    setRebirths(0);
    setBalance(0);
  }

  function tap() {
  const newTaps = taps + clickValue;
  setTaps(newTaps);
  if (newTaps % 100 === 0) setBalance(b => b + 10);

  // 🎲 шанс дропа
  const roll = Math.random();
  if (roll < 0.01) dropItem("Мифический Артефакт", "mythic", 500);
  else if (roll < 0.05) dropItem("Редкий Камень", "rare", 150);
  else if (roll < 0.15) dropItem("Необычный Кристалл", "uncommon", 50);
}

async function dropItem(name, rarity, price) {
  alert(`🎁 Выпал предмет: ${name} (${rarity})!`);
  setItems(prev => [...prev, { name, rarity, price }]);

  // Автопродажа на рынок
  try {
    const res = await fetch("http://localhost:3001/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, name, rarity, price }),
    });
    const { id } = await res.json();
    await fetch("http://localhost:3001/api/market/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, price }),
    });
    console.log(`🔹 ${name} продан за ${price}`);
  } catch (err) {
    console.error("Ошибка автопродажи", err);
  }
}


  function rebirth() {
    if (taps < 1000) return alert("Нужно хотя бы 1000 тапов!");
    setRebirths(r => r + 1);
    setTaps(0);
    setClickValue(v => v + 1);
    setBalance(b => b + 50);
  }

  async function save() {
    if (!user) return;
    await updateProgress(user.id, taps, rebirths, balance);
    alert("Сохранено!");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">🖱️ Tapalka</h1>

      {!user ? (
        <div className="flex gap-2">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Имя игрока"
            className="p-2 rounded bg-gray-800 border border-gray-600"
          />
          <button onClick={register} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
            Начать
          </button>
        </div>
      ) : (
        <>
          <div className="text-xl mb-2">{user.name}</div>
          <div className="mb-2">Тапы: {taps}</div>
          <div className="mb-2">Ребёртов: {rebirths}</div>
          <div className="mb-4">Баланс: {balance.toFixed(2)} 💰</div>

          <button
            onClick={tap}
            className="px-10 py-4 bg-blue-500 rounded-full hover:bg-blue-600 text-2xl font-bold shadow-lg mb-4"
          >
            TAP
          </button>

          <div className="flex gap-2 mb-4">
            <button onClick={rebirth} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700">
              Переродиться
            </button>
            <button onClick={save} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-800">
              Сохранить
            </button>
          </div>

          <h2 className="text-2xl mb-2">🏪 Маркет</h2>
          <div className="w-full max-w-lg">
            {market.length === 0 ? (
              <p className="text-gray-400">Пусто</p>
            ) : (
              market.map(item => (
                <div key={item.id} className="flex justify-between bg-gray-800 p-2 mb-2 rounded">
                  <span>{item.name} ({item.rarity}) — {item.price} 💰</span>
                  <button
                    onClick={() => buyItem(user.id, item.id).then(loadMarket)}
                    className="px-2 bg-green-700 rounded hover:bg-green-800"
                  >
                    Купить
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

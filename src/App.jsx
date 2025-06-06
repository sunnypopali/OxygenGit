import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const days = ['M', 'T', 'W', 'Th', 'F', 'S/S'];
const initWeek = () => ({
  startDate: '',
  days: days.map(day => ({ day, workout: '', cardio: '', notes: '', done: false })),
  checkpoint: '', weight: ''
});

export default function App() {
  const [user, setUser] = useState(null);
  const [weeks, setWeeks] = useState(Array.from({ length: 12 }, initWeek));
  const [currentWeek, setCurrentWeek] = useState(0);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const ref = doc(db, 'users', u.uid);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) setWeeks(snapshot.data().weeks);
      }
    });
  }, []);

  const updateField = (w, d, field, value) => {
    const updated = [...weeks];
    updated[w].days[d][field] = value;
    setWeeks(updated);
  };

  const save = async () => {
    if (user) await setDoc(doc(db, 'users', user.uid), { weeks });
  };

  const changeStartDate = (weekIndex, date) => {
    const updated = [...weeks];
    updated[weekIndex].startDate = date;
    setWeeks(updated);
  };

  const current = weeks[currentWeek];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Oxygen Gym Tracker</h1>
        {user && <button onClick={() => signOut(auth)} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>}
      </header>

      <main className="p-4">
        {!user ? (
          <div className="flex justify-center items-center h-[60vh]">
            <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button onClick={() => setCurrentWeek(w => Math.max(w - 1, 0))} className="px-3 py-1 bg-gray-300 rounded">⬅️ Previous</button>
              <div className="flex items-center gap-3">
                <span className="font-medium">Week {currentWeek + 1} of 12</span>
                <select value={currentWeek} onChange={e => setCurrentWeek(Number(e.target.value))} className="border rounded px-2 py-1">
                  {weeks.map((_, i) => <option key={i} value={i}>Week {i + 1}</option>)}
                </select>
              </div>
              <button onClick={() => setCurrentWeek(w => Math.min(w + 1, 11))} className="px-3 py-1 bg-gray-300 rounded">Next ➡️</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Start Date:</label>
                <input
                  type="date"
                  className="border px-3 py-1 rounded"
                  value={current.startDate}
                  onChange={e => changeStartDate(currentWeek, e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {current.days.map((day, d) => (
                  <div key={d} className="border rounded-lg p-3 bg-gray-50">
                    <h3 className="font-medium mb-2">{day.day}</h3>
                    <input className="w-full mb-1 p-2 border rounded" placeholder="Workout" value={day.workout} onChange={e => updateField(currentWeek, d, 'workout', e.target.value)} />
                    <input className="w-full mb-1 p-2 border rounded" placeholder="Cardio" value={day.cardio} onChange={e => updateField(currentWeek, d, 'cardio', e.target.value)} />
                    <input className="w-full mb-1 p-2 border rounded" placeholder="Notes" value={day.notes} onChange={e => updateField(currentWeek, d, 'notes', e.target.value)} />
                    <button onClick={() => updateField(currentWeek, d, 'done', !day.done)} className={`mt-1 px-3 py-1 rounded text-white ${day.done ? 'bg-green-500' : 'bg-gray-400'}`}>{day.done ? '✔ Done' : 'Mark Done'}</button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <textarea className="w-full p-3 border rounded mb-2" placeholder="Weekly checkpoint summary" value={current.checkpoint} onChange={e => {
                  const copy = [...weeks];
                  copy[currentWeek].checkpoint = e.target.value;
                  setWeeks(copy);
                }} />
                <input className="w-full p-2 border rounded" placeholder="Weight (kg)" value={current.weight} onChange={e => {
                  const copy = [...weeks];
                  copy[currentWeek].weight = e.target.value;
                  setWeeks(copy);
                }} />
              </div>
            </div>
            <div className="flex justify-center">
              <button onClick={save} className="mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-700 transition">
                💾 Save Progress
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

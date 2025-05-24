import React, { useEffect, useState } from 'react';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const days = ['M', 'T', 'W', 'Th', 'F', 'S/S'];
const initWeek = () => ({
  days: days.map(day => ({ day, workout: '', cardio: '', notes: '', done: false })),
  checkpoint: '', weight: ''
});

export default function App() {
  const [user, setUser] = useState(null);
  const [weeks, setWeeks] = useState(Array.from({ length: 12 }, initWeek));

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
          <div className="space-y-8">
            {weeks.map((week, w) => (
              <div key={w} className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold mb-4">Week {w + 1}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {week.days.map((day, d) => (
                    <div key={d} className="border rounded-lg p-3 bg-gray-50">
                      <h3 className="font-medium mb-2">{day.day}</h3>
                      <input className="w-full mb-1 p-2 border rounded" placeholder="Workout" value={day.workout} onChange={e => updateField(w, d, 'workout', e.target.value)} />
                      <input className="w-full mb-1 p-2 border rounded" placeholder="Cardio" value={day.cardio} onChange={e => updateField(w, d, 'cardio', e.target.value)} />
                      <input className="w-full mb-1 p-2 border rounded" placeholder="Notes" value={day.notes} onChange={e => updateField(w, d, 'notes', e.target.value)} />
                      <button onClick={() => updateField(w, d, 'done', !day.done)} className={`mt-1 px-3 py-1 rounded text-white ${day.done ? 'bg-green-500' : 'bg-gray-400'}`}>
                        {day.done ? '✔ Done' : 'Mark Done'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <textarea className="w-full p-3 border rounded mb-2" placeholder="Weekly checkpoint summary" value={week.checkpoint} onChange={e => {
                    const copy = [...weeks];
                    copy[w].checkpoint = e.target.value;
                    setWeeks(copy);
                  }} />
                  <input className="w-full p-2 border rounded" placeholder="Weight (kg)" value={week.weight} onChange={e => {
                    const copy = [...weeks];
                    copy[w].weight = e.target.value;
                    setWeeks(copy);
                  }} />
                </div>
              </div>
            ))}
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
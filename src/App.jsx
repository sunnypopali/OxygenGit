// Updated App.jsx with workout template save/apply functionality
import React, { useEffect, useState, useRef } from 'react';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [template, setTemplate] = useState([]);
  const debounceTimer = useRef(null);

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
    setHasUnsavedChanges(true);
  };

  const changeStartDate = (weekIndex, date) => {
    const updated = [...weeks];
    updated[weekIndex].startDate = date;
    setWeeks(updated);
    setHasUnsavedChanges(true);
  };

  const save = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { weeks });
      setHasUnsavedChanges(false);
    }
  };

  useEffect(() => {
    if (hasUnsavedChanges) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        save();
      }, 1000);
    }
  }, [weeks]);

  const handleLogout = async () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm("You have unsaved changes. Do you want to save before logging out?");
      if (confirmLeave) {
        await save();
      }
    }
    signOut(auth);
  };

  const saveTemplate = () => {
    const templateData = weeks[currentWeek].days.map(d => ({ workout: d.workout }));
    setTemplate(templateData);
    alert("✅ Workout template saved!");
  };

  const applyTemplate = () => {
    if (!template.length) return alert("⚠️ No template saved yet.");
    const updated = [...weeks];
    updated[currentWeek].days = updated[currentWeek].days.map((day, i) => ({
      ...day,
      workout: template[i]?.workout || ''
    }));
    setWeeks(updated);
    setHasUnsavedChanges(true);
    alert("📂 Template applied to current week");
  };

  const current = weeks[currentWeek];
  const chartData = weeks.map((week, index) => ({
    name: `Week ${index + 1}`,
    weight: Number(week.weight) || null,
  })).filter(w => w.weight);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Oxygen Gym Tracker</h1>
        {user && <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>}
      </header>

      <main className="p-4">
        {!user ? (
          <div className="flex justify-center items-center h-[60vh]">
            <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
              Sign in with Google
            </button>
          </div>
        ) : showSummary ? (
          ... // unchanged summary content
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-2 items-center">
                <button onClick={() => setCurrentWeek(w => Math.max(w - 1, 0))} className="px-3 py-1 bg-gray-300 rounded">⬅️ Previous</button>
                <span className="font-medium">Week {currentWeek + 1} of 12</span>
                <select value={currentWeek} onChange={e => setCurrentWeek(Number(e.target.value))} className="border rounded px-2 py-1">
                  {weeks.map((_, i) => <option key={i} value={i}>Week {i + 1}</option>)}
                </select>
                <button onClick={() => setCurrentWeek(w => Math.min(w + 1, 11))} className="px-3 py-1 bg-gray-300 rounded">Next ➡️</button>
              </div>
              <div className="flex gap-2">
                <button onClick={saveTemplate} className="px-4 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600">💾 Save Template</button>
                <button onClick={applyTemplate} className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600">📂 Apply Template</button>
                <button onClick={() => setShowSummary(true)} className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition">🔍 View Progress Summary</button>
              </div>
            </div>

            ... // unchanged weekly tracker card

          </div>
        )}
      </main>
    </div>
  );
}

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
    <div style={{ padding: 20 }}>
      {user ? (
        <>
          <h2>Hi {user.displayName} <button onClick={() => signOut(auth)}>Logout</button></h2>
          {weeks.map((week, w) => (
            <div key={w}>
              <h3>Week {w + 1}</h3>
              {week.days.map((day, d) => (
                <div key={d} style={{ marginBottom: 10 }}>
                  <b>{day.day}</b>
                  <input placeholder="Workout" value={day.workout} onChange={e => updateField(w, d, 'workout', e.target.value)} />
                  <input placeholder="Cardio" value={day.cardio} onChange={e => updateField(w, d, 'cardio', e.target.value)} />
                  <input placeholder="Notes" value={day.notes} onChange={e => updateField(w, d, 'notes', e.target.value)} />
                  <button onClick={() => updateField(w, d, 'done', !day.done)}>{day.done ? '✔' : '✗'}</button>
                </div>
              ))}
              <textarea placeholder="Weekly checkpoint" value={week.checkpoint} onChange={e => {
                const copy = [...weeks];
                copy[w].checkpoint = e.target.value;
                setWeeks(copy);
              }} />
              <input placeholder="Weight" value={week.weight} onChange={e => {
                const copy = [...weeks];
                copy[w].weight = e.target.value;
                setWeeks(copy);
              }} />
            </div>
          ))}
          <button onClick={save}>💾 Save</button>
        </>
      ) : (
        <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}>Login with Google</button>
      )}
    </div>
  );
}
import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <header className="card">
        <h1>Emi To-Do</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Bienvenido a tu gestor de tareas minimalista.</p>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary">Comenzar</button>
        </div>
      </header>
    </div>
  )
}

export default App

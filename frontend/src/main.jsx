// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 1. ייבוא ה-Provider
import { ThemeProvider } from './context/ThemeContext.jsx' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. עטיפה של האפליקציה */}
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
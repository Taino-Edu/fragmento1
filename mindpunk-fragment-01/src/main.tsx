import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Tirei o .tsx daqui, o sistema entende sozinho
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
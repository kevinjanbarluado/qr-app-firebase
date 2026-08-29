import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { APP_NAME } from './config/app.ts'
import './index.css'

document.title = APP_NAME

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
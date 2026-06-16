import React from 'react'
import ReactDOM from 'react-dom/client'
import Clarity from '@microsoft/clarity'
import App from './App'
import './index.css'

// Microsoft Clarity analytics. Project id is configurable via VITE_CLARITY_ID
// (defaults to the maxfelker.com project). Only runs in production builds, so
// dev sessions aren't recorded. Clarity auto-tracks SPA route changes.
const clarityId = import.meta.env.VITE_CLARITY_ID ?? 'x7s0rggs25'
if (import.meta.env.PROD && clarityId) {
  Clarity.init(clarityId)
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
);
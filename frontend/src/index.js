import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './App.css';
import App from './App';

// All relative API calls go to the backend domain
axios.defaults.baseURL = 'https://api.032403.xyz';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

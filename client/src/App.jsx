import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Account from './Account';
import Cancel from './Cancel';
import Prices from './Prices';
import Register from './Register';
import Subscribe from './Subscribe';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/account" element={<Account />} />
        <Route path="/cancel" element={<Cancel />} />
      </Routes>
    </Router>
  );
}

export default App;

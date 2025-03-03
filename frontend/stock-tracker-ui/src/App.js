import React, { useState } from 'react';
import StockChart from './components/StockChart';

function App() {
  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Stock Market Data</h1>
      <StockChart />
    </div>
  );
}

export default App;

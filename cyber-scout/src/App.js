import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import store from './redux/store';
import Home from './pages/Home';
import Scout from './pages/Scout';
import Analysis from './pages/Analysis';
import Teams from './pages/Teams';
import Navbar from './components/Navbar';
import Settings from './components/Settings';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/global.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <Provider store={store}>
      <Router basename={process.env.PUBLIC_URL}>
        <div className="App">
          <Navbar onOpenSettings={() => setShowSettings(true)} />
          <div className="container mt-4 py-4">
            <Routes>
              <Route path="/" element={<Home onOpenSettings={() => setShowSettings(true)} />} />
              <Route path="/scout" element={<Scout />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/teams" element={<Teams />} />
            </Routes>
          </div>
          <Settings show={showSettings} onClose={() => setShowSettings(false)} />
        </div>
      </Router>
    </Provider>
  );
}

export default App;

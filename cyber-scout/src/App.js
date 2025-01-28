import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Home from './pages/Home';
import Scout from './pages/Scout';
import Analysis from './pages/Analysis';
import Teams from './pages/Teams';
import Navbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/global.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scout" element={<Scout />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/teams" element={<Teams />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;

import { Link } from 'react-router-dom';
import CompetitionSelector from './CompetitionSelector';

function Navbar({ onOpenSettings }) {
  return (
    <nav className="navbar navbar-expand-lg bg-primary">
      <div className="container">
        <Link className="navbar-brand text-dark" to="/">
          <i className="bi bi-robot me-2"></i>
          CyberScout
        </Link>
        <button 
          className="navbar-toggler border-dark" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link to="/scout" style={{ 
                color: '#212529',
                textDecoration: 'none',
                padding: '8px 16px',
                display: 'block',
                fontWeight: 500
              }}>Scout</Link>
            </li>
            <li className="nav-item">
              <Link to="/analysis" style={{ 
                color: '#212529',
                textDecoration: 'none',
                padding: '8px 16px',
                display: 'block',
                fontWeight: 500
              }}>Analysis</Link>
            </li>
            <li className="nav-item">
              <button 
                onClick={onOpenSettings}
                style={{ 
                  color: '#212529',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  display: 'block',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Settings
              </button>
            </li>
          </ul>
          <CompetitionSelector />
        </div>
      </div>
      <style jsx>{`
        .nav-link:hover {
          color: #000 !important;
        }
      `}</style>
    </nav>
  );
}

export default Navbar;

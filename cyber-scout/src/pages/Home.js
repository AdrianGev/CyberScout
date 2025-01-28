import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3">Welcome to CyberScout</h1>
        <p className="lead">Your Ultimate FRC Scouting Assistant</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <i className="bi bi-clipboard-data-fill display-4 text-primary mb-3"></i>
              <h5 className="card-title">Scout Matches</h5>
              <p className="card-text">Record match data and team performance in real-time with our intuitive scouting form.</p>
              <Link to="/scout" className="btn btn-outline-primary">Start Scouting</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <i className="bi bi-graph-up-arrow display-4 text-primary mb-3"></i>
              <h5 className="card-title">Analysis</h5>
              <p className="card-text">Analyze team performance data with powerful visualization tools and statistics.</p>
              <Link to="/analysis" className="btn btn-outline-primary">View Analysis</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body text-center">
              <i className="bi bi-people-fill display-4 text-primary mb-3"></i>
              <h5 className="card-title">Teams</h5>
              <p className="card-text">Access comprehensive team information and historical performance data.</p>
              <Link to="/teams" className="btn btn-outline-primary">View Teams</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;

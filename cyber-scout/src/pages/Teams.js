import { useState } from 'react';

function Teams() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - in a real app this would come from your backend
  const mockTeams = [
    { number: 1, name: "Team One", location: "City A", matches: 15, avgScore: 42 },
    { number: 2, name: "Team Two", location: "City B", matches: 12, avgScore: 38 },
    { number: 3, name: "Team Three", location: "City C", matches: 18, avgScore: 45 },
  ];

  const filteredTeams = mockTeams.filter(team => 
    team.number.toString().includes(searchQuery) ||
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <div className="text-center mb-4">
        <h2 className="display-5 mb-3">Teams Directory</h2>
        <p className="lead">View and search team information</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 offset-md-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row">
        {filteredTeams.map(team => (
          <div key={team.number} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Team {team.number}</h5>
              </div>
              <div className="card-body">
                <h6 className="card-title">{team.name}</h6>
                <p className="card-text">
                  <strong>Location:</strong> {team.location}<br />
                  <strong>Matches Played:</strong> {team.matches}<br />
                  <strong>Average Score:</strong> {team.avgScore}
                </p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => alert('View details functionality coming soon!')}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center mt-4">
          <p className="text-muted">No teams found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default Teams;
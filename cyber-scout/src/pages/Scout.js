import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { tbaService } from '../services/tba-service';
import { QRCodeSVG } from 'qrcode.react';
import { addMatch } from '../store/scoutingSlice';
import NumberInput from '../components/NumberInput';

function Scout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQRData] = useState('');
  const [formData, setFormData] = useState({
    // Scout Information
    matchNumber: '',
    teamNumber: '',
    startingPosition: '',
    // Safety and Fouls
    autoStop: false,
    eStop: false,
    hitOpponentCage: false,
    crossedOpponentSide: false,
    // Autonomous
    movedInAuto: false,
    autoPoints: 0,
    autoCoralL1: 0,
    autoCoralL2: 0,
    autoCoralL3: 0,
    autoCoralL4: 0,
    autoAlgaeProcessor: 0,
    autoAlgaeNet: 0,
    autoNotes: '',
    // Teleop
    teleopCoralL1: 0,
    teleopCoralL2: 0,
    teleopCoralL3: 0,
    teleopCoralL4: 0,
    teleopAlgaeProcessor: 0,
    teleopAlgaeNet: 0,
    humanPlayerNetScoring: 0,
    humanPlayerNetMisses: 0,
    teleopNotes: '',
    teleopTotalPoints: 0,
    // Endgame
    endgamePosition: '', // 'park', 'shallow', 'deep', 'none'
    endgameTotalPoints: 0,
    // Match Results
    matchResult: '', // 'win', 'loss', 'tie'
    matchTotalPoints: 0,
    // Score Override
    scoreOverride: 0,
    rankPointsOverride: 0,
    useScoreOverride: false,
    useRankPointsOverride: false,
  });

  const [validationError, setValidationError] = useState('');
  const eventMatches = useSelector(state => state.scouting.eventMatches);
  const selectedEvent = useSelector(state => state.scouting.selectedEvent);
  const [correctPosition, setCorrectPosition] = useState(null);

  // Fetch match data when match number changes
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!selectedEvent || !formData.matchNumber || !formData.teamNumber) return;

      try {
        const matchKey = `${selectedEvent.key}_qm${formData.matchNumber}`;
        const matchData = await tbaService.getMatch(matchKey);
        const position = tbaService.getTeamPositionInMatch(matchData, formData.teamNumber);
        setCorrectPosition(position);
        
        // Auto-select the correct position if none is selected
        if (position && !formData.startingPosition) {
          setFormData(prev => ({ ...prev, startingPosition: position }));
          handleChange({ target: { name: 'startingPosition', value: position }});
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
    };

    fetchMatchData();
  }, [selectedEvent, formData.matchNumber, formData.teamNumber]);

  const validateTeamAndMatch = (matchNum, teamNum) => {
    if (!selectedEvent) {
      setValidationError('Please select a competition first');
      return false;
    }

    const match = eventMatches.find(m => 
      m.match_number.toString() === matchNum.toString() && 
      m.comp_level === 'qm' // Assuming qualification matches
    );

    if (!match) {
      setValidationError(`Match ${matchNum} not found in the current competition`);
      return false;
    }

    const allTeams = [
      ...match.alliances.red.team_keys,
      ...match.alliances.blue.team_keys
    ].map(key => key.replace('frc', ''));

    if (!allTeams.includes(teamNum.toString())) {
      setValidationError(`Team ${teamNum} is not playing in match ${matchNum}`);
      return false;
    }

    // Set match result based on team's alliance and match outcome
    const isRedAlliance = match.alliances.red.team_keys.includes(`frc${teamNum}`);
    const redScore = match.alliances.red.score;
    const blueScore = match.alliances.blue.score;
    
    let matchResult = '';
    if (redScore > blueScore) {
      matchResult = isRedAlliance ? 'win' : 'loss';
    } else if (blueScore > redScore) {
      matchResult = isRedAlliance ? 'loss' : 'win';
    } else {
      matchResult = 'tie';
    }

    setFormData(prev => ({
      ...prev,
      matchResult
    }));

    setValidationError('');
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate team and match numbers when either changes
    if (name === 'matchNumber' || name === 'teamNumber') {
      if (formData.matchNumber && formData.teamNumber) {
        validateTeamAndMatch(
          name === 'matchNumber' ? value : formData.matchNumber,
          name === 'teamNumber' ? value : formData.teamNumber
        );
      }
    }
  };

  // Format data for Google Sheets (tab-separated values)
  const formatDataForSheets = (data) => {
    const orderedFields = [
      // Match & Team Info
      data.matchNumber,
      data.teamNumber,
      data.startingPosition,
      // Safety & Fouls
      data.autoStop ? '1' : '0',
      data.eStop ? '1' : '0',
      data.hitOpponentCage ? '1' : '0',
      data.crossedOpponentSide ? '1' : '0',
      // Auto
      data.movedInAuto ? '1' : '0',
      data.autoCoralL1,
      data.autoCoralL2,
      data.autoCoralL3,
      data.autoCoralL4,
      data.autoAlgaeProcessor,
      data.autoAlgaeNet,
      data.autoNotes,
      // Teleop
      data.teleopCoralL1,
      data.teleopCoralL2,
      data.teleopCoralL3,
      data.teleopCoralL4,
      data.teleopAlgaeProcessor,
      data.teleopAlgaeNet,
      data.humanPlayerNetScoring,
      data.humanPlayerNetMisses,
      data.teleopNotes,
      data.teleopTotalPoints,
      // Endgame
      data.endgamePosition,
      data.endgameTotalPoints,
      // Results
      data.totalRankPoints,
      data.matchResult,
      data.matchTotalPoints // Total Points
    ];

    return orderedFields.join('\t');
  };

  // Point calculation functions
  const calculateAutoCoralPoints = () => {
    return (
      (Number(formData.autoCoralL1) * 3) +  // L1: 3pts
      (Number(formData.autoCoralL2) * 4) +  // L2: 4pts
      (Number(formData.autoCoralL3) * 6) +  // L3: 6pts
      (Number(formData.autoCoralL4) * 7)    // L4: 7pts
    );
  };

  const calculateTeleopCoralPoints = () => {
    return (
      (Number(formData.teleopCoralL1) * 2) +  // L1: 2pts
      (Number(formData.teleopCoralL2) * 3) +  // L2: 3pts
      (Number(formData.teleopCoralL3) * 4) +  // L3: 4pts
      (Number(formData.teleopCoralL4) * 5)    // L4: 5pts
    );
  };

  const calculateAlgaePoints = () => {
    // Algae points are the same in both auto and teleop
    const processorPoints = (
      (Number(formData.autoAlgaeProcessor) + Number(formData.teleopAlgaeProcessor)) * 6  // Processor: 6pts
    );
    const netPoints = (
      (Number(formData.autoAlgaeNet) + Number(formData.teleopAlgaeNet)) * 4  // Net: 4pts
    );
    return processorPoints + netPoints;
  };

  const calculateEndgamePoints = () => {
    switch(formData.endgamePosition) {
      case 'park': return 2;     // Park: 2pts
      case 'shallow': return 6;  // Shallow hang: 6pts
      case 'deep': return 12;    // Deep hang: 12pts
      default: return 0;
    }
  };

  // Calculate total points
  const calculateTotalPoints = () => {
    const autoPoints = calculateAutoCoralPoints() + 
      ((Number(formData.autoAlgaeProcessor) * 6) + (Number(formData.autoAlgaeNet) * 4));
    
    const teleopPoints = calculateTeleopCoralPoints() + 
      ((Number(formData.teleopAlgaeProcessor) * 6) + (Number(formData.teleopAlgaeNet) * 4)) +
      (Number(formData.humanPlayerNetScoring) * 4);
    
    const endgamePoints = calculateEndgamePoints();
    
    return autoPoints + teleopPoints + endgamePoints;
  };

  // Rank Point calculations
  const calculateRankPoints = (totalPoints) => {
    let rankPoints = 0;
    
    // Win/Tie points
    if (formData.matchResult === 'win') rankPoints += 3;
    else if (formData.matchResult === 'tie') rankPoints += 1;
    // Loss is 0 points

    // Auto RP - all robots leave and score 1 coral in auto
    const autoQualifies = formData.movedInAuto && 
      (Number(formData.autoCoralL1) + Number(formData.autoCoralL2) + 
       Number(formData.autoCoralL3) + Number(formData.autoCoralL4)) >= 1;
    if (autoQualifies) rankPoints += 1;

    // Check for coopertition - at least 2 algae in EACH processor
    const coopertitionAchieved = 
      Number(formData.autoAlgaeProcessor) >= 2 && 
      Number(formData.teleopAlgaeProcessor) >= 2;

    // Coral RP - 5 coral on each level (or 3 levels if coopertition)
    const coralLevels = [
      Number(formData.teleopCoralL1) + Number(formData.autoCoralL1),
      Number(formData.teleopCoralL2) + Number(formData.autoCoralL2),
      Number(formData.teleopCoralL3) + Number(formData.autoCoralL3),
      Number(formData.teleopCoralL4) + Number(formData.autoCoralL4)
    ];
    
    const levelsWithFiveCoral = coralLevels.filter(level => level >= 5).length;
    const coralQualifies = coopertitionAchieved ? 
      levelsWithFiveCoral >= 3 : // Need 3 levels with 5 coral if coopertition achieved
      levelsWithFiveCoral >= 4;  // Need all 4 levels with 5 coral otherwise
    
    if (coralQualifies) rankPoints += 1;

    // Barge RP - at least 14 BARGE points
    const bargePoints = 
      (Number(formData.autoAlgaeProcessor) + Number(formData.teleopAlgaeProcessor)) * 6 +
      (Number(formData.autoAlgaeNet) + Number(formData.teleopAlgaeNet)) * 4;
    if (bargePoints >= 14) rankPoints += 1;

    return rankPoints;
  };

  // Update points whenever form changes
  useEffect(() => {
    const autoPoints = calculateAutoCoralPoints() + 
      ((Number(formData.autoAlgaeProcessor) * 6) + (Number(formData.autoAlgaeNet) * 4));
    
    const teleopPoints = calculateTeleopCoralPoints() + 
      ((Number(formData.teleopAlgaeProcessor) * 6) + (Number(formData.teleopAlgaeNet) * 4)) +
      (Number(formData.humanPlayerNetScoring) * 4);
    
    const endgamePoints = calculateEndgamePoints();
    
    const totalPoints = !formData.useScoreOverride ? 
      (autoPoints + teleopPoints + endgamePoints) :
      Number(formData.scoreOverride);

    const finalRankPoints = !formData.useRankPointsOverride ? 
      calculateRankPoints(totalPoints) :
      Number(formData.rankPointsOverride);

    setFormData(prevData => ({
      ...prevData,
      autoPoints,
      teleopTotalPoints: teleopPoints,
      endgameTotalPoints: endgamePoints,
      matchTotalPoints: totalPoints,
      totalRankPoints: finalRankPoints
    }));
  }, [formData.autoCoralL1, formData.autoCoralL2, formData.autoCoralL3, formData.autoCoralL4,
      formData.teleopCoralL1, formData.teleopCoralL2, formData.teleopCoralL3, formData.teleopCoralL4,
      formData.autoAlgaeProcessor, formData.autoAlgaeNet, formData.teleopAlgaeProcessor, formData.teleopAlgaeNet,
      formData.endgamePosition, formData.matchResult, formData.humanPlayerNetScoring, formData.useScoreOverride, formData.useRankPointsOverride]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate team and match before submission
    if (!validateTeamAndMatch(formData.matchNumber, formData.teamNumber)) {
      return;
    }

    // Format data for QR code
    const formattedData = formatDataForSheets(formData);
    setQRData(formattedData);
    setShowQRModal(true);

    // Save to Redux store
    dispatch(addMatch(formData));
  };

  const handleCloseQRAndNavigate = () => {
    setShowQRModal(false);
    
    // Add match data to Redux store
    dispatch(addMatch({
      ...formData,
      id: Date.now(),
    }));
    
    // Reset form
    setFormData({
      // Scout Information
      matchNumber: '',
      teamNumber: '',
      startingPosition: '',
      // Safety and Fouls
      autoStop: false,
      eStop: false,
      hitOpponentCage: false,
      crossedOpponentSide: false,
      // Autonomous
      movedInAuto: false,
      autoPoints: 0,
      autoCoralL1: 0,
      autoCoralL2: 0,
      autoCoralL3: 0,
      autoCoralL4: 0,
      autoAlgaeProcessor: 0,
      autoAlgaeNet: 0,
      autoNotes: '',
      // Teleop
      teleopCoralL1: 0,
      teleopCoralL2: 0,
      teleopCoralL3: 0,
      teleopCoralL4: 0,
      teleopAlgaeProcessor: 0,
      teleopAlgaeNet: 0,
      humanPlayerNetScoring: 0,
      humanPlayerNetMisses: 0,
      teleopNotes: '',
      teleopTotalPoints: 0,
      // Endgame
      endgamePosition: '', // 'park', 'shallow', 'deep', 'none'
      endgameTotalPoints: 0,
      // Match Results
      matchResult: '', // 'win', 'loss', 'tie'
      matchTotalPoints: 0,
      // Score Override
      scoreOverride: 0,
      rankPointsOverride: 0,
      useScoreOverride: false,
      useRankPointsOverride: false,
    });
    
    // Navigate to analysis page
    navigate('/analysis');
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">2025 Reefscape - Match Scouting</h2>
      
      {validationError && (
        <div className="alert alert-danger" role="alert">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Match Information */}
        <div className="card mb-3">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Match Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="matchNumber">Match Number</label>
                  <NumberInput
                    id="matchNumber"
                    name="matchNumber"
                    value={formData.matchNumber}
                    onChange={handleChange}
                    min={1}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="teamNumber">Team Number</label>
                  <NumberInput
                    id="teamNumber"
                    name="teamNumber"
                    value={formData.teamNumber}
                    onChange={handleChange}
                    min={1}
                    max={9999}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Starting Position Selector */}
        <div className="row">
          <div className="col-12">
            <label className="mb-2">Starting Position</label>
            <div className="field-diagram d-flex" style={{ 
              backgroundColor: '#f8f9fa',
              border: '2px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* Blue Alliance Side */}
              <div style={{ 
                flex: 1,
                backgroundColor: '#0d6efd15',
                borderRight: '1px solid #dee2e6',
                padding: '10px'
              }}>
                <div className="text-center mb-2">
                  <strong style={{ color: '#0d6efd', fontSize: '0.9rem' }}>Blue Alliance</strong>
                </div>
                <div className="d-flex flex-column gap-2">
                  {[1, 2, 3].map((position) => (
                    <button
                      key={position}
                      type="button"
                      className={`btn ${formData.startingPosition === `blue${position}` ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({
                        target: {
                          name: 'startingPosition',
                          value: `blue${position}`
                        }
                      })}
                      style={{ 
                        fontSize: '0.9rem',
                        padding: '6px',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      Position {position}
                      {correctPosition === `blue${position}` && (
                        <i className="bi bi-star-fill text-warning position-absolute" 
                           style={{ 
                             fontSize: '0.8rem', 
                             top: '2px', 
                             right: '4px' 
                           }}
                        ></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Red Alliance Side */}
              <div style={{ 
                flex: 1,
                backgroundColor: '#dc354515',
                borderLeft: '1px solid #dee2e6',
                padding: '10px'
              }}>
                <div className="text-center mb-2">
                  <strong style={{ color: '#dc3545', fontSize: '0.9rem' }}>Red Alliance</strong>
                </div>
                <div className="d-flex flex-column gap-2">
                  {[1, 2, 3].map((position) => (
                    <button
                      key={position}
                      type="button"
                      className={`btn ${formData.startingPosition === `red${position}` ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleChange({
                        target: {
                          name: 'startingPosition',
                          value: `red${position}`
                        }
                      })}
                      style={{ 
                        fontSize: '0.9rem',
                        padding: '6px',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      Position {position}
                      {correctPosition === `red${position}` && (
                        <i className="bi bi-star-fill text-warning position-absolute" 
                           style={{ 
                             fontSize: '0.8rem', 
                             top: '2px', 
                             right: '4px' 
                           }}
                        ></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety and Fouls */}
        <div className="card mb-3">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Safety and Fouls</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(2)', transformOrigin: 'left center', margin: '20px 0' }}>
                  <input
                    type="checkbox"
                    name="autoStop"
                    className="form-check-input"
                    checked={formData.autoStop}
                    onChange={e => handleChange({
                      target: {
                        name: e.target.name,
                        value: e.target.checked
                      }
                    })}
                  />
                  <label className="form-check-label ms-2" style={{ fontSize: '0.65em' }}>Auto Stop</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(2)', transformOrigin: 'left center', margin: '20px 0' }}>
                  <input
                    type="checkbox"
                    name="eStop"
                    className="form-check-input"
                    checked={formData.eStop}
                    onChange={e => handleChange({
                      target: {
                        name: e.target.name,
                        value: e.target.checked
                      }
                    })}
                  />
                  <label className="form-check-label ms-2" style={{ fontSize: '0.65em' }}>E-Stop</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(2)', transformOrigin: 'left center', margin: '20px 0' }}>
                  <input
                    type="checkbox"
                    name="hitOpponentCage"
                    className="form-check-input"
                    checked={formData.hitOpponentCage}
                    onChange={e => handleChange({
                      target: {
                        name: e.target.name,
                        value: e.target.checked
                      }
                    })}
                  />
                  <label className="form-check-label ms-2" style={{ fontSize: '0.65em' }}>Hit Opponent</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(2)', transformOrigin: 'left center', margin: '20px 0' }}>
                  <input
                    type="checkbox"
                    name="crossedOpponentSide"
                    className="form-check-input"
                    checked={formData.crossedOpponentSide}
                    onChange={e => handleChange({
                      target: {
                        name: e.target.name,
                        value: e.target.checked
                      }
                    })}
                  />
                  <label className="form-check-label ms-2" style={{ fontSize: '0.65em' }}>Crossed Side</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autonomous Period */}
        <div className="card mb-3">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Autonomous Period</h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-12 d-flex justify-content-center">
                <div className="form-check" style={{ transform: 'scale(2)', margin: '20px 0' }}>
                  <input
                    type="checkbox"
                    name="movedInAuto"
                    className="form-check-input"
                    checked={formData.movedInAuto}
                    onChange={e => handleChange({
                      target: {
                        name: e.target.name,
                        value: e.target.checked
                      }
                    })}
                  />
                  <label className="form-check-label ms-2" style={{ fontSize: '0.65em' }}>Moved in Auto</label>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Coral Scoring</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label><strong>L1 (3pts)</strong></label>
                          <NumberInput
                            name="autoCoralL1"
                            value={formData.autoCoralL1}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                        <div className="form-group mb-3">
                          <label><strong>L2 (4pts)</strong></label>
                          <NumberInput
                            name="autoCoralL2"
                            value={formData.autoCoralL2}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label><strong>L3 (6pts)</strong></label>
                          <NumberInput
                            name="autoCoralL3"
                            value={formData.autoCoralL3}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                        <div className="form-group mb-3">
                          <label><strong>L4 (7pts)</strong></label>
                          <NumberInput
                            name="autoCoralL4"
                            value={formData.autoCoralL4}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Algae Scoring</h6>
                  </div>
                  <div className="card-body">
                    <div className="form-group mb-3">
                      <label><strong>Processor (6pts)</strong></label>
                      <NumberInput
                        name="autoAlgaeProcessor"
                        value={formData.autoAlgaeProcessor}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label><strong>Net (4pts)</strong></label>
                      <NumberInput
                        name="autoAlgaeNet"
                        value={formData.autoAlgaeNet}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row mt-3">
              <div className="col-12">
                <div className="form-group">
                  <label>Auto Notes</label>
                  <textarea
                    name="autoNotes"
                    className="form-control"
                    value={formData.autoNotes}
                    onChange={handleChange}
                    placeholder="Describe their autonomous performance..."
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teleop Period */}
        <div className="card mb-3">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Teleop Period</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Coral Scoring</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label><strong>L1 (2pts)</strong></label>
                          <NumberInput
                            name="teleopCoralL1"
                            value={formData.teleopCoralL1}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                        <div className="form-group mb-3">
                          <label><strong>L2 (3pts)</strong></label>
                          <NumberInput
                            name="teleopCoralL2"
                            value={formData.teleopCoralL2}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label><strong>L3 (4pts)</strong></label>
                          <NumberInput
                            name="teleopCoralL3"
                            value={formData.teleopCoralL3}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                        <div className="form-group mb-3">
                          <label><strong>L4 (5pts)</strong></label>
                          <NumberInput
                            name="teleopCoralL4"
                            value={formData.teleopCoralL4}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Algae Scoring</h6>
                  </div>
                  <div className="card-body">
                    <div className="form-group mb-3">
                      <label><strong>Processor (6pts)</strong></label>
                      <NumberInput
                        name="teleopAlgaeProcessor"
                        value={formData.teleopAlgaeProcessor}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <label><strong>Net (4pts)</strong></label>
                      <NumberInput
                        name="teleopAlgaeNet"
                        value={formData.teleopAlgaeNet}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Human Player Scoring</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label><strong>Net Scoring (4pts)</strong></label>
                          <NumberInput
                            name="humanPlayerNetScoring"
                            value={formData.humanPlayerNetScoring}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label><strong>Net Misses</strong></label>
                          <NumberInput
                            name="humanPlayerNetMisses"
                            value={formData.humanPlayerNetMisses}
                            onChange={handleChange}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="row mt-3">
              <div className="col-12">
                <div className="form-group">
                  <label>Teleop Notes</label>
                  <textarea
                    name="teleopNotes"
                    className="form-control"
                    value={formData.teleopNotes}
                    onChange={handleChange}
                    placeholder="Describe their teleop performance..."
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Endgame */}
        <div className="card mb-3">
          <div className="card-header bg-light">
            <h6 className="mb-0">Endgame</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.endgamePosition === 'park' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'endgamePosition', value: 'park' } })}
                    >
                      Park
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.endgamePosition === 'shallow' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'endgamePosition', value: 'shallow' } })}
                    >
                      Shallow Hang
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.endgamePosition === 'deep' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'endgamePosition', value: 'deep' } })}
                    >
                      Deep Hang
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.endgamePosition === 'none' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'endgamePosition', value: 'none' } })}
                    >
                      None
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Summary */}
        <div className="card mb-3">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0" style={{ fontSize: '1.3rem' }}>Match Summary</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0" style={{ fontSize: '1.1rem' }}>Points Breakdown</h6>
                  </div>
                  <div className="card-body">
                    <div className="list-group">
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Auto
                        <span className="badge bg-secondary rounded-pill" style={{ fontSize: '1rem' }}>
                          {calculateAutoCoralPoints() + ((Number(formData.autoAlgaeProcessor) * 6) + (Number(formData.autoAlgaeNet) * 4))}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Teleop
                        <span className="badge bg-secondary rounded-pill" style={{ fontSize: '1rem' }}>
                          {calculateTeleopCoralPoints() + ((Number(formData.teleopAlgaeProcessor) * 6) + (Number(formData.teleopAlgaeNet) * 4))}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Endgame
                        <span className="badge bg-secondary rounded-pill" style={{ fontSize: '1rem' }}>
                          {calculateEndgamePoints()}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center bg-light py-3" style={{ fontSize: '1.2rem' }}>
                        <strong>Total Points</strong>
                        <span className="badge bg-dark rounded-pill" style={{ fontSize: '1.1rem' }}>
                          {formData.matchTotalPoints}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0" style={{ fontSize: '1.1rem' }}>Rank Points</h6>
                  </div>
                  <div className="card-body">
                    <div className="list-group">
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Match Result
                        <span className="badge bg-secondary rounded-pill" style={{ fontSize: '1rem' }}>
                          {formData.matchResult === 'win' ? '3' : 
                           formData.matchResult === 'tie' ? '1' : '0'}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Auto RP
                        <span className={`badge ${formData.movedInAuto && 
                          (Number(formData.autoCoralL1) + Number(formData.autoCoralL2) + 
                           Number(formData.autoCoralL3) + Number(formData.autoCoralL4)) >= 1 
                          ? 'bg-success' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '1rem' }}>
                          {formData.movedInAuto && 
                           (Number(formData.autoCoralL1) + Number(formData.autoCoralL2) + 
                            Number(formData.autoCoralL3) + Number(formData.autoCoralL4)) >= 1 ? '1' : '0'}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Coral RP
                        <span className={`badge rounded-pill ${(() => {
                          const coopertitionAchieved = 
                            Number(formData.autoAlgaeProcessor) >= 2 && 
                            Number(formData.teleopAlgaeProcessor) >= 2;
                          const coralLevels = [
                            Number(formData.teleopCoralL1) + Number(formData.autoCoralL1),
                            Number(formData.teleopCoralL2) + Number(formData.autoCoralL2),
                            Number(formData.teleopCoralL3) + Number(formData.autoCoralL3),
                            Number(formData.teleopCoralL4) + Number(formData.autoCoralL4)
                          ];
                          const levelsWithFiveCoral = coralLevels.filter(level => level >= 5).length;
                          return (coopertitionAchieved ? levelsWithFiveCoral >= 3 : levelsWithFiveCoral >= 4) ? 'bg-success' : 'bg-secondary';
                        })()}`} style={{ fontSize: '1rem' }}>
                          {(() => {
                            const coopertitionAchieved = 
                              Number(formData.autoAlgaeProcessor) >= 2 && 
                              Number(formData.teleopAlgaeProcessor) >= 2;
                            const coralLevels = [
                              Number(formData.teleopCoralL1) + Number(formData.autoCoralL1),
                              Number(formData.teleopCoralL2) + Number(formData.autoCoralL2),
                              Number(formData.teleopCoralL3) + Number(formData.autoCoralL3),
                              Number(formData.teleopCoralL4) + Number(formData.autoCoralL4)
                            ];
                            const levelsWithFiveCoral = coralLevels.filter(level => level >= 5).length;
                            return (coopertitionAchieved ? levelsWithFiveCoral >= 3 : levelsWithFiveCoral >= 4) ? '1' : '0';
                          })()}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center py-3" style={{ fontSize: '1.1rem' }}>
                        Barge RP
                        <span className={`badge ${(() => {
                          const bargePoints = 
                            (Number(formData.autoAlgaeProcessor) + Number(formData.teleopAlgaeProcessor)) * 6 +
                            (Number(formData.autoAlgaeNet) + Number(formData.teleopAlgaeNet)) * 4;
                          return bargePoints >= 14 ? 'bg-success' : 'bg-secondary';
                        })()} rounded-pill`} style={{ fontSize: '1rem' }}>
                          {(() => {
                            const bargePoints = 
                              (Number(formData.autoAlgaeProcessor) + Number(formData.teleopAlgaeProcessor)) * 6 +
                              (Number(formData.autoAlgaeNet) + Number(formData.teleopAlgaeNet)) * 4;
                            return bargePoints >= 14 ? '1' : '0';
                          })()}
                        </span>
                      </div>
                      <div className="list-group-item d-flex justify-content-between align-items-center bg-light py-3" style={{ fontSize: '1.2rem' }}>
                        <strong>Total RP</strong>
                        <span className="badge bg-dark rounded-pill" style={{ fontSize: '1.1rem' }}>
                          {formData.totalRankPoints}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Score Override */}
        <div className="card mb-3">
          <div className="card-header bg-danger text-white">
            <h6 className="mb-0">Emergency Score Override</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label><strong>Score Override</strong></label>
                  <NumberInput
                    name="scoreOverride"
                    value={formData.scoreOverride}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className={`btn ${formData.useScoreOverride ? 'btn-danger' : 'btn-outline-danger'} flex-grow-1`}
                    onClick={() => setFormData(prev => ({ ...prev, useScoreOverride: true }))}
                  >
                    Override Score
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary flex-grow-1"
                    onClick={() => setFormData(prev => ({ ...prev, useScoreOverride: false }))}
                  >
                    Use Regular Score
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label><strong>Rank Points Override</strong></label>
                  <NumberInput
                    name="rankPointsOverride"
                    value={formData.rankPointsOverride}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className={`btn ${formData.useRankPointsOverride ? 'btn-danger' : 'btn-outline-danger'} flex-grow-1`}
                    onClick={() => setFormData(prev => ({ ...prev, useRankPointsOverride: true }))}
                  >
                    Override RP
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary flex-grow-1"
                    onClick={() => setFormData(prev => ({ ...prev, useRankPointsOverride: false }))}
                  >
                    Use Regular RP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Results */}
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Match Results</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mx-auto">
                <div className="card">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Match Result</h6>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn flex-grow-1 ${formData.matchResult === 'win' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => handleChange({ target: { name: 'matchResult', value: 'win' } })}
                        >
                          Win
                        </button>
                        <button
                          type="button"
                          className={`btn flex-grow-1 ${formData.matchResult === 'tie' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => handleChange({ target: { name: 'matchResult', value: 'tie' } })}
                        >
                          Tie
                        </button>
                        <button
                          type="button"
                          className={`btn flex-grow-1 ${formData.matchResult === 'loss' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => handleChange({ target: { name: 'matchResult', value: 'loss' } })}
                        >
                          Loss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-4">
          <button type="submit" className="btn btn-primary btn-lg">
            Submit Match Data
          </button>
        </div>
      </form>

      {/* QR Code Overlay */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '90%',
            width: '500px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '1rem',
                border: 'none',
                background: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>
              Scan QR Code to Copy Data
            </h3>
            
            <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
              Scan this QR code to copy the match data into Google Sheets.
              Each value will be pasted into separate cells.
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <QRCodeSVG
                value={qrData}
                size={300}
                level="M"
                includeMargin={true}
                style={{
                  padding: '1rem',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#666',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Tip: Use a QR code scanner app that supports copying text to clipboard
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCloseQRAndNavigate}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Continue to Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scout;

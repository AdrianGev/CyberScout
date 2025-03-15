import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { tbaService } from '../services/tba-service';
import { QRCodeSVG } from 'qrcode.react';
import { addMatch } from '../store/scoutingSlice';
import NumberInput from '../components/NumberInput';

function Scout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const eventMatches = useSelector(state => state.scouting.eventMatches);
  const selectedEvent = useSelector(state => state.scouting.selectedEvent);
  const { autoCollapseEnabled, autoCollapseDelay, smartInfoCardEnabled, showInfoCard } = useSelector(state => state.settings);

  // Refs for mutable values
  const autoCollapseTimer = useRef(null);
  const autoFirstEdit = useRef(false);
  const formDataRef = useRef(null);

  // Form Data State
  const [formData, setFormData] = useState({
    scouterName: '',
    matchNumber: '',
    teamNumber: '',
    startingPosition: '',
    autoStop: false,
    eStop: false,
    died: false,
    fellOver: false,
    yellowCard: false,
    redCard: false,
    hitOpponentCage: false,
    crossedOpponentSide: false,
    movedInAuto: false,
    otherAllianceMembersMoved: 0,
    autoPoints: 0,
    autoCoralL1: 0,
    autoCoralL2: 0,
    autoCoralL3: 0,
    autoCoralL4: 0,
    autoAlgaeProcessor: 0,
    autoAlgaeNet: 0,
    autoNotes: '',
    autoRankPoint: 0,
    teleopCoralL1: 0,
    teleopCoralL2: 0,
    teleopCoralL3: 0,
    teleopCoralL4: 0,
    teleopCoralMissed: 0,
    teleopAlgaeProcessor: 0,
    teleopAlgaeNet: 0,
    humanPlayerNetScoring: 0,
    humanPlayerNetMisses: 0,
    teleopNotes: '',
    teleopTotalPoints: 0,
    endgamePosition: '', 
    endgameTotalPoints: 0,
    botPlaystyle: '',
    matchResult: '', 
    matchTotalPoints: 0,
    scoreOverride: 0,
    useScoreOverride: false,
  });

  // Other State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQRData] = useState('');
  const [tbaRankPoints, setTbaRankPoints] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [correctPosition, setCorrectPosition] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [teleopCollapsed, setTeleopCollapsed] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Keep formDataRef in sync with formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const validateTeamAndMatch = useCallback((matchNum, teamNum) => {
    if (!matchNum || !teamNum) {
      setValidationError('Please enter both match and team numbers');
      return false;
    }

    // Match number validation
    if (isNaN(matchNum) || matchNum < 1) {
      setValidationError('Please enter a valid match number');
      return false;
    }

    // Team number validation
    if (isNaN(teamNum) || teamNum < 1 || teamNum > 10715) {
      setValidationError('Please enter a valid team number');
      return false;
    }

    // Check if match exists in eventMatches
    if (eventMatches?.length > 0) {
      const matchExists = eventMatches.some(match => 
        match.match_number === parseInt(matchNum)
      );

      if (!matchExists) {
        setValidationError(`Match ${matchNum} not found in the event schedule`);
        return false;
      }

      // Check if team is in the match
      const match = eventMatches.find(m => m.match_number === parseInt(matchNum));
      if (match) {
        const teamInMatch = [...match.alliances.blue.team_keys, ...match.alliances.red.team_keys]
          .some(teamKey => parseInt(teamKey.replace('frc', '')) === parseInt(teamNum));

        if (!teamInMatch) {
          setValidationError(`Team ${teamNum} is not scheduled for match ${matchNum}`);
          return false;
        }
      }
    }

    setValidationError('');
    return true;
  }, [eventMatches]);

  const handleChange = useCallback(({ target: { name, value } }) => {
    setFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      
      // Check if this is an auto section field
      if (autoCollapseEnabled && !autoFirstEdit.current && (
        name.startsWith('auto') || 
        name === 'movedInAuto' || 
        name === 'otherAllianceMembersMoved'
      )) {
        autoFirstEdit.current = true;
        // Clear any existing timer
        if (autoCollapseTimer.current) {
          clearTimeout(autoCollapseTimer.current);
        }
        // Set new timer
        autoCollapseTimer.current = setTimeout(() => {
          setAutoCollapsed(true);
          autoFirstEdit.current = false;
        }, autoCollapseDelay);
      }
      
      // Update autoRankPoint when movedInAuto or otherAllianceMembersMoved changes
      if (name === 'movedInAuto' || name === 'otherAllianceMembersMoved') {
        const autoQualifies = 
          (name === 'movedInAuto' ? value : prevData.movedInAuto) && 
          Number(name === 'otherAllianceMembersMoved' ? value : prevData.otherAllianceMembersMoved) === 2;
        newData.autoRankPoint = autoQualifies ? 1 : 0;
      }
      
      // Validate team and match numbers when either changes
      if (name === 'matchNumber' || name === 'teamNumber') {
        const currentFormData = formDataRef.current;
        if (currentFormData.matchNumber && currentFormData.teamNumber) {
          validateTeamAndMatch(
            name === 'matchNumber' ? value : currentFormData.matchNumber,
            name === 'teamNumber' ? value : currentFormData.teamNumber
          );
        }
      }
      
      return newData;
    });
  }, [validateTeamAndMatch, autoCollapseEnabled, autoCollapseDelay]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
    };
  }, []);

  // Reset timer when auto section is manually expanded
  useEffect(() => {
    if (!autoCollapsed && autoCollapseEnabled && autoFirstEdit.current) {
      if (autoCollapseTimer.current) {
        clearTimeout(autoCollapseTimer.current);
      }
      autoCollapseTimer.current = setTimeout(() => {
        setAutoCollapsed(true);
        autoFirstEdit.current = false;
      }, autoCollapseDelay);
    }
  }, [autoCollapsed, autoCollapseEnabled, autoCollapseDelay]);

  useEffect(() => {
    const handleScroll = () => {
      const startingPositionSection = document.querySelector('.starting-position-section');
      if (startingPositionSection) {
        const rect = startingPositionSection.getBoundingClientRect();
        // Show panel when the bottom of the starting position section moves above the viewport
        setShowInfoPanel(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPosition = (pos) => {
    switch(pos) {
      case 'blue1': return 'Blue 1';
      case 'blue2': return 'Blue 2';
      case 'blue3': return 'Blue 3';
      case 'red1': return 'Red 1';
      case 'red2': return 'Red 2';
      case 'red3': return 'Red 3';
      default: return '';
    }
  };

  const InfoPanel = () => {
    const { smartInfoCardEnabled, showInfoCard } = useSelector(state => state.settings);
    
    if (!showInfoCard) return null;
    
    return (
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '180px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          padding: '12px',
          border: '1px solid #dee2e6',
          fontSize: '0.9rem',
          opacity: smartInfoCardEnabled ? (showInfoPanel ? '1' : '0') : '1',
          transform: smartInfoCardEnabled ? (showInfoPanel ? 'translateY(0)' : 'translateY(-20px)') : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: smartInfoCardEnabled ? (showInfoPanel ? 'auto' : 'none') : 'auto',
          textAlign: 'center'
        }}
      >
        <h6 className="mb-2 text-primary border-bottom pb-2 text-center">Info</h6>
        <div className="small text-muted mb-1">Name</div>
        <div className="mb-2 fw-bold">{formData.scouterName || 'None'}</div>
        <div className="small text-muted mb-1">Match</div>
        <div className="mb-2 fw-bold">{formData.matchNumber || 'None'}</div>
        <div className="small text-muted mb-1">Team</div>
        <div className="mb-2 fw-bold">{formData.teamNumber || 'None'}</div>
        <div className="small text-muted mb-1">Position</div>
        <div className="fw-bold">{formatPosition(formData.startingPosition) || 'None'}</div>
      </div>
    );
  };

  const fetchMatchData = async () => {
    try {
      if (!selectedEvent || !formData.matchNumber || !formData.teamNumber) return;

      const matchData = await tbaService.getMatchData(selectedEvent.key, formData.matchNumber, formData.teamNumber);
      if (matchData && matchData.position) {
        setFormData(prev => ({ ...prev, startingPosition: matchData.position }));
        handleChange({ target: { name: 'startingPosition', value: matchData.position }});
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
    }
  };

  useEffect(() => {
    fetchMatchData();
  }, [selectedEvent, formData.matchNumber, formData.teamNumber, handleChange]);

  const formatDataForSheets = (data) => {
    const orderedFields = [
      // 1-4: Scouter & Match Info
      data.scouterName,          // 1. Scouter's Name
      data.matchNumber,          // 2. Match Number
      data.teamNumber,           // 3. Team Number
      data.startingPosition,     // 4. Starting Position
      
      // 5-12: Safety & Fouls
      data.autoStop ? 'True' : 'False',              // 5. Auto Stop
      data.eStop ? 'True' : 'False',                 // 6. E-Stop
      data.died ? 'True' : 'False',                  // 7. Died
      data.fellOver ? 'True' : 'False',              // 8. Fell Over
      data.yellowCard ? 'True' : 'False',            // 9. Yellow Card
      data.redCard ? 'True' : 'False',               // 10. Red Card
      data.hitOpponentCage ? 'True' : 'False',       // 11. Hit Opponent Cage
      data.crossedOpponentSide ? 'True' : 'False',   // 12. Crossed Opponent Side
      
      // 13-21: Autonomous
      data.movedInAuto ? 'True' : 'False',   // 13. Moved in Auto
      data.otherAllianceMembersMoved,        // 14. Other Alliance Members Moved
      data.autoCoralL1,                      // 15. Auto Coral L1
      data.autoCoralL2,                      // 16. Auto Coral L2
      data.autoCoralL3,                      // 17. Auto Coral L3
      data.autoCoralL4,                      // 18. Auto Coral L4
      data.autoAlgaeProcessor,               // 19. Auto Algae Processor
      data.autoAlgaeNet,                     // 20. Auto Algae Net
      data.autoNotes,                        // 21. Auto Notes
      
      // 22-32: Teleop
      data.teleopCoralL1,           // 22. Teleop Coral L1
      data.teleopCoralL2,           // 23. Teleop Coral L2
      data.teleopCoralL3,           // 24. Teleop Coral L3
      data.teleopCoralL4,           // 25. Teleop Coral L4
      data.teleopCoralMissed,       // 26. Teleop Coral Missed
      data.teleopAlgaeProcessor,    // 27. Teleop Algae Processor
      data.teleopAlgaeNet,          // 28. Teleop Algae Net
      data.humanPlayerNetScoring,   // 29. Human Player Net Scoring
      data.humanPlayerNetMisses,    // 30. Human Player Net Misses
      data.teleopNotes,             // 31. Teleop Notes
      data.teleopTotalPoints,       // 32. Teleop Total Points
      
      // 33-34: Endgame
      data.endgamePosition,      // 33. Endgame Position
      data.endgameTotalPoints,   // 34. Endgame Total Points
      
      // 35: Bot Playstyle
      data.botPlaystyle,         // 35. Bot Playstyle
      
      // 36-37: Match Results
      data.matchResult,          // 36. Match Result
      data.matchTotalPoints      // 37. Match Total Points
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

  const calculateAutoPoints = () => {
    return calculateAutoCoralPoints() + 
      ((Number(formData.autoAlgaeProcessor) * 6) + (Number(formData.autoAlgaeNet) * 4));
  };

  const calculateTeleopPoints = () => {
    return calculateTeleopCoralPoints() + 
      ((Number(formData.teleopAlgaeProcessor) * 6) + 
       (Number(formData.teleopAlgaeNet) * 4) + 
       (Number(formData.humanPlayerNetScoring) * 4));
  };

  // Calculate total points
  const calculateTotalPoints = () => {
    if (formData.useScoreOverride) {
      return Number(formData.scoreOverride);
    }

    const autoPoints = calculateAutoPoints();
    const teleopPoints = calculateTeleopPoints();
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

    // Auto RP - this robot moved and all other alliance robots moved
    const autoQualifies = formData.movedInAuto && formData.otherAllianceMembersMoved === 2;
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
    const totalPoints = calculateTotalPoints();
    setFormData(prev => ({
      ...prev,
      matchTotalPoints: totalPoints
    }));
  }, [
    calculateAutoPoints,
    calculateEndgamePoints,
    calculateRankPoints,
    calculateTeleopPoints,
    formData.autoAlgaeProcessor,
    formData.autoAlgaeNet,
    formData.teleopAlgaeProcessor,
    formData.teleopAlgaeNet,
    formData.humanPlayerNetScoring,
    formData.endgamePosition,
    formData.scoreOverride,
    formData.useScoreOverride
  ]);

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
      scouterName: '',  
      matchNumber: '',
      teamNumber: '',
      startingPosition: '',
      movedInAuto: false,
      otherAllianceMembersMoved: 0,
      autoPoints: 0,
      autoCoralL1: 0,
      autoCoralL2: 0,
      autoCoralL3: 0,
      autoCoralL4: 0,
      autoAlgaeProcessor: 0,
      autoAlgaeNet: 0,
      autoNotes: '',
      autoRankPoint: 0,
      teleopCoralL1: 0,
      teleopCoralL2: 0,
      teleopCoralL3: 0,
      teleopCoralL4: 0,
      teleopCoralMissed: 0,
      teleopAlgaeProcessor: 0,
      teleopAlgaeNet: 0,
      humanPlayerNetScoring: 0,
      humanPlayerNetMisses: 0,
      teleopNotes: '',
      teleopTotalPoints: 0,
      endgamePosition: '', 
      endgameTotalPoints: 0,
      botPlaystyle: '',
      matchResult: '', 
      matchTotalPoints: 0,
      scoreOverride: 0,
      useScoreOverride: false,
    });
    
    // Navigate to analysis page
    navigate('/analysis');
  };

  const handleClearForm = () => {
    setShowClearConfirm(true);
  };

  const confirmClearForm = () => {
    const previousScouterName = formData.scouterName;
    const previousStartingPosition = formData.startingPosition;
    
    setFormData({
      scouterName: previousScouterName,  
      matchNumber: '',
      teamNumber: '',
      startingPosition: previousStartingPosition, 
      movedInAuto: false,
      otherAllianceMembersMoved: 0,
      autoPoints: 0,
      autoCoralL1: 0,
      autoCoralL2: 0,
      autoCoralL3: 0,
      autoCoralL4: 0,
      autoAlgaeProcessor: 0,
      autoAlgaeNet: 0,
      autoNotes: '',
      autoRankPoint: 0,
      teleopCoralL1: 0,
      teleopCoralL2: 0,
      teleopCoralL3: 0,
      teleopCoralL4: 0,
      teleopCoralMissed: 0,
      teleopAlgaeProcessor: 0,
      teleopAlgaeNet: 0,
      humanPlayerNetScoring: 0,
      humanPlayerNetMisses: 0,
      teleopNotes: '',
      teleopTotalPoints: 0,
      endgamePosition: '', 
      endgameTotalPoints: 0,
      botPlaystyle: '',
      matchResult: '', 
      matchTotalPoints: 0,
      scoreOverride: 0,
      useScoreOverride: false,
    });
    setShowClearConfirm(false);
  };

  return (
    <div className="container py-4 position-relative">
      {/* Clear Form Modal */}
      {showClearConfirm && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Clear Form</h5>
              <button type="button" className="btn-close" onClick={() => setShowClearConfirm(false)}></button>
            </div>
            <div className="modal-body">
              <p>Do you want to clear the form?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={confirmClearForm}>Yes I want to</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>No I don't</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Floating Info Panel */}
      <InfoPanel />

      <h2 className="text-center mb-4">2025 Reefscape - Match Scouting</h2>
      
      <form onSubmit={handleSubmit} className="scout-form">
        {/* Scouter Information */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">Scouter Information</h5>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label htmlFor="scouterName">Scouter's Name:</label>
              <input
                type="text"
                id="scouterName"
                name="scouterName"
                className="form-control"
                value={formData.scouterName}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
          </div>
        </div>

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
                    max={11000}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={handleClearForm}
                >
                  Clear Form
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Starting Position */}
        <div className="card mb-4 starting-position-section">
          <div className="card-header bg-light">
            <h6 className="mb-0">Starting Position</h6>
          </div>
          <div className="card-body">
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
                  <strong style={{ color: '#0d6efd' }}>Blue Alliance</strong>
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
                        padding: '6px',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      Position {position}
                      {correctPosition === `blue${position}` && (
                        <i className="bi bi-star-fill text-warning position-absolute" 
                           style={{ 
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
                  <strong style={{ color: '#dc3545' }}>Red Alliance</strong>
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
                        padding: '6px',
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      Position {position}
                      {correctPosition === `red${position}` && (
                        <i className="bi bi-star-fill text-warning position-absolute" 
                           style={{ 
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

        {/* Safety & Fouls */}
        <div className="card mb-4">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Safety and Fouls</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="autoStop"
                    name="autoStop"
                    checked={formData.autoStop}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="autoStop">Auto Stop</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="eStop"
                    name="eStop"
                    checked={formData.eStop}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="eStop">E-Stop</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="died"
                    name="died"
                    checked={formData.died}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="died">Died</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="fellOver"
                    name="fellOver"
                    checked={formData.fellOver}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="fellOver">Fell Over</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="yellowCard"
                    name="yellowCard"
                    checked={formData.yellowCard}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="yellowCard">Yellow Card</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="redCard"
                    name="redCard"
                    checked={formData.redCard}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="redCard">Red Card</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="hitOpponentCage"
                    name="hitOpponentCage"
                    checked={formData.hitOpponentCage}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="hitOpponentCage">Hit Opponent Cage</label>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="crossedOpponentSide"
                    name="crossedOpponentSide"
                    checked={formData.crossedOpponentSide}
                    onChange={e => handleChange({ target: { name: e.target.name, value: e.target.checked }})}
                  />
                  <label className="form-check-label" htmlFor="crossedOpponentSide">Crossed Side</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autonomous */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center" 
               data-bs-toggle="collapse"
               data-bs-target="#autoSection"
               aria-expanded="true"
               aria-controls="autoSection"
               onClick={() => setAutoCollapsed(!autoCollapsed)} 
               style={{ cursor: 'pointer', padding: '0.75rem 1.25rem' }}>
            <h5 className="card-title mb-0">Autonomous Period</h5>
            <div 
              style={{ 
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid rgba(255, 255, 255, 0.9)',
                transition: 'transform 0.3s ease',
                transform: `rotate(${autoCollapsed ? 180 : 0}deg)`,
                marginLeft: '8px'
              }}
            />
          </div>
          <div className={`collapse card-body p-3 ${autoCollapsed ? '' : 'show'}`} id="autoSection">
            {/* Auto Movement */}
            <div className="row">
              <div className="col-md-6">
                <div className="form-check" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', margin: '20px 0' }}>
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
                  <label className="form-check-label ms-2">Moved in Auto</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="d-flex flex-column" style={{ transform: 'scale(1.5)', transformOrigin: 'left center', margin: '20px 0' }}>
                  <label className="form-check-label">Other Alliance Members Moved:</label>
                  <div className="d-flex align-items-center">
                    <input
                      type="range"
                      className="form-range"
                      style={{ width: '120px' }}
                      name="otherAllianceMembersMoved"
                      min="0"
                      max="2"
                      step="1"
                      value={formData.otherAllianceMembersMoved}
                      onChange={handleChange}
                    />
                    <span className="ms-3 fs-5">{formData.otherAllianceMembersMoved}</span>
                  </div>
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
                    className="form-control"
                    name="autoNotes"
                    value={formData.autoNotes}
                    onChange={handleChange}
                    maxLength={100}
                    rows={3}
                  />
                  <div className="text-end mt-1">
                    <small className="text-muted">
                      Characters Remaining: {100 - formData.autoNotes.length}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teleop */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center" 
               data-bs-toggle="collapse"
               data-bs-target="#teleopSection"
               aria-expanded="true"
               aria-controls="teleopSection"
               onClick={() => setTeleopCollapsed(!teleopCollapsed)} 
               style={{ cursor: 'pointer', padding: '0.75rem 1.25rem' }}>
            <h5 className="card-title mb-0">Teleop Period</h5>
            <div 
              style={{ 
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid rgba(255, 255, 255, 0.9)',
                transition: 'transform 0.3s ease',
                transform: `rotate(${teleopCollapsed ? 180 : 0}deg)`,
                marginLeft: '8px'
              }}
            />
          </div>
          <div className={`collapse card-body p-3 ${teleopCollapsed ? '' : 'show'}`} id="teleopSection">
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
                    <div className="row mt-2">
                      <div className="col-12">
                        <div className="form-group mb-3">
                          <label><strong>Coral Missed</strong></label>
                          <NumberInput
                            name="teleopCoralMissed"
                            value={formData.teleopCoralMissed}
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
                    className="form-control"
                    name="teleopNotes"
                    value={formData.teleopNotes}
                    onChange={handleChange}
                    maxLength={100}
                    rows={3}
                  />
                  <div className="text-end mt-1">
                    <small className="text-muted">
                      Characters Remaining: {100 - formData.teleopNotes.length}
                    </small>
                  </div>
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

        {/* Bot Playstyle */}
        <div className="card mb-3">
          <div className="card-header bg-light">
            <h6 className="mb-0">Bot Playstyle</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12">
                <div className="form-group mb-3">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.botPlaystyle === 'defensive' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'botPlaystyle', value: 'defensive' } })}
                    >
                      Defensive
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.botPlaystyle === 'offensive' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'botPlaystyle', value: 'offensive' } })}
                    >
                      Offensive
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.botPlaystyle === 'feeder' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'botPlaystyle', value: 'feeder' } })}
                    >
                      Feeder
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.botPlaystyle === 'algae' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleChange({ target: { name: 'botPlaystyle', value: 'algae' } })}
                    >
                      Algae Remover
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Point Recap */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="card-title mb-0">Point Recap</h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col">
                <h6 className="text-muted mb-2">Auto</h6>
                <h4 className="mb-0">{calculateAutoPoints()}</h4>
              </div>
              <div className="col">
                <h6 className="text-muted mb-2">Teleop</h6>
                <h4 className="mb-0">{calculateTeleopPoints()}</h4>
              </div>
              <div className="col">
                <h6 className="text-muted mb-2">Endgame</h6>
                <h4 className="mb-0">{calculateEndgamePoints()}</h4>
              </div>
              <div className="col">
                <h6 className="text-muted mb-2">Total</h6>
                <h4 className="mb-0 text-primary">{calculateTotalPoints()}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Match Summary */}
        <div className="card mb-3">
          <div className="card-header bg-secondary text-white">
            <h6 className="mb-0">Match Summary</h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12">
                <div className="form-group mb-3">
                  <label className="form-label">Match Result</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.matchResult === 'win' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleChange({ target: { name: 'matchResult', value: 'win' } })}
                    >
                      Win
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.matchResult === 'loss' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleChange({ target: { name: 'matchResult', value: 'loss' } })}
                    >
                      Loss
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${formData.matchResult === 'tie' ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={() => handleChange({ target: { name: 'matchResult', value: 'tie' } })}
                    >
                      Tie
                    </button>
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

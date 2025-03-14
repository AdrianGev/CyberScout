import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  toggleAutoCollapse, 
  setAutoCollapseDelay,
  toggleSmartInfoCard 
} from '../redux/settingsSlice';

function Settings({ show, onClose }) {
  const dispatch = useDispatch();
  const { 
    autoCollapseEnabled, 
    autoCollapseDelay,
    smartInfoCardEnabled 
  } = useSelector(state => state.settings);
  const [delayInputValue, setDelayInputValue] = useState(autoCollapseDelay / 1000);

  const handleDelayChange = (e) => {
    // Allow any input including decimals
    const value = e.target.value;
    setDelayInputValue(value);
  };

  const handleDelayBlur = () => {
    // Only update Redux when input loses focus
    let value = parseFloat(delayInputValue);
    if (isNaN(value)) {
      value = 20; // Default to 20 if invalid
    }
    // Round to 1 decimal place
    value = Math.round(value * 10) / 10;
    // Clamp between 15 and 60
    value = Math.min(Math.max(value, 15), 60);
    setDelayInputValue(value);
    dispatch(setAutoCollapseDelay(value * 1000));
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1050
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="m-0">Settings</h3>
          <button 
            className="btn-close" 
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
        
        <div className="settings-content">
          {/* Info Card Settings */}
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h5 className="mb-0">Info Card</h5>
            </div>
            <div className="card-body">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="smartInfoCard"
                  checked={smartInfoCardEnabled}
                  onChange={() => dispatch(toggleSmartInfoCard())}
                />
                <label className="form-check-label" htmlFor="smartInfoCard">
                  Smart Info Card
                </label>
                <small className="text-muted d-block">
                  Show info card only when scrolling past the starting position section
                </small>
              </div>
              {!smartInfoCardEnabled && (
                <small className="text-muted d-block">
                  Info card will always be visible (default)
                </small>
              )}
            </div>
          </div>

          {/* Auto Section Behavior */}
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h5 className="mb-0">Auto Section Behavior</h5>
            </div>
            <div className="card-body">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="timedAutoCollapse"
                  checked={autoCollapseEnabled}
                  onChange={() => dispatch(toggleAutoCollapse())}
                />
                <label className="form-check-label" htmlFor="timedAutoCollapse">
                  Timed Auto Collapse
                </label>
                <small className="text-muted d-block">
                  Automatically collapse the Auto section after a delay
                </small>
              </div>
              {autoCollapseEnabled && (
                <div className="mb-3">
                  <label htmlFor="collapseDelay" className="form-label">
                    Auto Collapse Delay (seconds)
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      id="collapseDelay"
                      value={delayInputValue}
                      onChange={handleDelayChange}
                      onBlur={handleDelayBlur}
                    />
                    <span className="input-group-text">seconds</span>
                  </div>
                  <small className="text-muted">
                    Value will be adjusted to be between 15-60 seconds
                  </small>
                </div>
              )}
              {!autoCollapseEnabled && (
                <small className="text-muted d-block">
                  Auto section will remain expanded (default)
                </small>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

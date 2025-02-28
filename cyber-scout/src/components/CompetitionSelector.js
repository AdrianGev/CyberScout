import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { tbaService } from '../services/tba-service';
import { setSelectedDistrict, setSelectedEvent, setEventMatches, setLoading, setError } from '../store/scoutingSlice';

function CompetitionSelector() {
  const dispatch = useDispatch();
  const [districts, setDistricts] = useState([]);
  const [events, setEvents] = useState([]);
  const [teamNumber, setTeamNumber] = useState('');
  const [year, setYear] = useState('2025');
  const selectedDistrict = useSelector(state => state.scouting.selectedDistrict);
  const selectedEvent = useSelector(state => state.scouting.selectedEvent);

  // Create a function to fetch team events
  const fetchTeamEvents = async (team, selectedYear) => {
    if (!team) return;

    try {
      dispatch(setLoading(true));
      dispatch(setSelectedDistrict(null)); // Clear district selection
      
      // Fetch team's events for the selected year
      const teamEvents = await tbaService.getTeamEvents(team, selectedYear);
      
      // Sort events by start date (most recent first) and take the last 3
      const sortedEvents = teamEvents.sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      ).slice(0, 3);
      
      setEvents(sortedEvents);
      
      // Auto-select the most recent event
      if (sortedEvents.length > 0) {
        dispatch(setSelectedEvent(sortedEvents[0]));
        // Fetch matches for the selected event
        const matchesData = await tbaService.getEventMatches(sortedEvents[0].key);
        dispatch(setEventMatches(matchesData));
      }
    } catch (error) {
      dispatch(setError('Failed to fetch team events'));
      console.error('Error fetching team events:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Cancel function on unmount
  useEffect(() => {
    return () => {
      // No need to cancel, as it's not a debounced function
    };
  }, []);

  // Fetch districts when year changes
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        dispatch(setLoading(true));
        const districtsData = await tbaService.getDistricts(year);
        setDistricts(districtsData);
      } catch (error) {
        dispatch(setError('Failed to fetch districts'));
        console.error('Error fetching districts:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchDistricts();
  }, [year, dispatch]);

  // Fetch events when district changes
  useEffect(() => {
    const fetchDistrictEvents = async () => {
      if (!selectedDistrict) return;

      try {
        dispatch(setLoading(true));
        const eventsData = await tbaService.getDistrictEvents(selectedDistrict.key);
        setEvents(eventsData);
      } catch (error) {
        dispatch(setError('Failed to fetch events'));
        console.error('Error fetching events:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (selectedDistrict) {
      fetchDistrictEvents();
    }
  }, [selectedDistrict, dispatch]);

  const handleTeamNumberChange = (e) => {
    const value = e.target.value;
    setTeamNumber(value);
    
    // Clear events when team number is cleared
    if (!value) {
      setEvents([]);
      dispatch(setSelectedEvent(null));
      return;
    }

    // Trigger search
    fetchTeamEvents(value, year);
  };

  const handleDistrictChange = (e) => {
    const district = districts.find(d => d.key === e.target.value);
    dispatch(setSelectedDistrict(district));
    dispatch(setSelectedEvent(null));
    setTeamNumber(''); // Clear team number when selecting by district
  };

  const handleEventChange = async (e) => {
    const event = events.find(ev => ev.key === e.target.value);
    dispatch(setSelectedEvent(event));
    
    if (event) {
      try {
        const matchesData = await tbaService.getEventMatches(event.key);
        dispatch(setEventMatches(matchesData));
      } catch (error) {
        dispatch(setError('Failed to fetch matches'));
        console.error('Error fetching matches:', error);
      }
    }
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
    dispatch(setSelectedDistrict(null));
    dispatch(setSelectedEvent(null));
    setTeamNumber('');
    setEvents([]);
  };

  return (
    <div className="competition-selector d-flex align-items-center gap-3">
      <div className="selector-group">
        <label className="text-dark mb-1 small">Year</label>
        <select 
          className="form-select form-select-sm bg-light border-0" 
          value={year}
          onChange={handleYearChange}
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      <div className="selector-group">
        <label className="text-dark mb-1 small">Team</label>
        <input
          type="number"
          className="form-control form-control-sm bg-light border-0 text-center"
          value={teamNumber}
          onChange={handleTeamNumberChange}
          placeholder="Team #"
          min={1}
          max={9999}
          style={{
            width: '100px',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
        />
        <style jsx>{`
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}</style>
      </div>

      <div className="selector-group">
        <label className="text-dark mb-1 small">District</label>
        <select 
          className="form-select form-select-sm bg-light border-0" 
          value={selectedDistrict?.key || ''} 
          onChange={handleDistrictChange}
        >
          <option value="">Select District</option>
          {districts.map(district => (
            <option key={district.key} value={district.key}>
              {district.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label className="text-dark mb-1 small">Competition</label>
        <select 
          className="form-select form-select-sm bg-light border-0" 
          value={selectedEvent?.key || ''} 
          onChange={handleEventChange}
        >
          <option value="">Select Competition</option>
          {events.map(event => (
            <option key={event.key} value={event.key}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .competition-selector {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 15px;
          border-radius: 8px;
        }
        .selector-group {
          min-width: 120px;
        }
        .form-select, .form-control {
          box-shadow: none !important;
        }
        .form-select:focus, .form-control:focus {
          border-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

export default CompetitionSelector;

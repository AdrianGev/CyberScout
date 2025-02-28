import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  matches: [],
  teams: [],
  loading: false,
  error: null,
  selectedDistrict: null,
  selectedEvent: { key: 'default' },
  eventMatches: [],
};

const scoutingSlice = createSlice({
  name: 'scouting',
  initialState,
  reducers: {
    addMatch: (state, action) => {
      state.matches.push(action.payload);
    },
    setTeams: (state, action) => {
      state.teams = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setSelectedDistrict: (state, action) => {
      state.selectedDistrict = action.payload;
    },
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
    },
    setEventMatches: (state, action) => {
      state.eventMatches = action.payload;
    },
  },
});

export const { 
  addMatch, 
  setTeams, 
  setLoading, 
  setError, 
  setSelectedDistrict, 
  setSelectedEvent,
  setEventMatches 
} = scoutingSlice.actions;
export default scoutingSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  autoCollapseEnabled: false,  // Auto collapse after timer
  autoCollapseDelay: 20000,  // 20 seconds in milliseconds
  smartInfoCardEnabled: false,  // Smart info card that appears on scroll (not default)
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleAutoCollapse: (state) => {
      state.autoCollapseEnabled = !state.autoCollapseEnabled;
    },
    setAutoCollapseDelay: (state, action) => {
      // Store delay in milliseconds, no need to validate here since
      // validation is handled in the Settings component
      state.autoCollapseDelay = action.payload;
    },
    toggleSmartInfoCard: (state) => {
      state.smartInfoCardEnabled = !state.smartInfoCardEnabled;
    },
  },
});

export const { 
  toggleAutoCollapse, 
  setAutoCollapseDelay,
  toggleSmartInfoCard 
} = settingsSlice.actions;

export default settingsSlice.reducer;

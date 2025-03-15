import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  autoCollapseEnabled: false,  // Auto collapse after timer
  autoCollapseDelay: 20000,  // 20 seconds in milliseconds
  smartInfoCardEnabled: false,  // Smart info card that appears on scroll (not default)
  showInfoCard: true,  // Show info card (enabled by default)
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
    toggleInfoCard: (state) => {
      state.showInfoCard = !state.showInfoCard;
    },
  },
});

export const { 
  toggleAutoCollapse, 
  setAutoCollapseDelay,
  toggleSmartInfoCard,
  toggleInfoCard 
} = settingsSlice.actions;

export default settingsSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  autoCollapseEnabled: false,  // Auto collapse after timer
  normalAutoCollapseEnabled: true,  // Default collapse behavior
  autoCollapseDelay: 20000,  // 20 seconds in milliseconds
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleAutoCollapse: (state) => {
      state.autoCollapseEnabled = !state.autoCollapseEnabled;
      // Turn off normal auto collapse when timed auto collapse is enabled
      if (state.autoCollapseEnabled) {
        state.normalAutoCollapseEnabled = false;
      }
    },
    toggleNormalAutoCollapse: (state) => {
      state.normalAutoCollapseEnabled = !state.normalAutoCollapseEnabled;
      // Turn off timed auto collapse when normal auto collapse is enabled
      if (state.normalAutoCollapseEnabled) {
        state.autoCollapseEnabled = false;
      }
    },
    setAutoCollapseDelay: (state, action) => {
      // Store delay in milliseconds, no need to validate here since
      // validation is handled in the Settings component
      state.autoCollapseDelay = action.payload;
    },
  },
});

export const { toggleAutoCollapse, toggleNormalAutoCollapse, setAutoCollapseDelay } = settingsSlice.actions;

export default settingsSlice.reducer;

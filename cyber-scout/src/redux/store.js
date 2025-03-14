import { configureStore } from '@reduxjs/toolkit';
import scoutingReducer from '../store/scoutingSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    scouting: scoutingReducer,
    settings: settingsReducer,
  },
});

export default store;

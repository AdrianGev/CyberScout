import { configureStore } from '@reduxjs/toolkit';
import scoutingReducer from './scoutingSlice';

export const store = configureStore({
  reducer: {
    scouting: scoutingReducer,
  },
});

import { createSlice } from "@reduxjs/toolkit";
const pwaSlice = createSlice({
  name: "pwa",
  initialState: {
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    updateAvailable: false,
    installAvailable: false,
    installed: false,
  },
  reducers: {
    connectivityChanged: (state, { payload }) => {
      state.online = payload;
    },
    updateAvailable: (state, { payload }) => {
      state.updateAvailable = payload;
    },
    installAvailable: (state, { payload }) => {
      state.installAvailable = payload;
    },
    appInstalled: (state) => {
      state.installed = true;
      state.installAvailable = false;
    },
  },
});
export const {
  connectivityChanged,
  updateAvailable,
  installAvailable,
  appInstalled,
} = pwaSlice.actions;
export const selectPwa = (state) => state.pwa;
export default pwaSlice.reducer;

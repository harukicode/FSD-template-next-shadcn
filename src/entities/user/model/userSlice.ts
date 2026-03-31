import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./types";

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<User | null>) {
      state.currentUser = action.payload;
      state.error = null;
    },
    setUserLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setUserError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearUser(state) {
      state.currentUser = null;
      state.error = null;
    },
  },
});

export const { setCurrentUser, setUserLoading, setUserError, clearUser } = userSlice.actions;
export const userReducer = userSlice.reducer;

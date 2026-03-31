import { configureStore } from "@reduxjs/toolkit";
import { counterReducer } from "@/features/example-counter/model/counterSlice";
import { userReducer } from "@/entities/user/model/userSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

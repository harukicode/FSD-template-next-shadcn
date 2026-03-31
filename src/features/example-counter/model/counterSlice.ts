import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CounterState {
  value: number;
  step: number;
}

const initialState: CounterState = {
  value: 0,
  step: 1,
};

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment(state) {
      state.value += state.step;
    },
    decrement(state) {
      state.value -= state.step;
    },
    reset(state) {
      state.value = 0;
    },
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
    setValue(state, action: PayloadAction<number>) {
      state.value = action.payload;
    },
  },
});

export const { increment, decrement, reset, setStep, setValue } = counterSlice.actions;
export const counterReducer = counterSlice.reducer;

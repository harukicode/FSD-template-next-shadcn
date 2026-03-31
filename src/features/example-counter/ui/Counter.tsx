"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { Button } from "@/shared/ui";
import { increment, decrement, reset } from "../model/counterSlice";

export function Counter() {
  const dispatch = useAppDispatch();
  const { value, step } = useAppSelector((state) => state.counter);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-4xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">Step: {step}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => dispatch(decrement())} aria-label="Decrement">
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => dispatch(reset())} aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => dispatch(increment())} aria-label="Increment">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

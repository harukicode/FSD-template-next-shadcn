import { useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState } from "@/shared/store";

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

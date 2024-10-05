import { WepinContext } from "@/context";
import { useContext } from "react";

const useWepin = () => {
  return useContext(WepinContext);
};

export default useWepin;

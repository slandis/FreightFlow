import { SimulationProvider } from "./providers/SimulationProvider";
import { MainGameScreen } from "../ui/screens/MainGameScreen";

export default function App() {
  return (
    <SimulationProvider>
      <MainGameScreen />
    </SimulationProvider>
  );
}

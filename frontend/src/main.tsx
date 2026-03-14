import { createRoot } from "react-dom/client";
import { AppRouter } from "./app/AppRouter";
import "./styles/index.css";
import "./theme/tokens.css";

createRoot(document.getElementById("root")!).render(<AppRouter />);
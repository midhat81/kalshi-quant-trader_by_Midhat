import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Markets } from "./pages/Markets";
import { Positions } from "./pages/Positions";
import { Trades } from "./pages/Trades";
import { Signals } from "./pages/Signals";
import { Risk } from "./pages/Risk";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/risk" element={<Risk />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
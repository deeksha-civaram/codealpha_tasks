import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Women from "./pages/Women";
import Men from "./pages/Men";
import Kids from "./pages/Kids";
import Cart from "./pages/Cart"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cart" element={<Cart />} />
        <Route path="/" element={<Home />} />
        <Route path="/women" element={<Women />} />
        <Route path="/men" element={<Men />} />
        <Route path="/kids" element={<Kids />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
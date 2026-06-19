import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "20px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <h2>AURAÉ</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        <Link to="/">Home</Link>
        <Link to="/women">Women</Link>
        <Link to="/men">Men</Link>
        <Link to="/kids">Kids</Link>
        <Link to="/cart">Cart</Link>
      </div>
    </nav>
  );
}

export default Navbar;
import Navbar from "../components/Navbar";

function Cart() {
  return (
    <>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h1>Shopping Cart</h1>

        <p>Your selected products will appear here.</p>
      </div>
    </>
  );
}

export default Cart;
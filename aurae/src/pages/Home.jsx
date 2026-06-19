import Navbar from "../components/Navbar";
import { products } from "../data/products";

function Home() {
  return (
    <>
      <Navbar />

      <div
        style={{
          textAlign: "center",
          padding: "50px",
        }}
      >
        <h1>Welcome to AURAÉ</h1>

        <p>Fashion for Men, Women and Kids</p>

        <h2>Featured Products</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                border: "1px solid #ddd",
                padding: "20px",
                borderRadius: "10px",
              }}
            >
                <img
  src={product.image}
  alt={product.name}
  style={{
    width: "100%",
    height: "250px",
    objectFit: "cover",
    borderRadius: "10px"
  }}
/>
              <h3>{product.name}</h3>

              <p>₹{product.price}</p>

              <button>
                Add To Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
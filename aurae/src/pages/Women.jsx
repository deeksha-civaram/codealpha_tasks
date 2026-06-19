import Navbar from "../components/Navbar";
import { products } from "../data/products";

function Women() {
  const womenProducts = products.filter(
    (product) => product.category === "women"
  );

  return (
    <>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h1>Women's Collection</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
          }}
        >
          {womenProducts.map((product) => (
            <div key={product.id}>
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "250px",
                  objectFit: "cover",
                }}
              />
              <h3>{product.name}</h3>
              <p>₹{product.price}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Women;
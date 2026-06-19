import Navbar from "../components/Navbar";
import { products } from "../data/products";

function Kids() {
  const kidsProducts = products.filter(
    (product) => product.category === "kids"
  );

  return (
    <>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h1>Kids Collection</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
          }}
        >
          {kidsProducts.map((product) => (
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

export default Kids;
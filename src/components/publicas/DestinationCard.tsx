export default function DestinationCard({ name, price, verticalLabel, img, large, small }) {
  return (
    <div className={`lt-dest-card${large ? " large" : ""}${small ? " small" : ""}`}>
      <img src={img} alt={name} className="lt-dest-img" />
      <div className="lt-dest-overlay" />
      {verticalLabel && <div className="lt-dest-vertical">{verticalLabel}</div>}
      <div className="lt-dest-info">
        <h4 className="lt-dest-name">{name}</h4>
        <p className="lt-dest-price">{price}</p>
      </div>
    </div>
  );
}
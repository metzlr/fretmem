import "./PercentageBar.css";

const WIDTH = 7.5;

const PercentageBar = ({ value }) => {
  const roundedValue = Math.round(value * 100) / 100;
  const adjustedWidth = Math.max((roundedValue * WIDTH) / 100, 0.4);
  let color = "green";
  if (roundedValue < 80) {
    color = "gold";
  }
  if (roundedValue < 60) {
    color = "red";
  }

  return (
    <div className="PercentageBar">
      <div
        className="PercentageBar-bar"
        style={{ width: adjustedWidth + "em", backgroundColor: color }}
      />
      <div className="PercentageBar-text">{roundedValue}%</div>
    </div>
  );
};

export default PercentageBar;

import "./AlertBanner.css";
import { BsX } from "react-icons/bs";

const AlertBanner = ({ message, onClose }) => {
  if (message === null || message === undefined) return;
  return (
    <div className="AlertBanner">
      <button onClick={() => onClose()}>
        <BsX />
      </button>
      <p>{message}</p>
    </div>
  );
};

export default AlertBanner;

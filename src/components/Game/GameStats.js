import MandolinFretInfo from "../../static/MandolinFretInfo";
import PercentageBar from "../PercentageBar/PercentageBar";
import "./Game.css";

const DECIMAL_PLACES = 2;

const _round = (num, decimalPlaces = DECIMAL_PLACES) => {
  let shift = Math.pow(10, decimalPlaces);
  return Math.round(num * shift) / shift;
};

const _statLine = (name, value, subLine = false, percentage = false) => {
  if (value === null) value = "N/A";
  return (
    <div
      className={`Game-stats-line ${subLine ? "Game-stats-line-small" : ""}`}
    >
      <div className="Game-stats-line-name">{name}:</div>{" "}
      {percentage && value !== "N/A" ? (
        <PercentageBar value={value} />
      ) : (
        <div className="Game-number">{value}</div>
      )}
    </div>
  );
};

const _noteStats = (noteCount, noteCorrectCount, noteTime) => {
  let lines = [];
  for (let i = 0; i < MandolinFretInfo.NOTES.length; i++) {
    const name = MandolinFretInfo.NOTES[i].name;
    const accuracy =
      noteCount[i] <= 0
        ? null
        : _round((noteCorrectCount[i] * 100) / noteCount[i]);
    const avgSpeed =
      noteCount[i] <= 0
        ? null
        : `${_round(noteCount[i] / (noteTime[i] / 1000))} notes/sec`;
    lines.push(
      <div>
        <p className="Game-stats-note">{name}</p>
        {_statLine("Accuracy", accuracy, true, true)}
        {_statLine("Avg. speed", avgSpeed, true)}
      </div>
    );
  }
  return lines;
};

const GameStats = ({ stats }) => {
  const duration = (stats.lastTimestamp - stats.startTimestamp) / 1000.0;
  // const min = Math.floor(duration / 60.0);
  // const sec = _round(duration % 60.0);
  const accuracy =
    stats.fingeringCount === 0
      ? null
      : _round((stats.fingeringCorrectCount * 100) / stats.fingeringCount);
  const avgSpeed =
    stats.fingeringCount === 0
      ? null
      : `${_round(stats.fingeringCount / duration)} notes/sec`;

  return (
    <div className="Game-stats">
      <div>
        {/* {_statLine("Time", `${min > 0 ? min + "m " : ""}${sec}s`)} */}
        {_statLine("Overall Accuracy", accuracy, false, true)}
        {_statLine("Avg. speed", avgSpeed)}
      </div>
      <div className="Game-stats-notes">
        {_noteStats(stats.noteCount, stats.noteCorrectCount, stats.noteTime)}
      </div>
    </div>
  );
};

export default GameStats;

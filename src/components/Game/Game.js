import "./Game.css";
import { Fretboard, FRETBOARD_MODES } from "../Fretboard/Fretboard";
import { useReducer, useEffect } from "react";
import {
  gameReducer,
  GAME_STATES,
  GAME_ACTIONS,
  GAME_SETTINGS_KEY,
  initGameState,
} from "./gameReducer";
import { GiMusicalNotes } from "react-icons/gi";
import { BsHourglassSplit } from "react-icons/bs";
import { RiArrowGoBackLine } from "react-icons/ri";
import GameStats from "./GameStats";
import AlertBanner from "../AlertBanner/AlertBanner";
import MandolinFretInfo from "../../static/MandolinFretInfo";
import { useTimer, TIMER_STATES } from "../../hooks/useTimer";

const renderButtonText = (gameState) => {
  switch (gameState) {
    case GAME_STATES.setup:
      return <>Start</>;
    case GAME_STATES.running:
      return (
        <>
          Stop <BsHourglassSplit />
        </>
      );
    case GAME_STATES.ended:
      return (
        <>
          Reset <RiArrowGoBackLine />
        </>
      );
    default:
      return null;
  }
};

const getTimerState = (gameState) => {
  switch (gameState) {
    case GAME_STATES.setup:
      return TIMER_STATES.Stopped;
    case GAME_STATES.running:
      return TIMER_STATES.Running;
    case GAME_STATES.ended:
      return TIMER_STATES.Paused;
    default:
      return TIMER_STATES.Stopped;
  }
};

const getSettingsFromState = (gameState) => {
  return {
    frets: gameState.boardState.frets,
  };
};

const Game = () => {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    undefined,
    initGameState
  );

  const time = useTimer(getTimerState(gameState.state));

  useEffect(() => {
    if (gameState.state === GAME_STATES.setup) {
      localStorage.setItem(
        GAME_SETTINGS_KEY,
        JSON.stringify(getSettingsFromState(gameState))
      );
    }
  }, [gameState]);

  const onFretboardItemClicked = (item, _) => {
    switch (gameState.state) {
      case GAME_STATES.setup: {
        dispatch({ type: GAME_ACTIONS.fretSelected, payload: item });
        break;
      }
      case GAME_STATES.running: {
        dispatch({ type: GAME_ACTIONS.fingeringSelected, payload: item });
        break;
      }
      default:
        return;
    }
  };

  const onClickButton = () => {
    switch (gameState.state) {
      case GAME_STATES.setup:
        dispatch({ type: GAME_ACTIONS.startGame, payload: null });
        break;
      case GAME_STATES.running:
        dispatch({ type: GAME_ACTIONS.endGame, payload: null });
        break;
      case GAME_STATES.ended:
        dispatch({ type: GAME_ACTIONS.resetGame, payload: null });
        break;
      default:
        break;
    }
  };

  return (
    <div className="Game">
      <AlertBanner
        message={gameState.alertMessage}
        onClose={() =>
          dispatch({ type: GAME_ACTIONS.clearAlertMessage, payload: null })
        }
      />
      <h1 className="Game-title">
        Fretmem <GiMusicalNotes />
      </h1>
      <p className="Game-instructions">
        A memory game to help mandolin players learn the fretboard. When you hit
        start, a random prompt will show up. Find and click the corresponding
        note on the fretboard!
      </p>
      <div className="Game-status">
        <div className="Game-status-left">
          {gameState.state !== GAME_STATES.setup ? (
            <>
              <p>Time: </p>
              <span className="Game-number">
                {time.min < 10 ? "0" + time.min : time.min}:
                {time.sec < 10 ? "0" + time.sec : time.sec}
              </span>
            </>
          ) : (
            <p>
              Frets Included:
              <span className="Game-number">{`${gameState.activeFretCount}/${MandolinFretInfo.FRET_COUNT}`}</span>
            </p>
          )}
        </div>
        <div className="Game-status-middle">
          <button
            className={`btn ${
              gameState.state === GAME_STATES.setup
                ? "btn-secondary"
                : gameState.state === GAME_STATES.running
                ? "btn-primary"
                : "btn-secondary"
            }`}
            onClick={onClickButton}
          >
            {renderButtonText(gameState.state)}
          </button>
        </div>
        <div className="Game-status-right">
          {gameState.state !== GAME_STATES.setup ? (
            <p>
              Score:
              <span className="Game-number">
                {gameState.stats.fingeringCorrectCount}/
                {gameState.stats.fingeringCount}
              </span>
            </p>
          ) : null}
        </div>
      </div>
      <div className="Game-fretboard">
        <Fretboard
          boardState={gameState.boardState}
          mode={
            gameState.state === GAME_STATES.setup
              ? FRETBOARD_MODES.frets
              : FRETBOARD_MODES.fingerings
          }
          onItemClicked={onFretboardItemClicked}
        />
      </div>
      {gameState.notePrompt === null ||
      gameState.state !== GAME_STATES.running ? null : (
        <>
          <p className="Game-prompt-text">Find this note above:</p>
          <p className="Game-prompt-note">{gameState.notePrompt}</p>
          <p>
            <span className="Game-number">
              <strong>
                {gameState.fingerPool.length - gameState.stats.fingeringCount}
              </strong>
            </span>{" "}
            notes remaining
          </p>
        </>
      )}
      {gameState.state !== GAME_STATES.setup ? null : (
        <p>
          Click on a fret to add or remove it from the game. Grayed-out frets
          will not be included.
        </p>
      )}
      {gameState.state !== GAME_STATES.ended ? null : (
        <GameStats stats={gameState.stats} />
      )}
    </div>
  );
};

export default Game;

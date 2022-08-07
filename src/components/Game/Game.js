import "./Game.css";
import Fretboard from "../Fretboard/Fretboard";
import { useReducer } from "react";
import {
  gameReducer,
  GAME_STATES,
  GAME_ACTIONS,
  initGameState,
} from "./gameReducer";
import { Timer, TIMER_STATES } from "../Timer/Timer";
import { GiMusicalNotes } from "react-icons/gi";
import { BsHourglassSplit } from "react-icons/bs";
import { RiArrowGoBackLine } from "react-icons/ri";
import { IoMdMusicalNote } from "react-icons/io";

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

const Game = () => {
  const [gameState, dispatch] = useReducer(
    gameReducer,
    undefined,
    initGameState
  );

  const onFingeringClicked = (fingering, _) => {
    dispatch({ type: GAME_ACTIONS.fingeringSelected, payload: fingering });
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
      <h1 className="Game-title">
        Fret Master <GiMusicalNotes />
      </h1>
      <p className="Game-instructions">
        A memory game to help mandolin players learn the fretboard. When you hit
        start, a random prompt will show up. Find and click the corresponding
        note on the fretboard!
      </p>
      <div className="Game-status">
        <div className="Game-status-left">
          <p>Time: </p>
          <Timer
            state={getTimerState(gameState.state)}
            className={`Game-number`}
          />
        </div>
        <div className="Game-status-middle">
          <button
            className={`btn ${
              gameState.state === GAME_STATES.setup
                ? "btn-green"
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
          <p>
            Score:
            <span className="Game-number">
              {gameState.numCorrect}/{gameState.fingerPool.counter}
            </span>
          </p>
        </div>
      </div>
      <p className="Game-prompt"></p>
      <div className="Game-fretboard">
        <Fretboard
          boardState={gameState.boardState}
          onFingeringClicked={onFingeringClicked}
        />
      </div>
      {gameState.notePrompt === null ||
      gameState.state !== GAME_STATES.running ? null : (
        <>
          <p className="Game-prompt-text">Find this note above:</p>
          <p className="Game-prompt-note">{gameState.notePrompt}</p>
        </>
      )}
      {gameState.state !== GAME_STATES.setup ? null : (
        <div className="Game-settings">
          <p>Settings</p>
          <div className="Game-settings-prompts">
            <p>
              <IoMdMusicalNote />
              Prompt Categories
            </p>
            <div>
              <p>A</p>
              <p>B</p>
              <p>C</p>
            </div>
          </div>
          <button className="btn btn-secondary">Edit Frets</button>
        </div>
      )}
    </div>
  );
};

export default Game;

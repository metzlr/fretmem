import "./Game.css";
import Fretboard from "../Fretboard/Fretboard";
import { useEffect, useState, useRef } from "react";
import { Timer, TIMER_STATES } from "../Timer/Timer";
import { GiMusicalNotes } from "react-icons/gi";
import { BsHourglassSplit } from "react-icons/bs";
import { RiArrowGoBackLine } from "react-icons/ri";
import { IoMdMusicalNote } from "react-icons/io";
import MandolinFretInfo from "../../static/MandolinFretInfo";

const GAME_STATES = {
  Setup: "SETUP",
  Running: "RUNNING",
  Ended: "ENDED",
  EditingFrets: "EDITING_FRETS",
};

// TODO: Add more categories
const getRandomNotePrompt = (noteIndex, includeNames) => {
  if (!includeNames) {
    // No possible categories
    return null;
  }
  let categoryChoices = [];
  if (includeNames) categoryChoices.push("names");
  // Pick a random prompt category out of all included categories
  const category =
    categoryChoices[Math.floor(Math.random() * categoryChoices.length)];
  // Pick a random prompt from selected category
  const promptChoices = MandolinFretInfo.NOTES[noteIndex].prompts[category];

  return promptChoices[Math.floor(Math.random() * promptChoices.length)];
};

/** Returns ordered array of n frets i.e. [0,1,2...n-1] */
const generateFingeringPool = () => {
  const arr = new Array(MandolinFretInfo.FINGERING_COUNT);
  for (let i = 0; i < arr.length; i++) arr[i] = i;
  return arr;
};
const renderButtonText = (gameState) => {
  switch (gameState) {
    case GAME_STATES.Setup:
      return <>Start</>;
    case GAME_STATES.Running:
      return (
        <>
          Stop <BsHourglassSplit />
        </>
      );
    case GAME_STATES.Ended:
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
    case GAME_STATES.Setup:
      return TIMER_STATES.Stopped;
    case GAME_STATES.Running:
      return TIMER_STATES.Running;
    case GAME_STATES.Ended:
      return TIMER_STATES.Paused;
    default:
      return TIMER_STATES.Stopped;
  }
};

const Game = () => {
  const [gameState, setGameState] = useState(GAME_STATES.Setup);
  // Tracks state of fretboard. Variable that Fretboard component uses to determine visual state
  //'fingerings' contains an int array tracking state of each fingering on board. -1 = disabled, -2 = correct, -3 = incorrect, >=0 = empty and value is index in fingering pool.
  // 'frets' contains an int array tracking state of each fret. 0 = disabled (not included in game), 1 = enabled
  const [boardState, setBoardState] = useState({
    fingerings: new Array(MandolinFretInfo.FINGERING_COUNT).fill(-1),
    frets: new Array(MandolinFretInfo.FRET_COUNT).fill(1),
  });
  const [currFret, setCurrFret] = useState(null);
  const [numCorrect, setNumCorrect] = useState(0);
  const [notePrompt, setNotePrompt] = useState(null);
  const fingeringCounterRef = useRef(0);
  const fingeringPoolRef = useRef([]);

  useEffect(() => {
    // TODO: When adding other modes/settings, I need to add whatever state variable stores that info to this function so game is properly re-setup each time someone switches modes/settings. These settings shouldn't be triggerable in Running or Ended states so that shouldn't cause problems

    switch (gameState) {
      case GAME_STATES.Setup:
        console.log("Setting up Game");
        const fretPool = generateFingeringPool();
        const newFingeringState = new Array(
          MandolinFretInfo.FINGERING_COUNT
        ).fill(-1);
        for (let i = 0; i < fretPool.length; i++) {
          // Update state of frets that will be used in the game. Value stored in state is the fret's index in the pool
          newFingeringState[fretPool[i]] = i;
        }
        fingeringPoolRef.current = fretPool;
        setBoardState((s) => ({
          fingerings: newFingeringState,
          frets: s.frets,
        }));
        setNumCorrect(0);
        fingeringCounterRef.current = 0;
        pickNextFret();
        break;
      case GAME_STATES.Running:
        break;
      case GAME_STATES.Ended:
        break;
      case GAME_STATES.EditingFrets:
        break;
      default:
        throw new Error("Unhandled game state");
    }
  }, [gameState]);

  const pickNextFret = () => {
    const fingeringCounter = fingeringCounterRef.current;
    // Randomly pick next fret for prompt from the pool
    if (fingeringPoolRef.current.length === 0) return;
    if (fingeringCounter === fingeringPoolRef.current.length) {
      console.log("Finished Game");
      // Reached end of fret pool
      setGameState(GAME_STATES.Ended);
    }
    // Randomly pick next fret, ignoring frets outside of valid pool range (i.e. frets with an index < fingeringCounter)
    const index = Math.floor(
      Math.random() * (fingeringPoolRef.current.length - fingeringCounter) +
        fingeringCounter
    );
    // Swap randomly chosen fret to front of pool
    [
      fingeringPoolRef.current[fingeringCounter],
      fingeringPoolRef.current[index],
    ] = [
      fingeringPoolRef.current[index],
      fingeringPoolRef.current[fingeringCounter],
    ];
    const newCurrFret = fingeringPoolRef.current[fingeringCounter];
    setCurrFret(newCurrFret);
    setNotePrompt(
      getRandomNotePrompt(
        MandolinFretInfo.FINGERING_NOTE_INDEX[newCurrFret],
        true
      )
    );
  };

  const onFingeringClicked = (fingering, _) => {
    if (gameState !== GAME_STATES.Running) return;
    // If clicked fret is not empty, ignore
    if (boardState.fingerings[fingering] < 0) return;
    const fingeringCounter = fingeringCounterRef.current;
    const poolIndex = boardState.fingerings[fingering];
    if (currFret !== fingering) {
      // User selected another fingering than the one we are currently prompting. Their selection could still be valid. Either way we must swap the fingering they selected with our current fingering so the selected fingering is properly removed from consideration after this function finishes.
      [
        fingeringPoolRef.current[fingeringCounter],
        fingeringPoolRef.current[poolIndex],
      ] = [
        fingeringPoolRef.current[poolIndex],
        fingeringPoolRef.current[fingeringCounter],
      ];
      // Update old currFret's state
      boardState.fingerings[fingeringPoolRef.current] = poolIndex;
    }
    if (
      MandolinFretInfo.FINGERING_NOTE_INDEX[fingering] ===
      MandolinFretInfo.FINGERING_NOTE_INDEX[currFret]
    ) {
      // Selected valid fingering matching note prompt
      boardState.fingerings[fingering] = -2;
      setNumCorrect(numCorrect + 1);
    } else {
      // Selected invalid fingering
      boardState.fingerings[fingering] = -3;
    }
    // Update state
    fingeringCounterRef.current += 1;
    setBoardState((s) => ({
      fingerings: [...boardState.fingerings],
      frets: s.frets,
    }));
    pickNextFret();
  };

  const onClickButton = () => {
    switch (gameState) {
      case GAME_STATES.Setup:
        setGameState(GAME_STATES.Running);
        break;
      case GAME_STATES.Running:
        setGameState(GAME_STATES.Ended);
        break;
      case GAME_STATES.Ended:
        setGameState(GAME_STATES.Setup);
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
          <Timer state={getTimerState(gameState)} className={`Game-number`} />
        </div>
        <div className="Game-status-middle">
          <button
            className={`btn ${
              gameState === GAME_STATES.Setup
                ? "btn-green"
                : gameState === GAME_STATES.Running
                ? "btn-primary"
                : "btn-secondary"
            }`}
            onClick={onClickButton}
          >
            {renderButtonText(gameState)}
          </button>
        </div>
        <div className="Game-status-right">
          <p>
            Score:
            <span className="Game-number">
              {numCorrect}/{fingeringCounterRef.current}
            </span>
          </p>
        </div>
      </div>
      <p className="Game-prompt"></p>
      <div className="Game-fretboard">
        <Fretboard
          boardState={boardState}
          onFingeringClicked={onFingeringClicked}
        />
      </div>
      {notePrompt === null || gameState !== GAME_STATES.Running ? null : (
        <>
          <p className="Game-prompt-text">Find this note above:</p>
          <p className="Game-prompt-note">{notePrompt}</p>
        </>
      )}
      {gameState !== GAME_STATES.Setup ? null : (
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

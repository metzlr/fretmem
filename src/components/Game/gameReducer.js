import MandolinFretInfo from "../../static/MandolinFretInfo";

const _countActiveFrets = (fretStates) =>
  fretStates.reduce((count, val) => {
    if (val === 1) return count + 1;
    return count;
  });

const _getRandomNotePrompt = (noteIndex, includeNames) => {
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

/** Returns ordered array of n fingerings i.e. [0,1,2...n-1]
 * @param {Array<number>} fretStates Array of fret states. A fingering will only be included if the fret it is on is enabled.
 */
const _generateFingeringPool = (fretStates) => {
  if (fretStates.length > MandolinFretInfo.FRET_COUNT) {
    throw new Error("Unable to generate fingerings. Invalid number of frets.");
  }
  const arr = new Array(_countActiveFrets(fretStates) * 4);
  let i, j; // i is fingering number, j is index in arr
  for (i = 0, j = 0; j < arr.length; i++) {
    const fret = i % MandolinFretInfo.FRET_COUNT;
    if (fretStates[fret] === 1) {
      arr[j] = i;
      j += 1;
    }
    if (i >= MandolinFretInfo.FINGERING_COUNT) {
      console.log(arr, i, j, fretStates);
      throw new Error("This shouldn't be possible. Something's wrong.");
    }
  }
  return arr;
};

const _pickNextFingering = (pool, counter) => {
  // Randomly pick next fingering, ignoring fingerings outside of valid pool range (i.e. fingerings with an index < fingeringCounter)
  const index = Math.floor(Math.random() * (pool.length - counter) + counter);
  // Swap randomly chosen fingering to front of pool
  [pool[counter], pool[index]] = [pool[index], pool[counter]];
  return pool[counter];
};

const GAME_ACTIONS = {
  resetGame: "RESET_GAME",
  startGame: "START_GAME",
  endGame: "END_GAME",
  fingeringSelected: "FINGERING_SELECTED",
  fretSelected: "FRET_SELECTED",
  clearAlertMessage: "CLEAR_ALERT_MESSAGE",
};
const GAME_STATES = {
  setup: "SETUP",
  running: "RUNNING",
  ended: "ENDED",
  editingFrets: "EDITING_FRETS",
};

const initGameState = () => {
  return {
    state: GAME_STATES.setup,
    numCorrect: 0,
    notePrompt: null,
    // Tracks state of fretboard. Variable that Fretboard component uses to determine visual state
    //'fingerings' contains an int array tracking state of each fingering on board. -1 = disabled, -2 = correct, -3 = incorrect, >=0 = empty and value is index in fingering pool.
    // 'frets' contains an int array tracking state of each fret. 0 = disabled (not included in game), 1 = enabled
    boardState: {
      fingerings: new Array(MandolinFretInfo.FINGERING_COUNT).fill(0),
      frets: new Array(MandolinFretInfo.FRET_COUNT).fill(1),
    },
    fingerPool: {
      arr: null,
      counter: null,
    },
    activeFretCount: MandolinFretInfo.FRET_COUNT,
    alertMessage: null,
  };
};

const gameReducer = (gameState, action) => {
  switch (action.type) {
    case GAME_ACTIONS.startGame: {
      if (gameState.state !== GAME_STATES.setup) {
        throw new Error("Failed to start game. Game is not in setup state.");
      }
      if (gameState.activeFretCount === 0) {
        return {
          ...gameState,
          alertMessage: "You can't start the game without any frets selected",
        };
      }
      console.log("Starting game...");
      const poolArray = _generateFingeringPool(gameState.boardState.frets);
      const newFingeringState = new Array(
        MandolinFretInfo.FINGERING_COUNT
      ).fill(-1);
      for (let i = 0; i < poolArray.length; i++) {
        // Update state of frets that will be used in the game. Value stored in state is the fret's index in the pool
        newFingeringState[poolArray[i]] = i;
      }

      return {
        ...gameState,
        alertMessage: null,
        state: GAME_STATES.running,
        fingerPool: { arr: poolArray, counter: 0 },
        boardState: {
          fingerings: newFingeringState,
          frets: gameState.boardState.frets,
        },
        notePrompt: _getRandomNotePrompt(
          MandolinFretInfo.FINGERING_NOTE_INDEX[
            _pickNextFingering(poolArray, 0)
          ],
          true
        ),
      };
    }
    case GAME_ACTIONS.fretSelected: {
      if (gameState.state !== GAME_STATES.setup) {
        return gameState;
      }

      const fret = action.payload;
      let newActiveCount = gameState.activeFretCount;
      const newFretStates = [...gameState.boardState.frets];
      if (newFretStates[fret] === 1) {
        newFretStates[fret] = 0;
        newActiveCount -= 1;
      } else {
        newFretStates[fret] = 1;
        newActiveCount += 1;
      }

      return {
        ...gameState,
        boardState: {
          ...gameState.boardState,
          frets: newFretStates,
        },
        activeFretCount: newActiveCount,
      };
    }
    case GAME_ACTIONS.fingeringSelected: {
      if (gameState.state !== GAME_STATES.running) {
        return gameState;
      }
      const fingering = action.payload;
      // Index of selected fingering in pool
      const poolIndex = gameState.boardState.fingerings[fingering];
      // If clicked fingering isn't empty (e.g. it's disabled or already selected), ignore
      if (poolIndex < 0) return;

      let counter = gameState.fingerPool.counter;
      // Edit a copy of arrays (so we keep reducer pure by not editing previous gameState object)
      const poolArray = [...gameState.fingerPool.arr];
      const fingerings = [...gameState.boardState.fingerings];
      // Current "correct" note at the front of pool being prompted
      const currFingering = poolArray[counter];

      if (currFingering !== fingering) {
        // User selected another fingering than the one we are currently prompting. Their selection could still be valid. Either way we must swap the fingering they selected with our current fingering so the selected fingering is properly removed from consideration after this function finishes.
        [poolArray[counter], poolArray[poolIndex]] = [
          poolArray[poolIndex],
          poolArray[counter],
        ];
        // Update old currFingering's state
        fingerings[currFingering] = poolIndex;
      }
      let numCorrect = gameState.numCorrect;
      if (
        MandolinFretInfo.FINGERING_NOTE_INDEX[fingering] ===
        MandolinFretInfo.FINGERING_NOTE_INDEX[currFingering]
      ) {
        // Selected valid fingering matching note prompt
        fingerings[fingering] = -2;
        numCorrect += 1;
      } else {
        // Selected invalid fingering
        fingerings[fingering] = -3;
      }
      counter += 1;

      let newState = {
        ...gameState,
        fingerPool: {
          arr: poolArray,
          counter: counter,
        },
        boardState: {
          fingerings: fingerings,
          frets: gameState.boardState.frets,
        },
        numCorrect: numCorrect,
      };
      if (poolArray.length === counter) {
        newState.state = GAME_STATES.ended;
      } else {
        newState.notePrompt = _getRandomNotePrompt(
          MandolinFretInfo.FINGERING_NOTE_INDEX[
            _pickNextFingering(poolArray, counter)
          ],
          true
        );
      }
      return newState;
    }
    case GAME_ACTIONS.endGame: {
      if (gameState.state !== GAME_STATES.running) {
        throw new Error("Failed to stop game. Game isn't currently running.");
      }
      return { ...gameState, state: GAME_STATES.ended };
    }
    case GAME_ACTIONS.resetGame: {
      // TODO: Settings (once there are some) shouldn't be reset
      return initGameState();
    }
    case GAME_ACTIONS.clearAlertMessage: {
      return { ...gameState, alertMessage: null };
    }
    default:
      throw new Error("Unhandled game action: " + action);
  }
};

export { initGameState, gameReducer, GAME_ACTIONS, GAME_STATES };

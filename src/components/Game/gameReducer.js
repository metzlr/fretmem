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

const _pickNextFingering = (fingeringStates, pool, counter) => {
  // Randomly pick next fingering, ignoring fingerings outside of valid pool range (i.e. fingerings with an index < fingeringCounter)
  const index = Math.floor(Math.random() * (pool.length - counter) + counter);
  // Swap randomly chosen fingering to front of pool
  [pool[counter], pool[index]] = [pool[index], pool[counter]];
  // Update indices of effected fingerings
  fingeringStates[pool[counter]] = counter;
  fingeringStates[pool[index]] = index;
  return pool[counter];
};

const GAME_SETTINGS_KEY = "GAME_SETTINGS";

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
};

const initGameState = () => {
  const settings = JSON.parse(localStorage.getItem(GAME_SETTINGS_KEY)) ?? {
    frets: new Array(MandolinFretInfo.FRET_COUNT).fill(1),
  };

  return {
    state: GAME_STATES.setup,
    notePrompt: null,
    // Tracks state of fretboard. Variable that Fretboard component uses to determine visual state
    //'fingerings' contains an int array tracking state of each fingering on board. -1 = disabled, -2 = correct, -3 = incorrect, >=0 = empty and value is index in fingering pool.
    // 'frets' contains an int array tracking state of each fret. 0 = disabled (not included in game), 1 = enabled
    boardState: {
      fingerings: new Array(MandolinFretInfo.FINGERING_COUNT).fill(0),
      frets: settings.frets,
    },
    fingerPool: null,
    stats: {
      startTimestamp: null,
      lastTimestamp: null,
      noteTime: null,
      noteCorrectCount: null,
      noteCount: null,
      fingeringCorrectCount: null,
      fingeringCount: null,
    },
    activeFretCount: _countActiveFrets(settings.frets),
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
      const newFingeringStates = new Array(
        MandolinFretInfo.FINGERING_COUNT
      ).fill(-1);
      for (let i = 0; i < poolArray.length; i++) {
        // Update state of frets that will be used in the game. Value stored in state is the fret's index in the pool
        newFingeringStates[poolArray[i]] = i;
      }

      // Setup stat objects
      const noteTime = new Array(MandolinFretInfo.NOTES.length);
      for (let i = 0; i < noteTime.length; i++) {
        noteTime[i] = -1;
      }
      const noteCorrectCount = Array.from(noteTime);
      const noteCount = Array.from(noteTime);
      for (let fingering in poolArray) {
        const noteIndex = MandolinFretInfo.FINGERING_NOTE_INDEX[fingering];
        noteTime[noteIndex] = 0;
        noteCorrectCount[noteIndex] = 0;
        noteCount[noteIndex] = 0;
      }

      const timestamp = Date.now();

      return {
        ...gameState,
        alertMessage: null,
        state: GAME_STATES.running,
        fingerPool: poolArray,
        boardState: {
          fingerings: newFingeringStates,
          frets: gameState.boardState.frets,
        },
        notePrompt: _getRandomNotePrompt(
          MandolinFretInfo.FINGERING_NOTE_INDEX[
            _pickNextFingering(newFingeringStates, poolArray, 0)
          ],
          true
        ),
        stats: {
          startTimestamp: timestamp,
          lastTimestamp: timestamp,
          noteTime: noteTime,
          noteCorrectCount: noteCorrectCount,
          noteCount: noteCount,
          fingeringCorrectCount: 0,
          fingeringCount: 0,
        },
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

      let counter = gameState.stats.fingeringCount;
      // Edit a copy of necessary objects (so we keep reducer pure by not editing previous gameState object)
      const poolArray = [...gameState.fingerPool];
      const fingeringStates = [...gameState.boardState.fingerings];
      const noteTime = [...gameState.stats.noteTime];
      const noteCount = [...gameState.stats.noteCount];
      const noteCorrectCount = [...gameState.stats.noteCorrectCount];
      // Current "correct" note at the front of pool being prompted
      const currFingering = poolArray[counter];
      const timestamp = Date.now();

      if (currFingering !== fingering) {
        // User selected another fingering than the one we are currently prompting. Their selection could still be valid. Either way we must swap the fingering they selected with our current fingering so the selected fingering is properly removed from consideration after this function finishes.
        [poolArray[counter], poolArray[poolIndex]] = [
          poolArray[poolIndex],
          poolArray[counter],
        ];
        // Update old currFingering's state
        fingeringStates[currFingering] = poolIndex;
      }
      let fingeringCorrectCount = gameState.stats.fingeringCorrectCount;
      let correctNoteIndex =
        MandolinFretInfo.FINGERING_NOTE_INDEX[currFingering];
      if (
        MandolinFretInfo.FINGERING_NOTE_INDEX[fingering] === correctNoteIndex
      ) {
        // Selected valid fingering matching note prompt
        fingeringStates[fingering] = -2;
        fingeringCorrectCount += 1;
        noteCorrectCount[correctNoteIndex] += 1;
      } else {
        // Selected invalid fingering
        fingeringStates[fingering] = -3;
      }
      noteCount[correctNoteIndex] += 1;
      noteTime[correctNoteIndex] += timestamp - gameState.stats.lastTimestamp;
      counter += 1;

      let newState = {
        ...gameState,
        fingerPool: poolArray,
        boardState: {
          fingerings: fingeringStates,
          frets: gameState.boardState.frets,
        },
        stats: {
          ...gameState.stats,
          lastTimestamp: timestamp,
          noteTime: noteTime,
          noteCorrectCount: noteCorrectCount,
          noteCount: noteCount,
          fingeringCorrectCount: fingeringCorrectCount,
          fingeringCount: counter,
        },
      };
      if (poolArray.length === counter) {
        newState.state = GAME_STATES.ended;
      } else {
        newState.notePrompt = _getRandomNotePrompt(
          MandolinFretInfo.FINGERING_NOTE_INDEX[
            _pickNextFingering(fingeringStates, poolArray, counter)
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

export {
  initGameState,
  gameReducer,
  GAME_ACTIONS,
  GAME_STATES,
  GAME_SETTINGS_KEY,
};

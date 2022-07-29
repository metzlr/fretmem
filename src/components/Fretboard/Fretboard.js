import "./Fretboard.css";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import MandolinFretInfo from "../../static/MandolinFretInfo";

// When screen width is less than this value, display the fretboard vertically so it fits on small (mobile) screens better
const MIN_HORIZONTAL_WIDTH = 600;

const Fretboard = ({ boardState, onFingeringClicked }) => {
  const { width } = useWindowDimensions();

  // Make sure number of frets is consistent
  if (
    boardState.fingerings.length !== MandolinFretInfo.FINGERING_PATHS.length
  ) {
    throw new Error(
      "Conflicting fret count between game state and fretboard SVG"
    );
  }

  return (
    <svg
      id="fretboard"
      viewBox={
        width < MIN_HORIZONTAL_WIDTH
          ? "0 0 161.056 913.761"
          : "0 0 913.761 161.056"
      }
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        id="fretboard-group"
        transform={
          width < MIN_HORIZONTAL_WIDTH ? "rotate(90 80.528 80.528)" : ""
        }
      >
        <path
          d="M913.033.728v159.6L.91 129.945V31.11z"
          fill="none"
          stroke="#5a5a5a"
          strokeWidth="1.455"
          strokeLinejoin="round"
        />
        <g
          id="fret-dots"
          fill="#d9d9d9"
          stroke="#8e8e8e"
          strokeWidth="1.032"
          strokeLinejoin="round"
          transform="translate(-33.437 -230.018)"
        >
          <circle cx="326.126" cy="310.546" r="9.26" />
          <circle cx="435.161" cy="310.546" r="9.26" />
          <circle cx="576.597" cy="310.546" r="9.26" />
          <circle cx="659.289" cy="276.721" r="9.26" />
          <circle cx="659.289" cy="345.239" r="9.26" />
          <circle cx="767.867" cy="310.546" r="9.26" />
        </g>
        <g
          id="frets"
          fill="none"
          stroke="#757575"
          strokeWidth="1.455"
          strokeLinejoin="round"
        >
          <path d="M71.33 28.998v103.293" />
          <path d="M137.184 26.572v107.912" />
          <path d="M203.787 24.353v112.35" />
          <path d="M263.654 22.359v116.338" />
          <path d="M321.276 20.44v120.177" />
          <path d="M375.905 18.62v123.816" />
          <path d="M427.541 16.9v127.256" />
          <path d="M473.938 15.354v130.348" />
          <path d="M521.084 13.784v133.488" />
          <path d="M565.236 12.313v136.43" />
          <path d="M606.395 10.942v139.172" />
          <path d="M645.308 9.646V151.41" />
          <path d="M683.474 8.374v144.308" />
          <path d="M717.897 7.228v146.6" />
          <path d="M750.824 6.13v148.795" />
          <path d="M781.506 5.109v150.838" />
          <path d="M812.188 4.087v152.882" />
          <path d="M839.129 3.19v154.677" />
          <path d="M864.572 2.342v156.372" />
          <path d="M889.96 1.496c-.178-.71 0 158.064 0 158.064" />
        </g>
        <g
          id="strings"
          fill="none"
          stroke="#cecece"
          strokeLinejoin="round"
          strokeWidth="1.032"
        >
          <g>
            <path d="m.19 111.546 912.843 21.23" />
            <path d="m.19 120.542 912.843 23.24" />
          </g>
          <g>
            <path d="m.19 96.994 912.843 9.875" />
            <path d="m.19 87.998 912.843 6.77" />
          </g>
          <g>
            <path d="m.19 63.392 912.843 -8.342" />
            <path d="m.19 72.388 912.843 -6.467" />
          </g>
          <g>
            <path d="m.19 40.505 912.843 -22.006" />
            <path d="m.19 49.496 912.843 -19.7" />
          </g>
        </g>
        <g id="fingerings" fill="#fff" fillOpacity="0">
          {MandolinFretInfo.FINGERING_PATHS.map((p, i) => {
            // Determine fingering color from provided fretState
            let colorClass;
            switch (boardState.fingerings[i]) {
              case -1:
                colorClass = "disabled";
                break;
              case -2:
                colorClass = "green";
                break;
              case -3:
                colorClass = "red";
                break;
              default:
                colorClass = "empty";
            }
            return (
              <path
                key={i}
                d={p}
                className={colorClass}
                onClick={(evt) => onFingeringClicked(i, evt)}
              />
            );
          })}
        </g>
        {/* <g id="fret-areas" fill="#fff" fillOpacity="0">
          <path d="m.91 31.11 70.42-2.346v103.527L.91 129.945V31.11" />
          <path d="m71.33 28.764 65.854-2.192v107.912l-65.854-2.193Z" />
          <path d="m137.184 26.572 66.603-2.219v112.35l-66.603-2.219V26.572" />
          <path d="m203.787 24.353 59.867-1.994v116.338l-59.867-1.994V24.353" />
          <path d="m263.654 22.359 57.622-1.919v120.176l-57.622-1.919Z" />
          <path d="m321.276 20.44 54.629-1.82v123.816l-54.629-1.82z" />
          <path d="m375.905 18.62 51.636-1.72v127.256l-51.636-1.72V18.62" />
          <path d="m427.541 16.9 46.397-1.546v130.348l-46.397-1.546Z" />
          <path d="m473.938 15.354 47.146-1.57v133.488l-47.837-1.593z" />
          <path d="m521.084 13.784 44.152-1.471v136.43l-44.152-1.471V13.784" />
          <path d="m565.236 12.313 41.159-1.371v139.172l-41.159-1.371z" />
          <path d="m606.395 10.942 38.913-1.296V151.41l-38.913-1.296z" />
          <path d="m645.308 9.646 38.166-1.272v144.307l-38.166-1.271Z" />
          <path d="m683.47 8.375 34.427-1.147v146.6l-34.423-1.147z" />
          <path d="m717.897 7.228 32.927-1.097v148.794l-32.927-1.097z" />
          <path d="m750.824 6.131 30.682-1.022v150.838l-30.682-1.022z" />
          <path d="m781.506 5.109 30.682-1.022V156.97l-30.682-1.022z" />
          <path d="m812.188 4.087 26.941-.897v154.676l-26.941-.897z" />
          <path d="m839.129 3.19 25.443-.848v156.372l-25.443-.848z" />
          <path d="m864.572 2.342 25.388-.845v158.062l-25.388-.845z" />
          <path d="m889.96 1.497 23.073-.769v159.6l-23.073-.769z" />
        </g> */}
        {/* <g id="notes" fontSize="0.5rem" dy="10">
          {MandolinFretInfo.FINGERING_MIDPOINTS.map((p, i) => {
            const noteName =
              MandolinFretInfo.NOTES[MandolinFretInfo.FINGERING_NOTE_INDEX[i]]
                .name;
            const dx = (noteName.length / 2) * 5;
            const dy = 5;
            return (
              <text x={p[0] - dx} y={p[1] + dy}>
                {noteName}
              </text>
            );
          })}
        </g> */}
      </g>
    </svg>
  );
};

export default Fretboard;

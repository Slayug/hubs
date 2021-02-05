import { paths } from "../paths";
import { ArrayBackedSet } from "../array-backed-set";

export const ACTION_TO_CODE = {
  FLY: "KeyG",
  FORWARD: "KeyW",
  FORWARD_ARROW: "ArrowUp",
  BACKWARD: "KeyS",
  BACKWARD_ARROW: "ArrowDown",
  LEFT: "KeyA",
  LEFT_ARROW: "ArrowLeft",
  RIGHT: "KeyD",
  RIGHT_ARROW: "ArrowRight",
  TURN_LEFT: "KeyQ",
  TURN_RIGHT: "KeyG",
  FOCUS_CHAT: "KeyT"
};

export const KEYCODE_TO_CODE = {
  65: "KeyQ",
  68: "KeyD",
  71: "KeyG",
  81: "KeyA",
  84: "KeyT",
  83: "KeyS",
  90: "KeyW"
};

export class KeyboardDevice {
  constructor() {
    this.seenKeys = new ArrayBackedSet();
    this.codes = {};
    this.events = [];

    ["keydown", "keyup"].map(x =>
      document.addEventListener(x, e => {
        if (!e.key) return;
        this.events.push(e);

        // Block browser hotkeys for chat command, media browser and freeze
        if (
          (e.type === "keydown" &&
            e.key === "/" &&
            !["TEXTAREA", "INPUT"].includes(document.activeElement && document.activeElement.nodeName) &&
            !(document.activeElement && document.activeElement.contentEditable === "true")) ||
          (e.ctrlKey &&
            (e.key === "1" ||
              e.key === "2" ||
              e.key === "3" ||
              e.key === "4" ||
              e.key === "5" ||
              e.key === "6" ||
              e.key === "7" ||
              e.key === "8" ||
              e.key === "9" ||
              e.key === "0")) ||
          (e.key === "Tab" && document.activeElement.classList.contains("a-canvas"))
        ) {
          e.preventDefault();
          return false;
        }
      })
    );
    ["blur"].map(x => window.addEventListener(x, this.events.push.bind(this.events)));
  }

  write(frame) {
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (event.type === "blur") {
        this.codes = {};
        this.seenKeys.clear();
      } else {
        // Support new and old browsers
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#browser_compatibility
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode#browser_compatibility
        // Thanks to https://github.com/mozilla/hubs/issues/2397#issuecomment-750301258
        let code = event.code ?? KEYCODE_TO_CODE[event.keyCode];

        /**
         * Special key always handle old way
         * To handle both keys, for instance "ShiftLeft" and "ShiftRight", same for alt.
         */
        if (event.key === "Shift" || event.key === "Alt" || event.key === "Control") {
          code = event.key.toLowerCase();
        }
        // const key = event.key.toLowerCase();
        // console.log(event);
        // console.log("code", code);
        // console.log("fromKeyCode", KEYCODE_TO_CODE[90]);
        console.log(code);
        this.codes[code] = event.type === "keydown";
        this.seenKeys.add(code);
      }
    }

    this.events.length = 0;

    for (let i = 0; i < this.seenKeys.items.length; i++) {
      const code = this.seenKeys.items[i];
      const path = paths.device.keyboard.key(code);
      frame.setValueType(path, this.codes[code]);
    }
  }
}

import React, { useState, useEffect, useRef, Fragment, useCallback } from "react";
import PropTypes from "prop-types";
import { RoomLayout } from "../layout/RoomLayout";
import { useResizeViewport } from "./useResizeViewport";

export const TOGGLE_HIDE_ROOM_LAYOUT_EVENT = "hideRoomLayout";
export function RoomLayoutContainer({ store, scene, ...rest }) {
  const [hideToolbar, setHideToolbar] = useState(false);
  const viewportRef = useRef();

  const toggleHideRoomLayout = useCallback(() => {
    setHideToolbar(hideToolbar => !hideToolbar);
  }, []);

  useEffect(() => {
    scene.addEventListener(TOGGLE_HIDE_ROOM_LAYOUT_EVENT, toggleHideRoomLayout);

    return () => {
      scene.removeEventListener(TOGGLE_HIDE_ROOM_LAYOUT_EVENT, toggleHideRoomLayout);
    };
  }, []);

  useResizeViewport(viewportRef, store, scene);

  return <RoomLayout hideToolbar={hideToolbar} viewportRef={viewportRef} {...rest} />;
}

RoomLayoutContainer.propTypes = {
  store: PropTypes.object.isRequired,
  scene: PropTypes.object.isRequired
};

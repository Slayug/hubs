import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Modal } from "../modal/Modal";
import { Button } from "../input/Button";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ReactComponent as VolumeHighIcon } from "../icons/VolumeHigh.svg";
import { ReactComponent as VolumeOffIcon } from "../icons/VolumeOff.svg";
import styles from "./MicSetupModal.scss";
import { BackButton } from "../input/BackButton";
import { SelectInputField } from "../input/SelectInputField";
import { Column } from "../layout/Column";
import { FormattedMessage } from "react-intl";

export function CameraSetupModal({ onEnterRoom, onChangeCamera, className, onBack, ...rest }) {
  const cameraOptions = ["Première personne", "Troisième personne", "Vue de dessus"];

  return (
    <Modal title={"Camera setup"} beforeTitle={<BackButton onClick={onBack} />} className={className} {...rest}>
      <SelectInputField value={cameraOptions[0]} options={cameraOptions} onChange={onChangeCamera} />
      <Column center padding className={styles.content}>
        <Button preset="green" onClick={onEnterRoom}>
          <FormattedMessage id="mic-setup-modal.enter-room-button" defaultMessage="Enter Room" />
        </Button>
      </Column>
    </Modal>
  );
}

CameraSetupModal.propTypes = {
  className: PropTypes.string,
  onEnterRoom: PropTypes.func,
  onChangeCamera: PropTypes.func,
  onBack: PropTypes.func,
  finished: PropTypes.func
};

CameraSetupModal.defaultProps = {};

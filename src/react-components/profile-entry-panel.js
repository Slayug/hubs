import React, { Component } from "react";
import PropTypes from "prop-types";
import { SCHEMA } from "../storage/store";
import { fetchAvatar } from "../utils/avatar-utils";
import { replaceHistoryState } from "../utils/history";
import { AvatarSettingsSidebar } from "./room/AvatarSettingsSidebar";
import { AvatarSetupModal } from "./room/AvatarSetupModal";
import AvatarPreview from "./avatar-preview";

import {
  CAMERA_MODE_FIRST_PERSON,
  CAMERA_MODE_THIRD_PERSON_NEAR,
  CAMERA_MODE_THIRD_PERSON_SKY
} from "../systems/camera-system";

export default class ProfileEntryPanel extends Component {
  static propTypes = {
    containerType: PropTypes.oneOf(["sidebar", "modal"]),
    displayNameOverride: PropTypes.string,
    store: PropTypes.object,
    mediaSearchStore: PropTypes.object,
    messages: PropTypes.object,
    finished: PropTypes.func,
    history: PropTypes.object,
    avatarId: PropTypes.string,
    onClose: PropTypes.func,
    onBack: PropTypes.func,
    showBackButton: PropTypes.bool
  };

  static defaultProps = {
    containerType: "modal"
  };

  static cameraOptions = [
    { label: "Première personne", value: CAMERA_MODE_FIRST_PERSON },
    { label: "Troisième personne", value: CAMERA_MODE_THIRD_PERSON_NEAR },
    { label: "Vue de dessus", value: CAMERA_MODE_THIRD_PERSON_SKY }
  ];

  state = {
    avatarId: null,
    displayName: null,
    avatar: null
  };

  constructor(props) {
    super(props);
    this.state = this.getStateFromProfile();
    if (props.avatarId) {
      this.state.avatarId = props.avatarId;
    }
    this.props.store.addEventListener("statechanged", this.storeUpdated);
    this.scene = document.querySelector("a-scene");
    console.log("state", this.state);
  }

  getStateFromProfile = () => {
    const { displayName, avatarId } = this.props.store.state.profile;
    return { displayName, avatarId, currentCamera: ProfileEntryPanel.cameraOptions[2] };
  };

  storeUpdated = () => this.setState(this.getStateFromProfile());

  saveStateAndFinish = e => {
    e && e.preventDefault();

    const { displayName } = this.props.store.state.profile;
    const { hasChangedName } = this.props.store.state.activity;

    const hasChangedNowOrPreviously = hasChangedName || this.state.displayName !== displayName;
    this.props.store.update({
      activity: {
        hasChangedName: hasChangedNowOrPreviously,
        hasAcceptedProfile: true
      },
      profile: {
        displayName: this.state.displayName,
        avatarId: this.state.avatarId
      }
    });
    this.props.finished();
    this.scene.emit("avatar_updated");
  };

  stopPropagation = e => {
    e.stopPropagation();
  };

  setAvatarFromMediaResult = ({ detail: { entry, selectAction } }) => {
    if ((entry.type !== "avatar" && entry.type !== "avatar_listing") || selectAction !== "use") return;

    this.setState({ avatarId: entry.id });
    // Replace history state with the current avatar id since this component gets destroyed when we open the
    // avatar editor and we want the back button to work. We read the history state back via the avatarId prop.
    // We read the current state key from history since it could be "overlay" or "entry_step".
    replaceHistoryState(this.props.history, this.props.history.location.state.key, "profile", { avatarId: entry.id });
  };

  componentDidMount() {
    if (this.nameInput) {
      // stop propagation so that avatar doesn't move when wasd'ing during text input.
      this.nameInput.addEventListener("keydown", this.stopPropagation);
      this.nameInput.addEventListener("keypress", this.stopPropagation);
      this.nameInput.addEventListener("keyup", this.stopPropagation);
    }
    this.scene.addEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
    // This handles editing avatars in the entry_step, since this component remains mounted with the same avatarId
    this.scene.addEventListener("action_avatar_saved", this.refetchAvatar);

    this.refetchAvatar();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.avatarId !== this.state.avatarId) {
      this.refetchAvatar();
    }
  }

  componentWillUnmount() {
    this.props.store.removeEventListener("statechanged", this.storeUpdated);
    if (this.nameInput) {
      this.nameInput.removeEventListener("keydown", this.stopPropagation);
      this.nameInput.removeEventListener("keypress", this.stopPropagation);
      this.nameInput.removeEventListener("keyup", this.stopPropagation);
    }
    this.scene.removeEventListener("action_selected_media_result_entry", this.setAvatarFromMediaResult);
    this.scene.removeEventListener("action_avatar_saved", this.refetchAvatar);
  }

  refetchAvatar = async () => {
    const avatar = await fetchAvatar(this.state.avatarId);
    if (this.state.avatarId !== avatar.avatar_id) return; // This is an old result, ignore it
    this.setState({ avatar });
  };

  render() {
    const avatarSettingsProps = {
      displayNameInputRef: inp => (this.nameInput = inp),
      disableDisplayNameInput: !!this.props.displayNameOverride,
      displayName: this.props.displayNameOverride ? this.props.displayNameOverride : this.state.displayName,
      displayNamePattern: SCHEMA.definitions.profile.properties.displayName.pattern,
      onChangeDisplayName: e => this.setState({ displayName: e.target.value }),
      avatarPreview: <AvatarPreview avatarGltfUrl={this.state.avatar && this.state.avatar.gltf_url} />,
      onChangeAvatar: e => {
        e.preventDefault();
        this.props.mediaSearchStore.sourceNavigateWithNoNav("avatars", "use");
      },
      onSubmit: this.saveStateAndFinish,
      onClose: this.props.onClose,
      onBack: this.props.onBack,
      onChangeCamera: camera => {
        const cameraSystem = AFRAME.scenes[0].systems["hubs-systems"].cameraSystem;
        cameraSystem.cameraOnEnteredScene = camera;

        this.setState({ currentCamera: ProfileEntryPanel.cameraOptions.find(option => option.value === camera) });
      },
      cameraOptions: ProfileEntryPanel.cameraOptions,
      currentCamera: this.state.currentCamera
    };

    if (this.props.containerType === "sidebar") {
      return <AvatarSettingsSidebar {...avatarSettingsProps} showBackButton={this.props.showBackButton} />;
    }

    return <AvatarSetupModal {...avatarSettingsProps} />;
  }
}

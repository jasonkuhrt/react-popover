import * as React from "react"
// import * as F from "./utils"

/**
 * The Transition component makes it possible to run
 * exit animations before unmount.
 */
interface State {
  children: null | React.ReactElement<any>
  onExitAnimationComplete(): void
}

interface Props {
  children: null | React.ReactElement<any>
}

class Transition extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    const children =
      props.children && !state.children
        ? // continuing it
          props.children
        : // exiting it
          !props.children && state.children
          ? React.cloneElement(state.children, {
              pose: "exit",
              onPoseComplete() {
                state.onExitAnimationComplete()
              },
            })
          : // entering during exiting aka. exit interuption
            props.children && state.children
            ? React.cloneElement(props.children, {
                pose: undefined,
              })
            : // continuing nothing
              null

    return { children }
  }

  state: State = {
    children: null,
    onExitAnimationComplete: () => {
      this.onExitAnimationComplete()
    },
  }

  onExitAnimationComplete() {
    this.setState({
      children: null,
    })
  }

  render() {
    return this.state.children
  }
}

export default Transition

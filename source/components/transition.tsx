import * as React from "react"

/**
 * There are four cases of children state that Transition has to deal with.
 */
type ChildCase =
  | {
      type: "no_child"
    }
  | {
      type: "child_enter_start"
      prop: React.ReactElement<any>
    }
  | {
      type: "child_exit_start"
      state: React.ReactElement<any>
    }
  | {
      type: "child_exit_interrupt"
      prop: React.ReactElement<any>
      state: React.ReactElement<any>
    }

/**
 * Get organized data about the case of situation that Transition
 * component is dealing with.
 */
const getChildCase = (props: Props, state: State): ChildCase => {
  return !props.children && !state.children
    ? {
        type: "no_child",
      }
    : props.children && !state.children
    ? {
        type: "child_enter_start",
        prop: props.children!,
      }
    : !props.children && state.children
    ? {
        type: "child_exit_start",
        state: state.children!,
      }
    : {
        type: "child_exit_interrupt",
        prop: props.children!,
        state: state.children!,
      }
}

interface State {
  children: null | React.ReactElement<any>
  onExitAnimationComplete(): void
}

interface Props {
  children: null | React.ReactElement<any>
}

/**
 * This component makes it possible for a child to run an exit
 * animation to completion before unmounting. This is achieved
 * by keeping a reference to the child prop in state and letting
 * go of it once the child signals that its animation is complete.
 *
 * Signaling is achieved by this component injecting two special props
 * into the child when it [the child] gets unmounted. One prop lets
 * the child  know to begin its exit animation while the other is
 * a callback for it to call once that animation is complete.
 */
class Transition extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    const childCase = getChildCase(props, state)

    switch (childCase.type) {
      case "no_child":
        return {
          children: null,
        }

      case "child_enter_start":
      case "child_exit_interrupt":
        return {
          children: childCase.prop,
        }

      case "child_exit_start":
        const injectionProps = {
          pose: "exit",
          onPoseComplete: state.onExitAnimationComplete,
        } as any

        return {
          children: React.cloneElement(childCase.state, injectionProps),
        }
    }
  }

  state: State = {
    children: null,
    onExitAnimationComplete: () => {
      this.onExitAnimationComplete()
    },
  }

  /**
   * This function is designed to be called at the end of the
   * exit animation. It sets children state is set to null
   * so that react will un-render them, the desired
   * effect once said exit animation completes.
   */
  onExitAnimationComplete = () => {
    this.setState({ children: null })
  }

  render() {
    return this.state.children
  }
}

export default Transition

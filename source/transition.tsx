import * as React from "react"
import * as F from "./utils"

/**
 * The Transition component makes it possible to run
 * exit animations before unmount.
 */
interface State {
  children: React.ReactNode
  exiting: React.ReactNode[]
  onExitAnimationComplete(key: string): void
}

interface Props {
  children: React.ReactNode
}

const asArray = <T extends unknown>(x: T | T[]): T[] => {
  return Array.isArray(x) ? x : x == undefined ? [] : [x]
}

class Transition extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    const [enterings, stayings, exitings] = F.venn(
      asArray(props.children) as React.ReactElement<unknown>[],
      state.children as React.ReactElement<unknown>[],
    )

    const exitingsAnimating = exitings.map(exiting => {
      return React.cloneElement(exiting, {
        pose: "exit",
        onPoseComplete() {
          state.onExitAnimationComplete(exiting.key as string)
        },
      } as any)
    })

    return {
      children: enterings.concat(stayings).concat(exitingsAnimating),
    }
  }

  state: State = {
    children: [],
    exiting: [],
    onExitAnimationComplete: key => {
      this.onExitAnimationComplete(key)
    },
  }

  onExitAnimationComplete(key: string) {
    const i = (this.state.children as React.ReactElement<unknown>[]).findIndex(
      child => child.key === key,
    )
    this.setState({
      children: [
        ...(this.state.children as React.ReactNodeArray).slice(0, i),
        ...(this.state.children as React.ReactNodeArray).slice(i + 1),
      ],
    })
  }

  render() {
    return this.state.children
  }
}

export default Transition

import { configure, addDecorator } from "@storybook/react"
import { withOptions } from "@storybook/addon-options"

const loadStories = () => {
  require("../stories")
}

addDecorator(
  // TODO update typings to type withOptions with Options
  // For now, if you want to know the available options,
  // click into the module to see the typings source.
  withOptions({
    showAddonPanel: false,
    showSearchBox: false,
    showStoriesPanel: false,
  }),
)

configure(loadStories, module)

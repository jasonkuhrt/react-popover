import { configure } from "@storybook/react"
import { setOptions } from "@storybook/addon-options"

function loadStories() {
  require("../stories")
}

setOptions({
  showAddonPanel: false,
  showSearchBox: false,
  showStoriesPanel: false,
})

configure(loadStories, module)

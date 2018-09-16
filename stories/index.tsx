// import { action } from "@storybook/addon-actions";
// import { linkTo } from "@storybook/addon-links";
import { storiesOf } from "@storybook/react"
import React from "react"
import Playground from "./playground/main"
import Rows from "./rows/main"

// import { Button, Welcome } from "@storybook/react/demo";

storiesOf("Popover", module)
  .add("Playground", () => <Playground />)
  .add("Rows", () => <Rows />)

// storiesOf("Welcome", module).add("to Storybook", () => <Welcome showApp={linkTo("Button")} />);
//
// storiesOf("Button", module)
//   .add("with text", () => <Button onClick={action("clicked")}>Hello Button</Button>)
//   .add("with some emoji", () => <Button onClick={action("clicked")}>😀 😎 👍 💯</Button>);

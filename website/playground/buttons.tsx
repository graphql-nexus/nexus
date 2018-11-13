import React from "react";
import ClipboardJS from "clipboard";

export const Button = React.forwardRef((props, ref) => (
  <button type="button" className="btn" ref={ref} {...props} />
));

export function LinkButton(props) {
  return <a className="btn" {...props} />;
}

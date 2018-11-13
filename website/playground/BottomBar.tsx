import React from "react";
import ReactDOM from "react-dom";

const root = document.getElementById("bottom-bar");

export default function({ left, right }) {
  return ReactDOM.createPortal(
    <>
      <div className="bottom-bar-buttons">{left}</div>
      <div className="bottom-bar-buttons bottom-bar-buttons-right">{right}</div>
    </>,
    root
  );
}

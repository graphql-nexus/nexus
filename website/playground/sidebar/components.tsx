import React from "react";

export function Sidebar({ visible, children }) {
  return (
    <div className={`options-container ${visible ? "open" : ""}`}>
      <div className="options">{children}</div>
    </div>
  );
}

export function SidebarCategory({ title, children }) {
  return (
    <div className="sub-options">
      <summary>{title}</summary>
      {children}
    </div>
  );
}

import React from 'react'

export default (props: any) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="16" cy="16" r="16" fill="#E2E8F0" />
    <path
      d="M8 15.5H21.5M18 11L23 15.5L18 20"
      stroke="#718096"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

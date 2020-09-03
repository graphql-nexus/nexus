import React from 'react'

export default () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#3C2E20" />
    <path fill="#A6A385" d="M11 18H12V21C11.626 21.3025 11.4084 21.3271 11 21V18Z" />
    <path
      fill="#58AA50"
      d="M11.5 3C11.5 3 16.0776 6.47449 15.999 11C15.9204 15.5255 11.5 19 11.5 19C11.5 19 7.07954 15.5255 7.001 11C6.92246 6.47451 11.5 3 11.5 3Z"
    />
    <path
      fill="url(#mongo_db_gradient)"
      d="M11.5 3C11.5 3 16.0776 6.47449 15.999 11C15.9204 15.5255 11.5 19 11.5 19C11.5 19 7.07954 15.5255 7.001 11C6.92246 6.47451 11.5 3 11.5 3Z"
    />
    <path
      fill="#499D4A"
      d="M11.5 3C11.5 3 16.0776 6.47449 15.999 11C15.9205 15.5255 11.5 19 11.5 19C11.5 17.5 11.5 4.5 11.5 3Z"
    />
    <defs>
      <linearGradient
        id="mongo_db_gradient"
        x1="9.5"
        y1="5"
        x2="13.5"
        y2="17.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#58AA50" />
        <stop offset="1" stopColor="#80D578" />
      </linearGradient>
    </defs>
  </svg>
)

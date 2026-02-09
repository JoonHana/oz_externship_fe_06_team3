export const CameraIcon = ({ size = 32, color = '#FAFAFA', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle
      cx="16"
      cy="16"
      r="16"
      fill="#BDBDBD"
      stroke="#E5E7EB"
      strokeWidth="2"
    />
    <rect x="8" y="11" width="16" height="12" rx="2" fill={color} />
    <circle cx="16" cy="17" r="2" fill="#BDBDBD" />
    <rect x="12" y="8" width="8" height="4" rx="1" fill={color} />
  </svg>
)

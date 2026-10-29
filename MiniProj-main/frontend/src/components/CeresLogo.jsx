import PropTypes from "prop-types";

/**
 * CeresLogo - A minimalistic geometric emblem representing a grain seed and cultivated field.
 * Works across light/dark backgrounds with configurable sizing and optional wordmark.
 */
export default function CeresLogo({
  size = 32,
  className = "",
  showWordmark = true,
  wordmarkClassName = "text-xl font-bold tracking-wider text-[#590907] font-serif",
  invert = false,
}) {
  const primaryColor = invert ? "#FDFBF7" : "#590907";
  const innerColor = invert ? "#590907" : "#FDFBF7";
  const contourColor = invert ? "#E8D2B5" : "#A5A79B";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-label="Ceres Logo"
        role="img"
      >
        <title>Ceres Emblem</title>
        {/* Seed outer envelope */}
        <path
          d="M24 4C24 4 11 15 11 28C11 35.18 16.82 41 24 41C31.18 41 37 35.18 37 28C37 15 24 4 24 4Z"
          fill={primaryColor}
        />
        {/* Inner germinating core curve */}
        <path
          d="M24 10C24 16 19 22 19 28C19 30.76 21.24 33 24 33C26.76 33 29 30.76 29 28C29 23 25 18 24 10Z"
          fill={innerColor}
        />
        {/* Base field contour line */}
        <path
          d="M15 36C17.6 37.8 20.6 38.8 24 38.8C27.4 38.8 30.4 37.8 33 36"
          stroke={contourColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className={wordmarkClassName}>
          CERES
        </span>
      )}
    </div>
  );
}

CeresLogo.propTypes = {
  size: PropTypes.number,
  className: PropTypes.string,
  showWordmark: PropTypes.bool,
  wordmarkClassName: PropTypes.string,
  invert: PropTypes.bool,
};

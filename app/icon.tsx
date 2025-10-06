import { ImageResponse } from 'next/og';

export const size = {
  width: 64,
  height: 64
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="12" fill="#1f2937" />
        <path d="M20 18h24v6H20zm-4 12h32v6H16zm6 12h20v6H22z" fill="#38bdf8" />
      </svg>
    ),
    size
  );
}

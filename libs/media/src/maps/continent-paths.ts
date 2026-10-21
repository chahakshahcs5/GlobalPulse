/**
 * Simplified continent outlines, in an 800×450 equirectangular space.
 *
 * These are a stylised fallback for serverside rendering, not survey data —
 * they are enough to give a reader their bearings, and they cost nothing to
 * ship. The coordinates are `x = (lng + 180) / 360 * 800` and
 * `y = (90 - lat) / 180 * 450`.
 */
export const CONTINENT_PATHS: string[] = [
  // North America (Alaska, Canada, US, Mexico, Central America)
  'M 80 40 L 125 35 L 180 38 L 225 58 L 240 85 L 210 115 L 245 130 L 218 152 L 195 145 L 185 185 L 202 198 L 215 192 L 230 220 L 220 235 L 198 215 L 175 190 L 155 170 L 135 155 L 105 142 L 78 100 L 72 65 Z',
  // Greenland
  'M 270 30 L 320 28 L 335 55 L 305 85 L 265 75 Z',
  // South America
  'M 220 235 L 248 232 L 285 260 L 302 288 L 278 350 L 242 382 L 225 365 L 232 310 L 210 260 Z',
  // Europe & Scandinavia
  'M 378 72 L 400 48 L 425 45 L 430 75 L 452 70 L 458 102 L 435 125 L 398 128 L 372 108 L 365 82 Z',
  // British Isles
  'M 358 85 L 372 80 L 368 100 L 354 102 Z',
  // Africa
  'M 368 138 L 442 135 L 478 175 L 492 225 L 448 322 L 420 338 L 392 282 L 358 210 L 354 165 Z',
  // Madagascar
  'M 495 285 L 505 285 L 498 330 L 485 325 Z',
  // Asia & Siberia
  'M 458 68 L 520 48 L 610 52 L 685 68 L 715 110 L 678 148 L 638 148 L 622 185 L 578 190 L 548 165 L 488 170 L 460 135 L 465 95 Z',
  // Japan
  'M 685 115 L 702 120 L 696 145 L 680 140 Z',
  // India & South Asia
  'M 525 185 L 565 185 L 575 220 L 548 255 L 528 220 Z',
  // Southeast Asia & Indonesia
  'M 590 195 L 628 200 L 612 240 L 585 225 Z M 605 255 L 645 255 L 635 275 L 610 270 Z M 650 258 L 680 260 L 675 280 L 648 278 Z',
  // Australia & New Zealand
  'M 632 272 L 712 268 L 730 315 L 685 342 L 638 318 Z M 740 330 L 755 335 L 748 365 L 735 355 Z',
  // Antarctica
  'M 60 422 L 740 422 L 720 445 L 80 445 Z',
];

/**
 * Scale a path from the 800×450 reference space to the given canvas.
 */
export function scaleContinentPath(pathStr: string, width: number, height: number): string {
  const sx = width / 800;
  const sy = height / 450;
  return pathStr.replace(/([\d.]+)\s+([\d.]+)/g, (_, px: string, py: string) => {
    return `${(parseFloat(px) * sx).toFixed(1)} ${(parseFloat(py) * sy).toFixed(1)}`;
  });
}

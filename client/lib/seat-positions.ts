

export function getSeatPosition(seatNumber:number, totalSeats:number=6){
    const angleStep = (2 * Math.PI) / totalSeats;
  const startAngle = Math.PI / 2; // bottom of the oval
  const angle = startAngle + seatNumber * angleStep;

  const radiusX = 38; // % of container width
  const radiusY = 32; // % of container height

  const left = 50 + radiusX * Math.cos(angle);
  const top = 50 + radiusY * Math.sin(angle);

  return { left: `${left}%`, top: `${top}%` };
}
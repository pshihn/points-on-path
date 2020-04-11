import { Point, pointsOnBezierCurves } from 'points-on-curve';
import { parsePath, absolutize, normalize } from 'path-data-parser';

export { Point } from 'points-on-curve';

interface PathPoints {
  points: Point[];
  continuous: boolean;
}

export function pointsOnPath(path: string, tolerance?: number, distance?: number): PathPoints {
  const segments = parsePath(path);
  const normalized = normalize(absolutize(segments));
  const points: Point[] = [];
  let start: Point = [0, 0];
  let moves = 0;
  let pendingCurve: Point[] = [];

  const appendPendingCurve = () => {
    if (pendingCurve && pendingCurve.length >= 4) {
      points.push(...pointsOnBezierCurves(pendingCurve, tolerance, distance));
    }
    pendingCurve = [];
  };

  for (const segment of normalized) {
    const data = segment.data;
    switch (segment.key) {
      case 'M':
        appendPendingCurve();
        moves++;
        start = [data[0], data[1]];
        points.push(start);
        break;
      case 'L':
        appendPendingCurve();
        points.push([data[0], data[1]]);
        break;
      case 'C':
        if (!pendingCurve.length) {
          const lastPoint = points.length ? points[points.length - 1] : start;
          pendingCurve.push([lastPoint[0], lastPoint[1]]);
        }
        pendingCurve.push([data[0], data[1]]);
        pendingCurve.push([data[2], data[3]]);
        pendingCurve.push([data[4], data[5]]);
        break;
      case 'Z':
        appendPendingCurve();
        points.push([start[0], start[1]]);
        break;
    }
  }
  appendPendingCurve();
  return {
    continuous: moves < 2,
    points
  };
}
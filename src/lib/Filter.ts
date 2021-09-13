import { Waypoint } from "./Waypoint";
import { Trip } from "./Trip";

interface secretPlaceProps {
  nw: Array<number>;
  se: Array<number>;
  fix: Array<number>;
}

const secretPlaces: secretPlaceProps[] = [
  {
    nw: [-97.92835235595705, 30.1457209625174],
    se: [-97.58090972900392, 30.427361303226743],
    fix: [-97.74053500, 30.27418300],
  },
  {
    nw: [-96.0071182, 36.1655966],
    se: [-95.7616425, 35.9557765],
    fix: [-95.99151600, 36.15685900],
  }
];

const between = (a: number, b: number, c: number): boolean => (a < b && b < c) || (a > b && b > c);

const filterCoords = (input: Array<number>): Array<number> => {
  for (const pair of secretPlaces) {
    if (
      between(pair.nw[0], input[0], pair.se[0]) &&
      between(pair.nw[1], input[1], pair.se[1])
    )  {
      return pair.fix;
    }
  }

  return input;
}

export function locationFilter(input: Waypoint | Trip) {
  if (input instanceof Waypoint) {
    const newCoords = filterCoords([input.lon, input.lat]);
    input.lon = newCoords[0];
    input.lat = newCoords[1];
    input.point = undefined;
  } else if (input instanceof Trip) {
    const filteredLine = input.line.coordinates.map((coords: Array<number>) => filterCoords(coords));
    input.line.coordinates = filteredLine;
  } else {
    console.log('Input is neither a Waypoint or a Trip');
  }

  return input;
}

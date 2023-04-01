import { Waypoint } from './Waypoint';
import { Trip } from './Trip';

interface secretPlaceProps {
  nw: Array<number>;
  se: Array<number>;
  fix: Array<number>;
}

const secretPlaces: secretPlaceProps[] = [
  {
    nw: [-97.92835235595705, 30.1457209625174],
    se: [-97.58090972900392, 30.427361303226743],
    fix: [-97.740535, 30.274183],
  },
  {
    nw: [-96.0071182, 36.1655966],
    se: [-95.7616425, 35.9557765],
    fix: [-95.991516, 36.156859],
  },
  {
    nw: [-98.40983, 30.623577],
    se: [-98.353204, 30.559404],
    fix: [-98.378759, 30.571411],
  },
  {
    nw: [-81.760876, 38.3857],
    se: [-81.659895, 38.331979],
    fix: [-81.696758, 38.368905],
  },
  {
    nw: [-110.583962, 45.673072],
    se: [-110.533897, 45.657702],
    fix: [-110.560009, 45.661411],
  },
];

const between = (a: number, b: number, c: number): boolean =>
  (a < b && b < c) || (a > b && b > c);

const filterCoords = (input: Array<number>): Array<number> => {
  for (const pair of secretPlaces) {
    if (
      between(pair.nw[0], input[0], pair.se[0]) &&
      between(pair.nw[1], input[1], pair.se[1])
    ) {
      return pair.fix;
    }
  }

  return input;
};

export function locationFilter(input: Waypoint | Trip): Waypoint | Trip {
  if (input instanceof Waypoint) {
    const newCoords = filterCoords([input.lon, input.lat]);
    input.lon = newCoords[0];
    input.lat = newCoords[1];
    input.point = undefined;
  } else if (input instanceof Trip) {
    const filteredLine = input.line.coordinates.map((coords: Array<number>) =>
      filterCoords(coords)
    );
    input.line.coordinates = filteredLine;
  }

  return input;
}

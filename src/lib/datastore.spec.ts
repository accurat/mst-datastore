// tslint:disable:no-expression-statement
// tslint:disable:no-console
import test from 'ava';
import dayjs from 'dayjs';
import { range, toNumber, toString } from 'lodash';
import { dataJuggler } from '..';
import { InferObject, MomentsObject } from '../types/types';
import { FormatterObject } from './utils/dataInference';
// ParseObjectType
import {
  computeMoments,
  generateParamsArrayFromInferObject,
  populateNullData
} from './utils/stats';

const DEFAULT_DATE = 1552563578;
const DATES_D = range(4).map(i => DEFAULT_DATE - i * 100);

const FIRST_SAMPLE_DATA = [
  { a: 3, b: 'mamma', d: DATES_D[0] },
  { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
  { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
  { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
];

type Datum = typeof FIRST_SAMPLE_DATA[0]

const INSTANCE_TYPES: InferObject<Datum> = {
  a: 'continuous',
  b: 'categorical',
  c: 'continuous',
  d: 'date',
};

const juggledData = dataJuggler(FIRST_SAMPLE_DATA, INSTANCE_TYPES); // Better typing for this

// -------
test('inferObject', t => {
  const defaultMoments = generateParamsArrayFromInferObject(INSTANCE_TYPES);

  const EXPECTED_DEFAULT_MOMENTS: MomentsObject<Datum> = {
    a: { min: null, max: null, sum: 0 },
    b: { frequencies: {} },
    c: { min: null, max: null, sum: 0 },
    d: { min: null, max: null }
  };

  t.deepEqual(EXPECTED_DEFAULT_MOMENTS, defaultMoments);
});

test('dataStore', t => {

  const filledSample = populateNullData(FIRST_SAMPLE_DATA);
  const EXPECTED_FILLED_SAMPLE = [
    { a: 3, b: 'mamma', c: null, d: DATES_D[0] },
    { a: 2, b: 'papà', c: 2, d: DATES_D[1] },
    { a: 1.5, b: 'cugino', c: 3, d: DATES_D[2] },
    { a: 1, b: 'papà', c: 4, d: DATES_D[3] }
  ];

  const moments = computeMoments(filledSample, INSTANCE_TYPES);
  const EXPECTED_MOMENTS: MomentsObject<Datum> = {
    a: { min: 1, max: 3, sum: 7.5 },
    b: { frequencies: { mamma: 1, papà: 2, cugino: 1 } },
    c: { min: 2, max: 4, sum: 9 },
    d: { min: DATES_D[3], max: DATES_D[0] }
  };

  // Filled array tests
  t.notThrows(() => populateNullData(FIRST_SAMPLE_DATA));
  t.deepEqual(EXPECTED_FILLED_SAMPLE, filledSample);

  // Moments test
  t.notThrows(() => computeMoments(filledSample, INSTANCE_TYPES));
  t.deepEqual(EXPECTED_MOMENTS, moments);

  const firstDatum = juggledData[0]

  t.deepEqual(firstDatum.a, { raw: 3, scaled: 1 });

  const DATETIME = dayjs.unix(DATES_D[0]);
  const expectedDFirst = {
    dateTime: DATETIME,
    isValid: true,
    iso: DATETIME.format('DD-MM-YYYY'),
    raw: DATES_D[0],
    scaled: 1
  };

  t.deepEqual(firstDatum.d, expectedDFirst);
});

test('Custom formatter', t => {


  const formatter: FormatterObject<Datum> = {
    a: [
      {
        formatter: datum => toString(toNumber(datum.raw) * 3),
        name: 'timesthree'
      }
    ],
    d: [
      {
        formatter: datum =>
          datum.dateTime && dayjs.isDayjs(datum.dateTime) // issue with instanceof for dayjs
            ? datum.dateTime.format('YYYY')
            : '',
        name: 'year'
      }
    ]
  };

  const formattedJuggledData = dataJuggler(
    FIRST_SAMPLE_DATA,
    INSTANCE_TYPES,
    formatter
  )
     // Better typing for this


  const EXPECTED_YEAR = '2019';

  const EXPECTED_A = { raw: 3, scaled: 1, timesthree: '9' };

  const firstInstanceOfA = formattedJuggledData[0].a;
  const firstDateInstanceNormal = formattedJuggledData[0].d;

  t.deepEqual(EXPECTED_YEAR, firstDateInstanceNormal.year);
  t.deepEqual(EXPECTED_A, firstInstanceOfA);
});

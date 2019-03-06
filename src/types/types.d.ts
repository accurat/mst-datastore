interface GenericDatum {
  readonly [key: string]:
    | number
    | string
    | boolean
    | ReadonlyArray<number>
    | ReadonlyArray<string>
    | GenericDatum
    | null;
}

type GenericDataSet = ReadonlyArray<GenericDatum>;

interface NormalizingContinuous {
  readonly mean: number;
  readonly min: number;
  readonly max: number;
}

interface NormalizingDatetime {
  readonly min: number;
  readonly max: number;
}

interface NormalizingCategorical {
  readonly frequencies: ReadonlyArray<
    ReadonlyArray<{ readonly [variable: string]: number }>
  >;
}

// type InferType = 'continuous' | 'categorical' | 'date';

interface MapTypeInfer {
  readonly continuous: NormalizingContinuous;
  readonly categorical: NormalizingCategorical;
  readonly date: NormalizingDatetime;
}

type A<T extends keyof MapTypeInfer> = MapTypeInfer[T];

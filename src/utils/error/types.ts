// auth 에러 매핑 타입 - form/field/tokenInvalid 구분해서 UI에서 처리
export type MappedError =
  | { kind: 'form'; message: string }
  | { kind: 'field'; field: string; message: string }
  | { kind: 'tokenInvalid'; message: string }

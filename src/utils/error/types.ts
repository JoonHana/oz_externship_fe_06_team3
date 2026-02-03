// 에러 매핑 타입 - UI가 바로 처리 가능한 형태
export type MappedError =
  | { kind: 'form'; message: string }
  | { kind: 'field'; field: string; message: string }
  | { kind: 'tokenInvalid'; message: string }

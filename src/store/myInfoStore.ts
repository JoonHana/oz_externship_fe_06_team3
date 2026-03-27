import { create } from 'zustand'

export type MyInfoState = {
  nickname: string
  nicknameStatus: 'default' | 'success' | 'error'
  phone: string
  phoneStatus: 'default' | 'success' | 'error'
  smsCode: string
  smsStatus: 'default' | 'success' | 'error'
  phoneChanging: boolean
  smsToken: string | null
  error: string | null
  verifiedPhone: string | null
  phoneVerifyToken: string | null
  setField: (key: keyof MyInfoState, value: any) => void
  reset: () => void
}

const initialState: Omit<MyInfoState, 'setField' | 'reset'> = {
  nickname: '',
  nicknameStatus: 'default',
  phone: '',
  phoneStatus: 'default',
  smsCode: '',
  smsStatus: 'default',
  phoneChanging: false,
  smsToken: null,
  error: null,
  verifiedPhone: null,
  phoneVerifyToken: null,
}

export const useMyInfoStore = create<MyInfoState>((set) => ({
  ...initialState,
  setField: (key, value) => set({ [key]: value }),
  reset: () => set(initialState),
}))

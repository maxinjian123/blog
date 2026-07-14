import { get } from '@/services/request'
import type { Captcha } from '@/types/models'

export function fetchCaptcha() {
  return get<Captcha>('/captcha')
}

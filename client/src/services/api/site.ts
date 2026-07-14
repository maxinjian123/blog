import { get } from '@/services/request'
import type { SiteInfo } from '@/types/models'

export function fetchSiteInfo() {
  return get<SiteInfo>('/site/info')
}

import { get } from '@/services/request'
import type { Announcement } from '@/types/models'

export function fetchAnnouncements() {
  return get<Announcement[]>('/announcements')
}

export function fetchLatestAnnouncement() {
  return get<Announcement>('/announcements/latest')
}

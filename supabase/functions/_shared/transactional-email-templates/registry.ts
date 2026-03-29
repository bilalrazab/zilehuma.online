/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as sessionConfirmation } from './session-confirmation.tsx'
import { template as taskAssignment } from './task-assignment.tsx'
import { template as resourceAssignment } from './resource-assignment.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'session-confirmation': sessionConfirmation,
  'task-assignment': taskAssignment,
  'resource-assignment': resourceAssignment,
}

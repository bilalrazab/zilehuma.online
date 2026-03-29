/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Zil-e-Huma Suleman"

interface TaskAssignmentProps {
  clientName?: string
  taskTitle?: string
  dueDate?: string
  priority?: string
}

const TaskAssignmentEmail = ({ clientName, taskTitle, dueDate, priority }: TaskAssignmentProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New task assigned: {taskTitle || 'Check your portal'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>{SITE_NAME}</Heading>
        <Hr style={divider} />
        <Heading style={h1}>
          {clientName ? `Hi ${clientName},` : 'Hello,'}
        </Heading>
        <Text style={text}>
          A new task has been assigned to you by your therapist:
        </Text>
        <Text style={taskBox}>
          📋 <strong>{taskTitle || 'New Task'}</strong>
          {dueDate && <><br />📅 Due: {dueDate}</>}
          {priority && <><br />⚡ Priority: {priority}</>}
        </Text>
        <Text style={text}>
          Log in to your portal to view the details and mark it complete when done.
        </Text>
        <Button style={button} href="https://zilehuma.online/dashboard/tasks">
          View My Tasks
        </Button>
        <Hr style={divider} />
        <Text style={footer}>{SITE_NAME} · Clinical Psychologist</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TaskAssignmentEmail,
  subject: (data: Record<string, any>) => `New Task: ${data.taskTitle || 'Check your portal'}`,
  displayName: 'Task Assignment',
  previewData: { clientName: 'Sarah', taskTitle: 'Complete mood journal', dueDate: 'January 20, 2026', priority: 'medium' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Georgia', 'Lora', serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const logo = { fontSize: '18px', fontWeight: 'bold' as const, color: '#4a8c6f', margin: '0 0 10px', textAlign: 'center' as const }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const taskBox = { fontSize: '14px', color: '#1a2332', lineHeight: '1.8', backgroundColor: '#f0f7f3', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const button = { backgroundColor: '#4a8c6f', color: '#ffffff', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0', textAlign: 'center' as const }

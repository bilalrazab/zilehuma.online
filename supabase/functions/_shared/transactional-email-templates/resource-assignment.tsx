/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Zil-e-Huma Suleman"

interface ResourceAssignmentProps {
  clientName?: string
  resourceTitle?: string
  resourceType?: string
  dueDate?: string
}

const ResourceAssignmentEmail = ({ clientName, resourceTitle, resourceType, dueDate }: ResourceAssignmentProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New resource shared: {resourceTitle || 'Check your portal'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>{SITE_NAME}</Heading>
        <Hr style={divider} />
        <Heading style={h1}>
          {clientName ? `Hi ${clientName},` : 'Hello,'}
        </Heading>
        <Text style={text}>
          Your therapist has shared a new resource with you:
        </Text>
        <Text style={resBox}>
          📚 <strong>{resourceTitle || 'New Resource'}</strong>
          {resourceType && <><br />Type: {resourceType}</>}
          {dueDate && <><br />📅 Complete by: {dueDate}</>}
        </Text>
        <Text style={text}>
          Please review this resource as part of your treatment plan. You can access it in your portal.
        </Text>
        <Button style={button} href="https://zilehuma.online/dashboard/progress">
          View My Resources
        </Button>
        <Hr style={divider} />
        <Text style={footer}>{SITE_NAME} · Clinical Psychologist</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ResourceAssignmentEmail,
  subject: (data: Record<string, any>) => `New Resource: ${data.resourceTitle || 'Check your portal'}`,
  displayName: 'Resource Assignment',
  previewData: { clientName: 'Sarah', resourceTitle: 'CBT Thought Record Worksheet', resourceType: 'worksheet', dueDate: 'January 22, 2026' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Georgia', 'Lora', serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const logo = { fontSize: '18px', fontWeight: 'bold' as const, color: '#4a8c6f', margin: '0 0 10px', textAlign: 'center' as const }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const resBox = { fontSize: '14px', color: '#1a2332', lineHeight: '1.8', backgroundColor: '#f0f7f3', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const button = { backgroundColor: '#4a8c6f', color: '#ffffff', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0', textAlign: 'center' as const }

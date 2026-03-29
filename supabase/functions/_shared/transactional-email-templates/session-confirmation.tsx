/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Zil-e-Huma Suleman"

interface SessionConfirmationProps {
  clientName?: string
  sessionDate?: string
  sessionTime?: string
  sessionType?: string
  duration?: string
}

const SessionConfirmationEmail = ({ clientName, sessionDate, sessionTime, sessionType, duration }: SessionConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your session with {SITE_NAME} has been scheduled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>{SITE_NAME}</Heading>
        <Hr style={divider} />
        <Heading style={h1}>
          {clientName ? `Hi ${clientName},` : 'Hello,'}
        </Heading>
        <Text style={text}>
          Your therapy session has been confirmed. Here are the details:
        </Text>
        <Section style={detailBox}>
          <Text style={detailItem}>📅 <strong>Date:</strong> {sessionDate || 'To be confirmed'}</Text>
          <Text style={detailItem}>🕐 <strong>Time:</strong> {sessionTime || 'To be confirmed'}</Text>
          <Text style={detailItem}>⏱️ <strong>Duration:</strong> {duration || '50 minutes'}</Text>
          <Text style={detailItem}>📍 <strong>Type:</strong> {sessionType || 'In-person'}</Text>
        </Section>
        <Text style={text}>
          If you need to reschedule, please reach out through the messaging portal at least 24 hours before your session.
        </Text>
        <Button style={button} href="https://zilehuma.online/dashboard/sessions">
          View My Sessions
        </Button>
        <Hr style={divider} />
        <Text style={footer}>
          {SITE_NAME} · Clinical Psychologist
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SessionConfirmationEmail,
  subject: 'Your Session is Confirmed',
  displayName: 'Session Confirmation',
  previewData: { clientName: 'Sarah', sessionDate: 'January 15, 2026', sessionTime: '2:00 PM', sessionType: 'In-person', duration: '50 minutes' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Georgia', 'Lora', serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const logo = { fontSize: '18px', fontWeight: 'bold' as const, color: '#4a8c6f', margin: '0 0 10px', textAlign: 'center' as const }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const detailBox = { backgroundColor: '#f0f7f3', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailItem = { fontSize: '14px', color: '#1a2332', lineHeight: '1.8', margin: '0' }
const button = { backgroundColor: '#4a8c6f', color: '#ffffff', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0', textAlign: 'center' as const }

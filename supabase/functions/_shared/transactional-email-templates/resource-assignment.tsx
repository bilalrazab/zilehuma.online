/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section, Link,
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
      <Container style={wrapper}>
        <Section style={gradientStrip} />
        <Container style={card}>
          <Section style={headerSection}>
            <Text style={brandName}>{SITE_NAME}</Text>
            <Text style={brandTitle}>Clinical Psychologist</Text>
          </Section>

          <Section style={iconCircle}>
            <Text style={iconEmoji}>📚</Text>
          </Section>

          <Heading style={h1}>
            {clientName ? `${clientName}, a new resource for you` : 'A new resource for you'}
          </Heading>

          <Text style={text}>
            Your therapist has shared a resource to support your progress:
          </Text>

          <Section style={resBox}>
            <Text style={resTitle}>📚  {resourceTitle || 'New Resource'}</Text>
            {resourceType && <Text style={resMeta}>Type: <strong style={{ textTransform: 'capitalize' as any }}>{resourceType}</strong></Text>}
            {dueDate && <Text style={resMeta}>📅  Complete by: {dueDate}</Text>}
          </Section>

          <Text style={textMuted}>
            Please review this resource as part of your treatment plan.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href="https://zilehuma.online/dashboard/progress">
              View My Resources
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>{SITE_NAME} · Clinical Psychologist</Text>
          <Section style={footerLinks}>
            <Link href="https://zilehuma.online" style={footerLink}>Website</Link>
            <Text style={footerDot}> · </Text>
            <Link href="https://zilehuma.online/privacy-policy" style={footerLink}>Privacy Policy</Link>
          </Section>
        </Container>
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

const main = { backgroundColor: '#f4f7f5', fontFamily: "'Georgia', 'Lora', 'Times New Roman', serif", padding: '40px 0' }
const wrapper = { maxWidth: '520px', margin: '0 auto' }
const gradientStrip = { height: '4px', background: 'linear-gradient(90deg, hsl(152, 30%, 42%), hsl(260, 40%, 72%))', borderRadius: '8px 8px 0 0' }
const card = { backgroundColor: '#ffffff', borderRadius: '0 0 8px 8px', padding: '48px 40px 36px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8ece9', borderTop: 'none' }
const headerSection = { textAlign: 'center' as const, marginBottom: '32px' }
const brandName = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(152, 30%, 42%)', margin: '0', lineHeight: '1.3', letterSpacing: '-0.3px' }
const brandTitle = { fontSize: '11px', color: 'hsl(220, 10%, 56%)', margin: '6px 0 0', textTransform: 'uppercase' as const, letterSpacing: '2px', fontFamily: "'Arial', sans-serif" }
const iconCircle = { textAlign: 'center' as const, margin: '0 0 24px' }
const iconEmoji = { fontSize: '36px', margin: '0', lineHeight: '1' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px', textAlign: 'center' as const, lineHeight: '1.35' }
const text = { fontSize: '15px', color: '#3d4852', lineHeight: '1.7', margin: '0 0 16px' }
const textMuted = { fontSize: '14px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.7', margin: '0 0 24px' }
const resBox = { backgroundColor: 'hsl(140, 20%, 96%)', borderRadius: '10px', padding: '20px 24px', margin: '0 0 20px' }
const resTitle = { fontSize: '15px', color: '#1a2332', fontWeight: 'bold' as const, margin: '0 0 8px', fontFamily: "'Arial', sans-serif" }
const resMeta = { fontSize: '14px', color: '#3d4852', lineHeight: '1.6', margin: '0 0 4px', fontFamily: "'Arial', sans-serif" }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0 24px' }
const button = { backgroundColor: 'hsl(152, 30%, 42%)', color: '#ffffff', fontSize: '15px', borderRadius: '24px', padding: '14px 36px', textDecoration: 'none', fontWeight: 'bold' as const, fontFamily: "'Arial', sans-serif", boxShadow: '0 2px 8px hsla(152, 30%, 42%, 0.3)' }
const divider = { borderColor: '#eef1ef', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 12px', lineHeight: '1.5', textAlign: 'center' as const }
const footerLinks = { textAlign: 'center' as const }
const footerLink = { color: '#bbbbbb', textDecoration: 'underline', fontSize: '12px' }
const footerDot = { color: '#bbbbbb', fontSize: '12px', display: 'inline' as const, margin: '0 4px' }

/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandName}>Zil-e-Huma Suleman</Text>
          <Text style={brandTitle}>Clinical Psychologist</Text>
        </Section>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>Confirm Email Change</Button>
        </Section>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>
        <Text style={privacyNote}>
          <Link href="https://zilehuma.online/privacy-policy" style={privacyLink}>Privacy Policy</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Lora', Georgia, serif" }
const container = { padding: '40px 30px', maxWidth: '480px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '30px', borderBottom: '2px solid hsl(152, 30%, 42%)', paddingBottom: '20px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(152, 30%, 42%)', margin: '0', lineHeight: '1.3' }
const brandTitle = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '4px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: 'hsl(152, 30%, 42%)', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '30px 0' }
const button = { backgroundColor: 'hsl(152, 30%, 42%)', color: '#ffffff', fontSize: '15px', borderRadius: '20px', padding: '14px 28px', textDecoration: 'none', fontWeight: 'bold' as const }
const footer = { fontSize: '13px', color: '#999999', margin: '30px 0 0', lineHeight: '1.5' }
const privacyNote = { fontSize: '12px', color: '#bbbbbb', margin: '15px 0 0', textAlign: 'center' as const }
const privacyLink = { color: '#bbbbbb', textDecoration: 'underline' }

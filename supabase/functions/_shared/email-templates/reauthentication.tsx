/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandName}>Zil-e-Huma Suleman</Text>
          <Text style={brandTitle}>Clinical Psychologist</Text>
        </Section>
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeSection}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Text style={privacyNote}>
          <Link href="https://zilehuma.online/privacy-policy" style={privacyLink}>Privacy Policy</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Lora', Georgia, serif" }
const container = { padding: '40px 30px', maxWidth: '480px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '30px', borderBottom: '2px solid hsl(152, 30%, 42%)', paddingBottom: '20px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(152, 30%, 42%)', margin: '0', lineHeight: '1.3' }
const brandTitle = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '4px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 14%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 46%)', lineHeight: '1.6', margin: '0 0 20px' }
const codeSection = { textAlign: 'center' as const, margin: '25px 0', padding: '20px', backgroundColor: 'hsl(140, 20%, 97%)', borderRadius: '12px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(152, 30%, 42%)', margin: '0', letterSpacing: '4px' }
const footer = { fontSize: '13px', color: '#999999', margin: '30px 0 0', lineHeight: '1.5' }
const privacyNote = { fontSize: '12px', color: '#bbbbbb', margin: '15px 0 0', textAlign: 'center' as const }
const privacyLink = { color: '#bbbbbb', textDecoration: 'underline' }

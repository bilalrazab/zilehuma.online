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
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={gradientStrip} />
        <Container style={card}>
          <Section style={headerSection}>
            <Text style={brandName}>Zil-e-Huma Suleman</Text>
            <Text style={brandTitle}>Clinical Psychologist</Text>
          </Section>

          <Section style={iconCircle}>
            <Text style={iconEmoji}>🛡️</Text>
          </Section>

          <Heading style={h1}>Verification Code</Heading>

          <Text style={text}>
            Use the code below to confirm your identity:
          </Text>

          <Section style={codeBox}>
            <Text style={codeStyle}>{token}</Text>
          </Section>

          <Section style={tipBox}>
            <Text style={tipText}>
              ⏳ This code expires shortly. Do not share it with anyone.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            If you didn't request this code, you can safely ignore this email.
          </Text>

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

export default ReauthenticationEmail

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
const text = { fontSize: '15px', color: '#3d4852', lineHeight: '1.7', margin: '0 0 16px', textAlign: 'center' as const }

const codeBox = { textAlign: 'center' as const, margin: '24px 0', padding: '24px', backgroundColor: 'hsl(140, 20%, 96%)', borderRadius: '12px', border: '2px dashed hsl(152, 30%, 42%, 0.3)' }
const codeStyle = { fontFamily: "'Courier New', Courier, monospace", fontSize: '32px', fontWeight: 'bold' as const, color: 'hsl(152, 30%, 42%)', margin: '0', letterSpacing: '6px' }

const tipBox = { backgroundColor: 'hsl(140, 20%, 96%)', borderRadius: '8px', padding: '12px 16px', margin: '0 0 24px', borderLeft: '3px solid hsl(152, 30%, 42%)' }
const tipText = { fontSize: '13px', color: 'hsl(220, 10%, 46%)', margin: '0', lineHeight: '1.5' }
const divider = { borderColor: '#eef1ef', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 16px', lineHeight: '1.5', textAlign: 'center' as const }
const footerLinks = { textAlign: 'center' as const }
const footerLink = { color: '#bbbbbb', textDecoration: 'underline', fontSize: '12px' }
const footerDot = { color: '#bbbbbb', fontSize: '12px', display: 'inline' as const, margin: '0 4px' }

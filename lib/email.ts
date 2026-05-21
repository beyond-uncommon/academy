const RESEND_API_KEY = process.env.RESEND_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface EmailResponse {
  success: boolean
  error?: string
}

export async function sendStreakReminderEmail(
  email: string,
  name: string,
  currentStreak: number
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Mock Email] Streak reminder to ${email}: You're on a ${currentStreak}-day streak! Don't break it.`)
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Academy <noreply@academy.example.com>',
        to: email,
        subject: `🔥 Don't break your ${currentStreak}-day streak!`,
        html: getStreakReminderTemplate(name, currentStreak),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string,
  recommendedPath: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Mock Email] Welcome to ${email}: Your recommended path is ${recommendedPath}`)
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Academy <noreply@academy.example.com>',
        to: email,
        subject: 'Welcome to Academy! 🎉',
        html: getWelcomeTemplate(name, recommendedPath),
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendCourseCompletionEmail(
  email: string,
  name: string,
  courseName: string,
  certificateUrl: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Mock Email] Congratulations ${email}: You completed ${courseName}!`)
    return true
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Academy <noreply@academy.example.com>',
        to: email,
        subject: `🎉 Congratulations! You completed ${courseName}`,
        html: getCourseCompletionTemplate(name, courseName, certificateUrl),
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

function getStreakReminderTemplate(name: string, streak: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: #18181b; border-radius: 16px; padding: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
        <h1 style="margin: 0 0 16px; font-size: 24px;">Don't break your streak, ${name}!</h1>
        <p style="color: #a1a1aa; margin: 0 0 24px;">You're currently on a <strong style="color: #fff;">${streak}-day streak</strong>. Keep learning to maintain your momentum!</p>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Continue Learning</a>
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">See you on the leaderboard! 🚀</p>
      </div>
    </body>
    </html>
  `
}

function getWelcomeTemplate(name: string, recommendedPath: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: #18181b; border-radius: 16px; padding: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <h1 style="margin: 0 0 16px; font-size: 24px;">Welcome to Academy, ${name}!</h1>
        <p style="color: #a1a1aa; margin: 0 0 24px;">Based on your skill assessment, we recommend starting with the <strong style="color: #fff;">${recommendedPath}</strong> path.</p>
        <a href="${APP_URL}/courses" style="display: inline-block; background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start Learning</a>
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">Happy designing! 🎨</p>
      </div>
    </body>
    </html>
  `
}

function getCourseCompletionTemplate(name: string, courseName: string, certificateUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: #18181b; border-radius: 16px; padding: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
        <h1 style="margin: 0 0 16px; font-size: 24px;">Congratulations, ${name}!</h1>
        <p style="color: #a1a1aa; margin: 0 0 24px;">You've completed <strong style="color: #fff;">${courseName}</strong>! Your certificate is ready.</p>
        <a href="${certificateUrl}" style="display: inline-block; background: #fff; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Certificate</a>
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">Keep learning and growing! 🚀</p>
      </div>
    </body>
    </html>
  `
}

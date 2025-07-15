// src/lib/emailService.ts - VR Room Malta email service
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export interface BookingData {
  bookingId: string
  customerName: string
  email: string
  phone: string
  experience: string
  date: string
  time: string
  players: number
  amount?: number
}

export interface RegistrationEmailData {
  registrationId: string
  customerName: string
  email: string
  phone: string
  isEmsClient: boolean
  ticketCount: number
  finalAmount: number
  appliedCouponCode?: string
  tickets: any[]
}

export class EmailService {
  private static readonly FROM_EMAIL = 'no-reply@vrroommalta.com'
  private static readonly SUPPORT_EMAIL = 'info@vrroommalta.com'
  private static readonly PHONE = '+356 1234 5678'
  private static readonly ADDRESS = 'Bugibba, Malta'

  /**
   * Generate registration confirmation email HTML
   */
  private static generateRegistrationConfirmationHTML(data: RegistrationEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VR Booking Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; color: #374151;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: normal;">
            VR Room Malta
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
            ${data.finalAmount === 0 ? 'VR Booking Confirmed' : 'VR Booking - Payment Required'}
          </h2>
          
          <p style="color: #6b7280; margin: 0 0 20px 0; line-height: 1.6;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #6b7280; margin: 0 0 30px 0; line-height: 1.6;">
            ${data.finalAmount === 0 
              ? 'Your VR booking has been confirmed. We will contact you to schedule your session.'
              : 'Your VR booking has been received. Please complete payment to confirm your session.'}
          </p>

          <!-- Booking Details -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Booking Details:
            </h3>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Booking ID:</strong> ${data.registrationId}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Sessions:</strong> ${data.ticketCount}
            </p>
            ${data.finalAmount > 0 ? `
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Amount:</strong> €${(data.finalAmount / 100).toFixed(2)}
            </p>
            ` : ''}
            ${data.appliedCouponCode ? `
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Coupon Applied:</strong> ${data.appliedCouponCode}
            </p>
            ` : ''}
          </div>

          <!-- Next Steps -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Next Steps:
            </h3>
            ${data.finalAmount === 0 ? `
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • We will contact you to schedule your session
            </p>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Session tickets will be generated after scheduling
            </p>
            ` : `
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Complete payment to confirm your booking
            </p>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Session tickets will be sent after payment
            </p>
            `}
          </div>

          <!-- Contact -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">
              Questions? Contact us at ${this.PHONE} or ${this.SUPPORT_EMAIL}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 VR Room Malta. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Send registration confirmation email
   */
  static async sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
    try {
      const subject = 'VR Booking Confirmed - VR Room Malta'
      const htmlContent = this.generateRegistrationConfirmationHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Registration confirmation sent:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send registration confirmation:', error)
      return false
    }
  }

  /**
   * Send contact form submission confirmation
   */
  static async sendContactConfirmation(data: ContactFormData): Promise<boolean> {
    try {
      const subject = 'Message Received - VR Room Malta'
      const htmlContent = this.generateContactConfirmationHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Contact confirmation email sent:', {
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send contact confirmation:', error)
      return false
    }
  }

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmation(data: BookingData): Promise<boolean> {
    try {
      const subject = 'Booking Confirmed - VR Room Malta'
      const htmlContent = this.generateBookingConfirmationHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Booking confirmation sent:', {
        bookingId: data.bookingId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send booking confirmation:', error)
      return false
    }
  }

  /**
   * Send booking reminder email
   */
  static async sendBookingReminder(data: BookingData): Promise<boolean> {
    try {
      const subject = 'VR Experience Tomorrow - VR Room Malta'
      const htmlContent = this.generateBookingReminderHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Booking reminder sent:', {
        bookingId: data.bookingId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send booking reminder:', error)
      return false
    }
  }

  /**
   * Generate contact confirmation email HTML
   */
  private static generateContactConfirmationHTML(data: ContactFormData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; color: #374151;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: normal;">
            VR Room Malta
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
            Thank you for contacting us
          </h2>
          
          <p style="color: #6b7280; margin: 0 0 20px 0; line-height: 1.6;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #6b7280; margin: 0 0 20px 0; line-height: 1.6;">
            We have received your message and will get back to you within 24 hours.
          </p>

          <!-- Message Details -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Your Message:
            </h3>
            <p style="color: #6b7280; margin: 0; line-height: 1.6; font-style: italic;">
              "${data.message}"
            </p>
          </div>

          <!-- Contact Info -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Contact Information:
            </h3>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              Email: ${this.SUPPORT_EMAIL}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              Phone: ${this.PHONE}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              Location: ${this.ADDRESS}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 VR Room Malta. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Generate booking confirmation email HTML
   */
  private static generateBookingConfirmationHTML(data: BookingData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; color: #374151;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: normal;">
            VR Room Malta
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
            Booking Confirmed
          </h2>
          
          <p style="color: #6b7280; margin: 0 0 20px 0; line-height: 1.6;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #6b7280; margin: 0 0 30px 0; line-height: 1.6;">
            Your VR experience has been confirmed. See you soon!
          </p>

          <!-- Booking Details -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Booking Details:
            </h3>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Booking ID:</strong> ${data.bookingId}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Experience:</strong> ${data.experience}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Date:</strong> ${data.date}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Time:</strong> ${data.time}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Players:</strong> ${data.players}
            </p>
            ${data.amount ? `
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Amount:</strong> €${(data.amount / 100).toFixed(2)}
            </p>
            ` : ''}
          </div>

          <!-- Location Info -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Location:
            </h3>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              VR Room Malta
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              ${this.ADDRESS}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              Phone: ${this.PHONE}
            </p>
          </div>

          <!-- Important Notes -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Important:
            </h3>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Please arrive 10 minutes before your session
            </p>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Wear comfortable clothing and closed shoes
            </p>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Minimum age requirement: 12 years
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 VR Room Malta. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Generate booking reminder email HTML
   */
  private static generateBookingReminderHTML(data: BookingData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VR Experience Tomorrow</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb; color: #374151;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: normal;">
            VR Room Malta
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
            VR Experience Tomorrow
          </h2>
          
          <p style="color: #6b7280; margin: 0 0 20px 0; line-height: 1.6;">
            Hi ${data.customerName},
          </p>
          
          <p style="color: #6b7280; margin: 0 0 30px 0; line-height: 1.6;">
            Your VR experience is scheduled for tomorrow. Don't forget!
          </p>

          <!-- Booking Details -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Your Booking:
            </h3>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Experience:</strong> ${data.experience}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Date:</strong> ${data.date}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Time:</strong> ${data.time}
            </p>
            <p style="color: #6b7280; margin: 5px 0; line-height: 1.6;">
              <strong>Players:</strong> ${data.players}
            </p>
          </div>

          <!-- Reminder -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: normal;">
              Reminder:
            </h3>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Arrive 10 minutes early
            </p>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Wear comfortable clothing
            </p>
            <p style="color: #92400e; margin: 5px 0; line-height: 1.6;">
              • Bring your booking confirmation
            </p>
          </div>

          <!-- Contact -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">
              Questions? Contact us at ${this.PHONE}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 VR Room Malta. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }
}
// src/lib/emailService.ts - Plain text email service (NO COLORS)
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
  private static readonly VR_FROM_EMAIL = 'no-reply@vrroommalta.com'
  private static readonly VR_SUPPORT_EMAIL = 'vrroommalta@gmail.com'
  private static readonly VR_SUPPORT_PHONE = '+356 7961 7374'
  private static readonly VR_LOCATION_MAP = 'https://maps.app.goo.gl/xhuhq7nx4EgJwfBA6'

  /**
   * Generate plain text email HTML (NO COLORS, CLEAN)
   */
  private static generatePlainEmailHTML(title: string, content: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #333333; margin: 0; font-size: 24px; font-weight: normal;">
            VR Room Malta
          </h1>
          <p style="color: #666666; margin: 8px 0 0 0; font-size: 14px;">
            Virtual Reality Experiences | Bugibba Square
          </p>
        </div>

        <!-- Content -->
        <div style="margin-bottom: 40px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
          <p style="color: #666666; margin: 0 0 8px 0; font-size: 14px;">
            Contact us: ${this.VR_SUPPORT_EMAIL} | ${this.VR_SUPPORT_PHONE}
          </p>
          <p style="color: #999999; margin: 0 0 8px 0; font-size: 12px;">
            VR Room Malta - 50m from Bugibba Square
          </p>
          <p style="color: #999999; margin: 0; font-size: 12px;">
            <a href="${this.VR_LOCATION_MAP}" style="color: #666666; text-decoration: none;">
              View Location on Map
            </a>
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Send VR booking confirmation email - Plain text, clean design
   */
  static async sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
    try {
      const isFree = data.finalAmount === 0
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrroommalta.com'
      const statusUrl = `${baseUrl}/ticket-status?id=${data.registrationId}`
      
      const content = `
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
          VR Booking Received
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; font-size: 16px;">
          Thank you for your VR booking request. ${isFree 
            ? 'Your free booking has been received and will be processed by our team.'
            : 'Please complete payment to confirm your VR sessions.'}
        </p>

        <div style="background-color: #f8f8f8; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
          <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
            Booking Details
          </h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Booking ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>VR Sessions:</strong> ${data.ticketCount}</p>
          ${data.finalAmount > 0 ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Total Amount:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>` : ''}
          ${data.appliedCouponCode ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Discount Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
        </div>

        ${isFree ? `
        <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border: 1px solid #d0d0d0;">
          <p style="margin: 0; font-size: 15px;">
            <strong>What's Next:</strong><br>
            • Admin will review your free booking<br>
            • You will receive session tickets after approval<br>
            • Check your booking status anytime using the link below
          </p>
        </div>
        ` : `
        <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border: 1px solid #d0d0d0;">
          <p style="margin: 0; font-size: 15px;">
            <strong>Complete Your Payment:</strong><br>
            • Payment is required to confirm your booking<br>
            • VR session tickets will be sent immediately after payment<br>
            • Use the link below to check status and complete payment
          </p>
        </div>
        `}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${statusUrl}" style="display: inline-block; padding: 12px 24px; background-color: #333333; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px;">
            Check Booking Status
          </a>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
          <h4 style="color: #333333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
            VR Room Malta
          </h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5;">
            Location: 50m from Bugibba Square<br>
            Duration: Varies by experience<br>
            Phone: ${this.VR_SUPPORT_PHONE}<br>
            <a href="${this.VR_LOCATION_MAP}" style="color: #666666; text-decoration: none;">View on Map</a>
          </p>
        </div>
      `

      const subject = isFree 
        ? 'VR Booking Received - Awaiting Approval' 
        : 'VR Booking Received - Payment Required'
      
      const html = this.generatePlainEmailHTML(subject, content)
      
      const result = await resend.emails.send({
        from: this.VR_FROM_EMAIL,
        to: data.email,
        subject,
        html,
      })
      
      console.log('✅ VR booking confirmation sent:', {
        registrationId: data.registrationId,
        email: data.email,
        isFree,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send VR booking confirmation:', error)
      return false
    }
  }

  /**
   * Send VR session tickets with PDF attachment - Plain text design
   */
  static async sendTicketDelivery(data: RegistrationEmailData, pdfBuffer?: Buffer): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrroommalta.com'
      const statusUrl = `${baseUrl}/ticket-status?id=${data.registrationId}`
      
      // List all ticket numbers if available
      const ticketNumbers = data.tickets && data.tickets.length > 0 
        ? data.tickets.map(t => t.ticketNumber).join(', ')
        : 'Will be provided in PDF attachment'
      
      const content = `
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
          Your VR Session Tickets
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; font-size: 16px;">
          Your VR session tickets are ready! Your payment has been processed successfully.
        </p>

        <div style="background-color: #f8f8f8; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
          <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
            Session Details
          </h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Booking ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>VR Sessions:</strong> ${data.ticketCount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Amount Paid:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>
          ${data.appliedCouponCode ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Discount Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
        </div>

        <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border: 1px solid #d0d0d0;">
          <h4 style="color: #333333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
            Ticket Numbers:
          </h4>
          <p style="margin: 0; font-size: 14px; font-family: monospace; word-break: break-all;">
            ${ticketNumbers}
          </p>
        </div>

        <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border: 1px solid #d0d0d0;">
          <p style="margin: 0; font-size: 15px;">
            <strong>Important Instructions:</strong><br>
            • Show your tickets (PDF attachment) when you arrive<br>
            • Arrive 10 minutes before your session<br>
            • Wear comfortable clothing and closed shoes<br>
            • Contact us if you need to reschedule
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${statusUrl}" style="display: inline-block; padding: 12px 24px; background-color: #333333; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px;">
            View Booking Details
          </a>
        </div>

        <div style="background-color: #f8f8f8; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
          <h4 style="color: #333333; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
            VR Room Malta
          </h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.5;">
            Location: 50m from Bugibba Square<br>
            Phone: ${this.VR_SUPPORT_PHONE}<br>
            Email: ${this.VR_SUPPORT_EMAIL}<br>
            <a href="${this.VR_LOCATION_MAP}" style="color: #666666; text-decoration: none;">View on Map</a>
          </p>
        </div>
      `

      const subject = 'Your VR Session Tickets - VR Room Malta'
      const html = this.generatePlainEmailHTML(subject, content)
      
      const emailData: any = {
        from: this.VR_FROM_EMAIL,
        to: data.email,
        subject,
        html,
      }

      // Attach PDF tickets if provided
      if (pdfBuffer) {
        emailData.attachments = [{
          filename: `VR_Session_Tickets_${data.registrationId}.pdf`,
          content: pdfBuffer,
          type: 'application/pdf'
        }]
      }

      const result = await resend.emails.send(emailData)
      
      console.log('✅ VR tickets sent:', {
        registrationId: data.registrationId,
        email: data.email,
        hasPDF: !!pdfBuffer,
        ticketCount: data.ticketCount,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send VR tickets:', error)
      return false
    }
  }

  /**
   * Send VR payment confirmation - Plain text design
   */
  static async sendPaymentConfirmation(data: RegistrationEmailData, pdfBuffer?: Buffer): Promise<boolean> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrroommalta.com'
      const statusUrl = `${baseUrl}/ticket-status?id=${data.registrationId}`
      
      const content = `
        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px; font-weight: normal;">
          Payment Successful
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; font-size: 16px;">
          Your payment has been processed successfully! Your VR session tickets are attached to this email.
        </p>

        <div style="background-color: #f8f8f8; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
          <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
            Payment Confirmed
          </h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>VR Sessions:</strong> ${data.ticketCount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Amount Paid:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>
          ${data.appliedCouponCode ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Discount Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
        </div>

        <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border: 1px solid #d0d0d0;">
          <p style="margin: 0; font-size: 15px;">
            <strong>Your VR Sessions Are Ready:</strong><br>
            • Session tickets are attached as PDF<br>
            • Show tickets when you arrive at VR Room Malta<br>
            • Sessions are valid for 30 days from booking date<br>
            • Contact us to schedule your preferred time
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${statusUrl}" style="display: inline-block; padding: 12px 24px; background-color: #333333; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px;">
            View Full Booking Details
          </a>
        </div>
      `

      const subject = 'Payment Confirmed - VR Session Tickets Attached'
      const html = this.generatePlainEmailHTML(subject, content)
      
      const emailData: any = {
        from: this.VR_FROM_EMAIL,
        to: data.email,
        subject,
        html,
      }

      // Attach PDF tickets if provided
      if (pdfBuffer) {
        emailData.attachments = [{
          filename: `VR_Session_Tickets_${data.registrationId}.pdf`,
          content: pdfBuffer,
          type: 'application/pdf'
        }]
      }

      const result = await resend.emails.send(emailData)
      
      console.log('✅ VR payment confirmation sent:', {
        registrationId: data.registrationId,
        email: data.email,
        hasPDF: !!pdfBuffer,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send VR payment confirmation:', error)
      return false
    }
  }
}
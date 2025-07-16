// src/lib/emailService.ts - Clean, simple email service
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
  private static readonly FROM_EMAIL = 'no-reply@ems.com.mt'
  private static readonly VR_FROM_EMAIL = 'no-reply@vrroom.mt'
  private static readonly SUPPORT_EMAIL = 'info@ems.com.mt'
  private static readonly VR_SUPPORT_EMAIL = 'info@vrroom.mt'

  /**
   * Generate clean, simple email HTML
   */
  private static generateCleanHTML(
    title: string, 
    content: string, 
    isVR: boolean = false
  ): string {
    const brandName = isVR ? 'VR Room Malta' : 'EMS'
    const brandColor = isVR ? '#01AEED' : '#1f2937'
    const supportEmail = isVR ? this.VR_SUPPORT_EMAIL : this.SUPPORT_EMAIL
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: Arial, sans-serif; background-color: #f8f9fa; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: ${brandColor}; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: normal;">
            ${brandName}
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Need help? Contact us at ${supportEmail}
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Send registration confirmation email (VR booking confirmation)
   */
  static async sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
    try {
      const isVR = !data.isEmsClient // VR bookings are never EMS clients
      const isFree = data.finalAmount === 0
      
      const content = `
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">
          ${isFree ? 'VR Booking Confirmed' : 'VR Booking - Payment Required'}
        </h2>
        
        <p style="margin: 0 0 20px 0; line-height: 1.5;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; line-height: 1.5;">
          ${isFree 
            ? 'Your VR booking has been confirmed. We will contact you to schedule your session.'
            : 'Your VR booking has been received. Please complete payment to confirm your session.'}
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Booking Details</h3>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Booking ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Sessions:</strong> ${data.ticketCount}</p>
          ${data.finalAmount > 0 ? `<p style="margin: 5px 0; line-height: 1.5;"><strong>Amount:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>` : ''}
          ${data.appliedCouponCode ? `<p style="margin: 5px 0; line-height: 1.5;"><strong>Coupon:</strong> ${data.appliedCouponCode}</p>` : ''}
        </div>

        ${isFree ? `
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #2d5a2d; line-height: 1.5;">
            <strong>Next Steps:</strong><br>
            • We will contact you to schedule your session<br>
            • Session tickets will be generated after scheduling
          </p>
        </div>
        ` : `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; line-height: 1.5;">
            <strong>Next Steps:</strong><br>
            • Complete payment to confirm your booking<br>
            • Session tickets will be sent after payment
          </p>
        </div>
        `}
      `

      const subject = isFree ? 'VR Booking Confirmed - VR Room Malta' : 'VR Booking - Payment Required'
      const html = this.generateCleanHTML(subject, content, true)
      
      const result = await resend.emails.send({
        from: this.VR_FROM_EMAIL,
        to: data.email,
        subject,
        html,
      })
      
      console.log('✅ VR registration confirmation sent:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send VR registration confirmation:', error)
      return false
    }
  }

  /**
   * Send ticket delivery email (for VR sessions or EMS tickets)
   */
  static async sendTicketDelivery(data: RegistrationEmailData, pdfBuffer?: Buffer): Promise<boolean> {
    try {
      const isVR = !data.isEmsClient
      const ticketLabel = isVR ? 'Session Tickets' : 'Event Tickets'
      
      const content = `
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">
          Your ${ticketLabel} Are Ready!
        </h2>
        
        <p style="margin: 0 0 20px 0; line-height: 1.5;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; line-height: 1.5;">
          ${isVR 
            ? 'Your VR session tickets are attached. Show these tickets when you arrive for your session.'
            : 'Your event tickets are attached. Please bring valid ID and these tickets to the event.'}
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Ticket Details</h3>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Booking ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>${isVR ? 'Sessions' : 'Tickets'}:</strong> ${data.ticketCount}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Total Paid:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>
          ${data.appliedCouponCode ? `<p style="margin: 5px 0; line-height: 1.5;"><strong>Coupon Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
        </div>

        ${isVR ? `
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #2d5a2d; line-height: 1.5;">
            <strong>VR Room Malta:</strong><br>
            • Location: Bugibba Square, Malta<br>
            • Arrive 10 minutes early<br>
            • Bring comfortable clothing<br>
            • Minimum age: 8 years
          </p>
        </div>
        ` : `
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #2d5a2d; line-height: 1.5;">
            <strong>EMS Trade Fair 2025:</strong><br>
            • Location: MFCC, Ta' Qali, Malta<br>
            • Dates: June 26 - July 6, 2025<br>
            • Bring valid ID<br>
            • Tickets are non-transferable
          </p>
        </div>
        `}
      `

      const subject = `${ticketLabel} - ${isVR ? 'VR Room Malta' : 'EMS Trade Fair'}`
      const html = this.generateCleanHTML(subject, content, isVR)
      
      const emailData: any = {
        from: isVR ? this.VR_FROM_EMAIL : this.FROM_EMAIL,
        to: data.email,
        subject,
        html,
      }

      // Attach PDF if provided
      if (pdfBuffer) {
        const filename = isVR 
          ? `VR_Sessions_${data.registrationId}.pdf`
          : `EMS_Tickets_${data.registrationId}.pdf`
        
        emailData.attachments = [{
          filename,
          content: pdfBuffer,
          type: 'application/pdf'
        }]
      }

      const result = await resend.emails.send(emailData)
      
      console.log('✅ Ticket delivery email sent:', {
        registrationId: data.registrationId,
        email: data.email,
        isVR,
        hasPDF: !!pdfBuffer,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send ticket delivery email:', error)
      return false
    }
  }

  /**
   * Send payment confirmation email (for completed payments)
   */
  static async sendPaymentConfirmation(data: RegistrationEmailData, pdfBuffer?: Buffer): Promise<boolean> {
    try {
      const isVR = !data.isEmsClient
      
      const content = `
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">
          Payment Successful!
        </h2>
        
        <p style="margin: 0 0 20px 0; line-height: 1.5;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; line-height: 1.5;">
          Your payment has been processed successfully. ${isVR ? 'Your VR session tickets' : 'Your event tickets'} are attached.
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Payment Summary</h3>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Order ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>${isVR ? 'Sessions' : 'Tickets'}:</strong> ${data.ticketCount}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Amount Paid:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>
          ${data.appliedCouponCode ? `<p style="margin: 5px 0; line-height: 1.5;"><strong>Discount Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
        </div>

        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #2d5a2d; line-height: 1.5;">
            <strong>What's Next:</strong><br>
            ${isVR 
              ? '• Your VR session tickets are attached<br>• We will contact you to schedule your sessions<br>• Arrive 10 minutes early for your appointment'
              : '• Your event tickets are attached<br>• Save these tickets on your phone or print them<br>• Bring valid ID to the event'
            }
          </p>
        </div>
      `

      const subject = `Payment Confirmed - ${isVR ? 'VR Room Malta' : 'EMS Trade Fair'}`
      const html = this.generateCleanHTML(subject, content, isVR)
      
      const emailData: any = {
        from: isVR ? this.VR_FROM_EMAIL : this.FROM_EMAIL,
        to: data.email,
        subject,
        html,
      }

      // Attach PDF if provided
      if (pdfBuffer) {
        const filename = isVR 
          ? `VR_Sessions_${data.registrationId}.pdf`
          : `EMS_Tickets_${data.registrationId}.pdf`
        
        emailData.attachments = [{
          filename,
          content: pdfBuffer,
          type: 'application/pdf'
        }]
      }

      const result = await resend.emails.send(emailData)
      
      console.log('✅ Payment confirmation email sent:', {
        registrationId: data.registrationId,
        email: data.email,
        isVR,
        hasPDF: !!pdfBuffer,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send payment confirmation email:', error)
      return false
    }
  }

  /**
   * Send EMS registration received email (for EMS clients awaiting approval)
   */
  static async sendEmsRegistrationReceived(data: RegistrationEmailData): Promise<boolean> {
    try {
      const content = `
        <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">
          EMS Registration Received
        </h2>
        
        <p style="margin: 0 0 20px 0; line-height: 1.5;">
          Hi ${data.customerName},
        </p>
        
        <p style="margin: 0 0 25px 0; line-height: 1.5;">
          We have received your EMS registration. Our team will review your application and contact you within 1-2 business days.
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">Registration Details</h3>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Registration ID:</strong> ${data.registrationId}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Requested Tickets:</strong> ${data.ticketCount}</p>
          <p style="margin: 5px 0; line-height: 1.5;"><strong>Status:</strong> Under Review</p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; line-height: 1.5;">
            <strong>Next Steps:</strong><br>
            • Our team will verify your EMS client status<br>
            • You will receive an email with approval status<br>
            • Approved tickets will be sent directly to you
          </p>
        </div>
      `

      const subject = 'EMS Registration Received - Under Review'
      const html = this.generateCleanHTML(subject, content, false)
      
      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html,
      })
      
      console.log('✅ EMS registration received email sent:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('❌ Failed to send EMS registration received email:', error)
      return false
    }
  }
}
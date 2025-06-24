// src/lib/emailService.ts - Complete email service with Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTicketData {
  ticketNumber: string
  customerName: string
  email: string
  phone: string
  qrCode: string
  sequence: number
  totalTickets: number
  isEmsClient: boolean
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
  tickets: EmailTicketData[]
}

export class EmailService {
  private static readonly FROM_EMAIL = 'no-reply@emstickets.com'
  private static readonly SUPPORT_EMAIL = 'info@ems.com.mt'
  private static readonly PHONE = '+356 2755 5597'
  
  // Event details
  private static readonly EVENT_DATES = 'June 26 - July 6, 2025'
  private static readonly VENUE = 'MFCC, Ta\' Qali, Malta'
  private static readonly TIME = '6pm onwards'

  /**
   * Send registration confirmation email with tickets (for EMS clients)
   */
  static async sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
    try {
      const subject = data.isEmsClient 
        ? '🎫 Your EMS VIP Tickets - Registration Approved!'
        : '🎫 Registration Successful - Payment Required'

      const htmlContent = this.generateRegistrationEmailHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Registration email sent successfully:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send registration email:', error)
      return false
    }
  }

  /**
   * Send payment confirmation email with tickets (for public customers)
   */
  static async sendPaymentConfirmation(data: RegistrationEmailData, pdfBuffer?: Buffer): Promise<boolean> {
    try {
      const subject = '🎉 Payment Successful - Your EMS Tickets Are Ready!'
      const htmlContent = this.generatePaymentConfirmationHTML(data)
      
      const emailData: any = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      // Attach PDF if provided
      if (pdfBuffer) {
        emailData.attachments = [{
          filename: `EMS_Tickets_${data.customerName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
        }]
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Payment confirmation email sent successfully:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error)
      return false
    }
  }

  /**
   * Send event reminder email
   */
  static async sendEventReminder(data: RegistrationEmailData): Promise<boolean> {
    try {
      const subject = '🚨 Reminder: EMS Event Starts Tomorrow!'
      const htmlContent = this.generateEventReminderHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('Event reminder sent successfully:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send event reminder:', error)
      return false
    }
  }

  /**
   * Generate registration confirmation email HTML
   */
  private static generateRegistrationEmailHTML(data: RegistrationEmailData): string {
    const ticketRows = data.tickets.map(ticket => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-family: monospace; font-weight: bold; color: #1f2937;">${ticket.ticketNumber}</td>
        <td style="padding: 12px; text-align: center; color: #6b7280;">${ticket.sequence}/${ticket.totalTickets}</td>
      </tr>
    `).join('')

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EMS Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            🎫 EMS TICKETS
          </h1>
          <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">
            ${data.isEmsClient ? 'VIP Registration Approved!' : 'Registration Successful!'}
          </p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px 20px; text-align: center; background-color: #f0fdf4; border-bottom: 3px solid #22c55e;">
          <h2 style="color: #15803d; margin: 0 0 10px 0; font-size: 24px;">
            ${data.isEmsClient ? '✅ Welcome, VIP Customer!' : '✅ Registration Complete!'}
          </h2>
          <p style="color: #166534; margin: 0; font-size: 16px;">
            ${data.isEmsClient 
              ? 'Your complimentary tickets have been generated and are ready for use.' 
              : 'Please proceed with payment to receive your tickets.'}
          </p>
        </div>

        <!-- Customer Info -->
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            👤 Customer Information
          </h3>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> ${data.customerName}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Phone:</strong> ${data.phone}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Ticket Count:</strong> ${data.ticketCount}</p>
            ${data.appliedCouponCode ? `<p style="margin: 5px 0; color: #059669;"><strong>Coupon Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
          </div>
        </div>

        ${data.isEmsClient ? `
        <!-- Ticket Details for EMS Clients -->
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            🎫 Your Tickets
          </h3>
          <div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #fbbf24;">
                  <th style="padding: 12px; text-align: left; color: #92400e; font-weight: bold;">Ticket Number</th>
                  <th style="padding: 12px; text-align: center; color: #92400e; font-weight: bold;">Sequence</th>
                </tr>
              </thead>
              <tbody>
                ${ticketRows}
              </tbody>
            </table>
          </div>
          <p style="color: #92400e; font-size: 14px; margin: 10px 0 0 0; text-align: center;">
            💡 <strong>Keep these ticket numbers handy for verification at the event</strong>
          </p>
        </div>
        ` : ''}

        <!-- Event Information -->
        <div style="padding: 20px; background-color: #f8fafc;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            📅 Event Information
          </h3>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">📅</span>
              <span style="color: #374151; font-weight: bold;">${this.EVENT_DATES}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">📍</span>
              <span style="color: #374151;">${this.VENUE}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">🕕</span>
              <span style="color: #374151;">${this.TIME}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-size: 18px; margin-right: 10px;">🏢</span>
              <span style="color: #374151;">EMS Booth - Main Hall</span>
            </div>
          </div>
        </div>

        <!-- Important Notes -->
        <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
          <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Notes</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Bring a valid ID for verification</li>
            <li>Tickets are non-transferable</li>
            <li>Event starts at 6pm daily</li>
            <li>Free parking available on-site</li>
          </ul>
        </div>

        <!-- Support Section -->
        <div style="padding: 20px; background-color: #f1f5f9; text-align: center;">
          <h4 style="color: #475569; margin: 0 0 10px 0;">Need Help?</h4>
          <p style="color: #64748b; margin: 0 0 10px 0;">Our support team is here to assist you</p>
          <div style="margin: 10px 0;">
            <a href="mailto:${this.SUPPORT_EMAIL}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">
              📧 ${this.SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <span style="color: #64748b;">📞 ${this.PHONE}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background-color: #1f2937; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 EMS Tickets. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
            This email was sent to ${data.email}
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Generate payment confirmation email HTML
   */
  private static generatePaymentConfirmationHTML(data: RegistrationEmailData): string {
    const ticketRows = data.tickets.map(ticket => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-family: monospace; font-weight: bold; color: #1f2937;">${ticket.ticketNumber}</td>
        <td style="padding: 12px; text-align: center; color: #6b7280;">${ticket.sequence}/${ticket.totalTickets}</td>
      </tr>
    `).join('')

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EMS Payment Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            🎉 PAYMENT SUCCESS!
          </h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">
            Your EMS tickets are ready!
          </p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px 20px; text-align: center; background-color: #ecfdf5; border-bottom: 3px solid #10b981;">
          <h2 style="color: #047857; margin: 0 0 10px 0; font-size: 24px;">
            ✅ Payment Confirmed - €${(data.finalAmount / 100).toFixed(2)}
          </h2>
          <p style="color: #065f46; margin: 0; font-size: 16px;">
            Your tickets have been generated and are attached to this email.
          </p>
        </div>

        <!-- Customer Info -->
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            👤 Customer Information
          </h3>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; color: #374151;"><strong>Name:</strong> ${data.customerName}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Phone:</strong> ${data.phone}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Tickets:</strong> ${data.ticketCount}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Amount Paid:</strong> €${(data.finalAmount / 100).toFixed(2)}</p>
            ${data.appliedCouponCode ? `<p style="margin: 5px 0; color: #059669;"><strong>Coupon Applied:</strong> ${data.appliedCouponCode}</p>` : ''}
          </div>
        </div>

        <!-- Ticket Details -->
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            🎫 Your Tickets
          </h3>
          <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #3b82f6;">
                  <th style="padding: 12px; text-align: left; color: #ffffff; font-weight: bold;">Ticket Number</th>
                  <th style="padding: 12px; text-align: center; color: #ffffff; font-weight: bold;">Sequence</th>
                </tr>
              </thead>
              <tbody>
                ${ticketRows}
              </tbody>
            </table>
          </div>
          <div style="background-color: #fef3c7; padding: 15px; margin-top: 15px; border-radius: 8px; border: 1px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; text-align: center; font-weight: bold;">
              📎 Your tickets are attached as a PDF file to this email
            </p>
          </div>
        </div>

        <!-- Event Information -->
        <div style="padding: 20px; background-color: #f8fafc;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            📅 Event Information
          </h3>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">📅</span>
              <span style="color: #374151; font-weight: bold;">${this.EVENT_DATES}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">📍</span>
              <span style="color: #374151;">${this.VENUE}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">🕕</span>
              <span style="color: #374151;">${this.TIME}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-size: 18px; margin-right: 10px;">🏢</span>
              <span style="color: #374151;">EMS Booth - Main Hall</span>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div style="padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
          <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">📋 What's Next?</h4>
          <ol style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Print your tickets or save them on your mobile device</li>
            <li>Bring a valid ID for verification at the event</li>
            <li>Arrive at the venue during event hours</li>
            <li>Present your tickets at the EMS Booth for check-in</li>
          </ol>
        </div>

        <!-- Support Section -->
        <div style="padding: 20px; background-color: #f1f5f9; text-align: center;">
          <h4 style="color: #475569; margin: 0 0 10px 0;">Need Help?</h4>
          <p style="color: #64748b; margin: 0 0 10px 0;">Our support team is here to assist you</p>
          <div style="margin: 10px 0;">
            <a href="mailto:${this.SUPPORT_EMAIL}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">
              📧 ${this.SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <span style="color: #64748b;">📞 ${this.PHONE}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background-color: #1f2937; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            © 2025 EMS Tickets. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">
            This email was sent to ${data.email}
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }

  /**
   * Generate event reminder email HTML
   */
  private static generateEventReminderHTML(data: RegistrationEmailData): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EMS Event Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
            🚨 EVENT REMINDER
          </h1>
          <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">
            Don't forget about the EMS event!
          </p>
        </div>

        <!-- Reminder Message -->
        <div style="padding: 30px 20px; text-align: center; background-color: #fef2f2; border-bottom: 3px solid #ef4444;">
          <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 24px;">
            🗓️ Event Starts Tomorrow!
          </h2>
          <p style="color: #991b1b; margin: 0; font-size: 16px;">
            Hi ${data.customerName}, don't miss your EMS event experience!
          </p>
        </div>

        <!-- Event Information -->
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            📅 Event Details
          </h3>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">📅</span>
              <span style="color: #374151; font-weight: bold;">${this.EVENT_DATES}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">📍</span>
              <span style="color: #374151;">${this.VENUE}</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 18px; margin-right: 10px;">🕕</span>
              <span style="color: #374151;">${this.TIME}</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-size: 18px; margin-right: 10px;">🏢</span>
              <span style="color: #374151;">EMS Booth - Main Hall</span>
            </div>
          </div>
        </div>

        <!-- Preparation Checklist -->
        <div style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e;">
          <h4 style="color: #15803d; margin: 0 0 10px 0; font-size: 16px;">✅ Preparation Checklist</h4>
          <ul style="color: #166534; margin: 0; padding-left: 20px;">
            <li>Have your tickets ready (digital or printed)</li>
            <li>Bring a valid photo ID</li>
            <li>Plan your transportation to Ta' Qali</li>
            <li>Arrive by 6pm for the best experience</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background-color: #1f2937; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            See you tomorrow at the EMS event!
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }
}
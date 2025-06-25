// src/lib/emailService.ts - Complete email service with EMS approval flow
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
   * ✅ NEW: Send EMS registration received email (no tickets, awaiting approval)
   */
  static async sendEmsRegistrationReceived(data: RegistrationEmailData): Promise<boolean> {
    try {
      const subject = '📝 EMS Registration Received - Under Review'
      const htmlContent = this.generateEmsRegistrationReceivedHTML(data)
      
      const emailData = {
        from: this.FROM_EMAIL,
        to: data.email,
        subject,
        html: htmlContent,
      }

      const result = await resend.emails.send(emailData)
      
      console.log('EMS registration received email sent successfully:', {
        registrationId: data.registrationId,
        email: data.email,
        messageId: result.data?.id
      })

      return true
    } catch (error) {
      console.error('Failed to send EMS registration received email:', error)
      return false
    }
  }

  /**
   * Send registration confirmation email with tickets (for EMS clients AFTER approval)
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
   * ✅ NEW: Generate EMS registration received email HTML (awaiting approval)
   */
  private static generateEmsRegistrationReceivedHTML(data: RegistrationEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EMS Registration Received</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; border-radius: 0;">
          <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">📝</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            EMS REGISTRATION
          </h1>
          <p style="color: #fed7aa; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
            Registration Received - Under Review
          </p>
        </div>

        <!-- Status Message -->
        <div style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-bottom: 4px solid #f59e0b;">
          <div style="background: #f59e0b; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px;">⏳</span>
          </div>
          <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 28px; font-weight: 700;">
            Thank You for Your Registration!
          </h2>
          <p style="color: #b45309; margin: 0; font-size: 18px; line-height: 1.6;">
            Your EMS registration has been received and is currently being reviewed by our admin team.
          </p>
        </div>

        <!-- Customer Info -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 600; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px;">
            👤 Registration Details
          </h3>
          <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 25px; border-radius: 12px; border-left: 6px solid #f59e0b;">
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(251, 191, 36, 0.2);">
                <span style="color: #92400e; font-weight: 600;">Name:</span>
                <span style="color: #374151; font-weight: 500;">${data.customerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(251, 191, 36, 0.2);">
                <span style="color: #92400e; font-weight: 600;">Email:</span>
                <span style="color: #374151; font-weight: 500;">${data.email}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(251, 191, 36, 0.2);">
                <span style="color: #92400e; font-weight: 600;">Phone:</span>
                <span style="color: #374151; font-weight: 500;">${data.phone}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(251, 191, 36, 0.2);">
                <span style="color: #92400e; font-weight: 600;">Requested Tickets:</span>
                <span style="color: #374151; font-weight: 500;">${data.ticketCount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #92400e; font-weight: 600;">Customer Type:</span>
                <span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">EMS VIP</span>
              </div>
            </div>
          </div>
        </div>

        <!-- What Happens Next -->
        <div style="padding: 40px 30px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">
          <h4 style="color: #0369a1; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: #0ea5e9; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🔄</span>
            What Happens Next?
          </h4>
          <div style="space-y: 20px;">
            <div style="display: flex; align-items: start; margin-bottom: 16px;">
              <div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; font-weight: bold; flex-shrink: 0;">1</div>
              <div>
                <strong style="color: #0c4a6e;">Review Process:</strong>
                <span style="color: #0369a1;"> Our admin team will review your registration details</span>
              </div>
            </div>
            <div style="display: flex; align-items: start; margin-bottom: 16px;">
              <div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; font-weight: bold; flex-shrink: 0;">2</div>
              <div>
                <strong style="color: #0c4a6e;">Verification:</strong>
                <span style="color: #0369a1;"> We may contact you if we need additional information</span>
              </div>
            </div>
            <div style="display: flex; align-items: start; margin-bottom: 16px;">
              <div style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; font-weight: bold; flex-shrink: 0;">3</div>
              <div>
                <strong style="color: #0c4a6e;">Approval:</strong>
                <span style="color: #0369a1;"> Once approved, your VIP tickets will be generated automatically</span>
              </div>
            </div>
            <div style="display: flex; align-items: start;">
              <div style="background: #22c55e; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; font-weight: bold; flex-shrink: 0;">4</div>
              <div>
                <strong style="color: #0c4a6e;">Ticket Delivery:</strong>
                <span style="color: #0369a1;"> You'll receive your tickets via email (usually within 1-2 business days)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Important Notice -->
        <div style="padding: 40px 30px; background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);">
          <h4 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">⚠️</span>
            Important Notice
          </h4>
          <div style="background: rgba(255,255,255,0.6); padding: 20px; border-radius: 8px; border: 2px solid #f59e0b;">
            <ul style="color: #92400e; margin: 0; padding-left: 0; list-style: none;">
              <li style="margin-bottom: 12px; display: flex; align-items: center;">
                <span style="color: #22c55e; margin-right: 10px; font-size: 18px;">✓</span>
                <strong>No payment required</strong> - EMS customers receive complimentary tickets
              </li>
              <li style="margin-bottom: 12px; display: flex; align-items: start;">
                <span style="color: #3b82f6; margin-right: 10px; font-size: 18px; margin-top: 2px;">📋</span>
                <div>
                  <strong>Registration ID:</strong> 
                  <code style="background: rgba(0,0,0,0.1); padding: 6px 12px; border-radius: 6px; font-family: monospace; margin-left: 8px;">${data.registrationId}</code>
                </div>
              </li>
              <li style="margin-bottom: 12px; display: flex; align-items: center;">
                <span style="color: #f59e0b; margin-right: 10px; font-size: 18px;">⏳</span>
                <strong>Status:</strong> Pending Admin Approval
              </li>
              <li style="display: flex; align-items: center;">
                <span style="color: #8b5cf6; margin-right: 10px; font-size: 18px;">📧</span>
                You will receive a separate email with your tickets once approved
              </li>
            </ul>
          </div>
        </div>

        <!-- Event Information -->
        <div style="padding: 40px 30px; background-color: #f8fafc;">
          <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 600; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px;">
            📅 Event Information
          </h3>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="display: grid; gap: 20px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f0f9ff; border-radius: 8px;">
                <span style="font-size: 24px; margin-right: 15px;">📅</span>
                <div>
                  <div style="color: #1e40af; font-weight: 600; font-size: 16px;">Event Dates</div>
                  <div style="color: #374151; font-weight: 500;">${this.EVENT_DATES}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 8px;">
                <span style="font-size: 24px; margin-right: 15px;">📍</span>
                <div>
                  <div style="color: #166534; font-weight: 600; font-size: 16px;">Venue</div>
                  <div style="color: #374151; font-weight: 500;">${this.VENUE}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #fef3c7; border-radius: 8px;">
                <span style="font-size: 24px; margin-right: 15px;">🕕</span>
                <div>
                  <div style="color: #92400e; font-weight: 600; font-size: 16px;">Time</div>
                  <div style="color: #374151; font-weight: 500;">${this.TIME}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #fdf2f8; border-radius: 8px;">
                <span style="font-size: 24px; margin-right: 15px;">🏢</span>
                <div>
                  <div style="color: #be185d; font-weight: 600; font-size: 16px;">Location</div>
                  <div style="color: #374151; font-weight: 500;">EMS Booth - Main Hall</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div style="padding: 40px 30px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); text-align: center;">
          <h4 style="color: #475569; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Questions About Your Registration?</h4>
          <p style="color: #64748b; margin: 0 0 25px 0; font-size: 16px;">Our support team is available to help</p>
          <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
            <a href="mailto:${this.SUPPORT_EMAIL}" style="color: #3b82f6; text-decoration: none; font-weight: 600; display: flex; align-items: center; background: white; padding: 12px 24px; border-radius: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 18px; margin-right: 8px;">📧</span>
              ${this.SUPPORT_EMAIL}
            </a>
            <div style="color: #64748b; font-weight: 600; display: flex; align-items: center; background: white; padding: 12px 24px; border-radius: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 18px; margin-right: 8px;">📞</span>
              ${this.PHONE}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 30px; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 16px; font-weight: 500;">
            © 2025 EMS Tickets. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
            This email was sent to ${data.email}
          </p>
        </div>

      </div>
    </body>
    </html>
    `
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
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center;">
          <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🎉</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            PAYMENT SUCCESS!
          </h1>
          <p style="color: #d1fae5; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
            Your EMS tickets are ready!
          </p>
        </div>

        <!-- Success Message -->
        <div style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-bottom: 4px solid #10b981;">
          <div style="background: #22c55e; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px;">✅</span>
          </div>
          <h2 style="color: #047857; margin: 0 0 15px 0; font-size: 28px; font-weight: 700;">
            Payment Confirmed - €${(data.finalAmount / 100).toFixed(2)}
          </h2>
          <p style="color: #065f46; margin: 0; font-size: 18px; line-height: 1.6;">
            Your tickets have been generated and are attached to this email.
          </p>
        </div>

        <!-- Customer Info -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 600; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px;">
            👤 Customer Information
          </h3>
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; border-left: 6px solid #10b981;">
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                <span style="color: #047857; font-weight: 600;">Name:</span>
                <span style="color: #374151; font-weight: 500;">${data.customerName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                <span style="color: #047857; font-weight: 600;">Email:</span>
                <span style="color: #374151; font-weight: 500;">${data.email}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                <span style="color: #047857; font-weight: 600;">Phone:</span>
                <span style="color: #374151; font-weight: 500;">${data.phone}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                <span style="color: #047857; font-weight: 600;">Tickets:</span>
                <span style="color: #374151; font-weight: 500;">${data.ticketCount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #047857; font-weight: 600;">Amount Paid:</span>
                <span style="background: #22c55e; color: white; padding: 6px 16px; border-radius: 20px; font-weight: 600;">€${(data.finalAmount / 100).toFixed(2)}</span>
              </div>
              ${data.appliedCouponCode ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                <span style="color: #047857; font-weight: 600;">Coupon Applied:</span>
                <span style="background: #059669; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">${data.appliedCouponCode}</span>
              </div>` : ''}
            </div>
          </div>
        </div>

        <!-- Ticket Details -->
        <div style="padding: 40px 30px; background-color: #f8fafc;">
          <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 600; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px;">
            🎫 Your Tickets
          </h3>
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                  <th style="padding: 16px; text-align: left; color: #ffffff; font-weight: 600; font-size: 16px;">Ticket Number</th>
                  <th style="padding: 16px; text-align: center; color: #ffffff; font-weight: 600; font-size: 16px;">Sequence</th>
                </tr>
              </thead>
              <tbody>
                ${ticketRows}
              </tbody>
            </table>
          </div>
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; margin-top: 20px; border-radius: 12px; border: 2px solid #f59e0b; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
              <span style="font-size: 24px; margin-right: 10px;">📎</span>
              <strong style="color: #92400e; font-size: 18px;">Your tickets are attached as a PDF file to this email</strong>
            </div>
            <p style="color: #b45309; margin: 0; font-size: 14px;">Download and save the PDF for easy access at the event</p>
          </div>
        </div>

        <!-- Event Information -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 600; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px;">
            📅 Event Information
          </h3>
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="display: grid; gap: 20px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <span style="font-size: 24px; margin-right: 15px;">📅</span>
                <div>
                  <div style="color: #1e40af; font-weight: 600; font-size: 16px;">Event Dates</div>
                  <div style="color: #374151; font-weight: 500;">${this.EVENT_DATES}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                <span style="font-size: 24px; margin-right: 15px;">📍</span>
                <div>
                  <div style="color: #16a34a; font-weight: 600; font-size: 16px;">Venue</div>
                  <div style="color: #374151; font-weight: 500;">${this.VENUE}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <span style="font-size: 24px; margin-right: 15px;">🕕</span>
                <div>
                  <div style="color: #d97706; font-weight: 600; font-size: 16px;">Time</div>
                  <div style="color: #374151; font-weight: 500;">${this.TIME}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: #fdf2f8; border-radius: 8px; border-left: 4px solid #ec4899;">
                <span style="font-size: 24px; margin-right: 15px;">🏢</span>
                <div>
                  <div style="color: #be185d; font-weight: 600; font-size: 16px;">Location</div>
                  <div style="color: #374151; font-weight: 500;">EMS Booth - Main Hall</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div style="padding: 40px 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
          <h4 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">📋</span>
            What's Next?
          </h4>
          <div style="background: rgba(255,255,255,0.6); padding: 25px; border-radius: 12px; border: 2px solid #f59e0b;">
            <ol style="color: #92400e; margin: 0; padding-left: 0; list-style: none; counter-reset: step-counter;">
              <li style="margin-bottom: 15px; padding-left: 40px; position: relative; counter-increment: step-counter;">
                <span style="position: absolute; left: 0; top: 0; background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${'1'}</span>
                <strong>Print your tickets</strong> or save them on your mobile device
              </li>
              <li style="margin-bottom: 15px; padding-left: 40px; position: relative; counter-increment: step-counter;">
                <span style="position: absolute; left: 0; top: 0; background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${'2'}</span>
                <strong>Bring a valid ID</strong> for verification at the event
              </li>
              <li style="margin-bottom: 15px; padding-left: 40px; position: relative; counter-increment: step-counter;">
                <span style="position: absolute; left: 0; top: 0; background: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${'3'}</span>
                <strong>Arrive at the venue</strong> during event hours
              </li>
              <li style="padding-left: 40px; position: relative; counter-increment: step-counter;">
                <span style="position: absolute; left: 0; top: 0; background: #22c55e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${'4'}</span>
                <strong>Present your tickets</strong> at the EMS Booth for check-in
              </li>
            </ol>
          </div>
        </div>

        <!-- Support Section -->
        <div style="padding: 40px 30px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); text-align: center;">
          <h4 style="color: #475569; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Need Help?</h4>
          <p style="color: #64748b; margin: 0 0 25px 0; font-size: 16px;">Our support team is available to help</p>
          <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
            <a href="mailto:${this.SUPPORT_EMAIL}" style="color: #3b82f6; text-decoration: none; font-weight: 600; display: flex; align-items: center; background: white; padding: 12px 24px; border-radius: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 18px; margin-right: 8px;">📧</span>
              ${this.SUPPORT_EMAIL}
            </a>
            <div style="color: #64748b; font-weight: 600; display: flex; align-items: center; background: white; padding: 12px 24px; border-radius: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <span style="font-size: 18px; margin-right: 8px;">📞</span>
              ${this.PHONE}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 30px; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 16px; font-weight: 500;">
            © 2025 EMS Tickets. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
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
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EMS Event Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
          <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🚨</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            EVENT REMINDER
          </h1>
          <p style="color: #fecaca; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
            Don't forget about the EMS event!
          </p>
        </div>

        <!-- Reminder Message -->
        <div style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border-bottom: 4px solid #ef4444;">
          <div style="background: #ef4444; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px;">🗓️</span>
          </div>
          <h2 style="color: #dc2626; margin: 0 0 15px 0; font-size: 28px; font-weight: 700;">
            Event Starts Tomorrow!
          </h2>
          <p style="color: #991b1b; margin: 0; font-size: 18px; line-height: 1.6;">
            Hi ${data.customerName}, don't miss your EMS event experience!
          </p>
        </div>

        <!-- Event Information -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 600; border-bottom: 3px solid #e5e7eb; padding-bottom: 12px;">
            📅 Event Details
          </h3>
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 30px; border-radius: 12px; border: 2px solid #fecaca; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="display: grid; gap: 20px;">
              <div style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 4px solid #ef4444;">
                <span style="font-size: 24px; margin-right: 15px;">📅</span>
                <div>
                  <div style="color: #dc2626; font-weight: 600; font-size: 16px;">Event Dates</div>
                  <div style="color: #374151; font-weight: 500;">${this.EVENT_DATES}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 4px solid #f59e0b;">
                <span style="font-size: 24px; margin-right: 15px;">📍</span>
                <div>
                  <div style="color: #d97706; font-weight: 600; font-size: 16px;">Venue</div>
                  <div style="color: #374151; font-weight: 500;">${this.VENUE}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 4px solid #8b5cf6;">
                <span style="font-size: 24px; margin-right: 15px;">🕕</span>
                <div>
                  <div style="color: #7c3aed; font-weight: 600; font-size: 16px;">Time</div>
                  <div style="color: #374151; font-weight: 500;">${this.TIME}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 4px solid #06b6d4;">
                <span style="font-size: 24px; margin-right: 15px;">🏢</span>
                <div>
                  <div style="color: #0891b2; font-weight: 600; font-size: 16px;">Location</div>
                  <div style="color: #374151; font-weight: 500;">EMS Booth - Main Hall</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preparation Checklist -->
        <div style="padding: 40px 30px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
          <h4 style="color: #15803d; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center;">
            <span style="background: #22c55e; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">✅</span>
            Preparation Checklist
          </h4>
          <div style="background: rgba(255,255,255,0.6); padding: 25px; border-radius: 12px; border: 2px solid #22c55e;">
            <ul style="color: #166534; margin: 0; padding-left: 0; list-style: none;">
              <li style="margin-bottom: 15px; display: flex; align-items: center;">
                <span style="background: #22c55e; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">1</span>
                <strong>Have your tickets ready</strong> (digital or printed)
              </li>
              <li style="margin-bottom: 15px; display: flex; align-items: center;">
                <span style="background: #22c55e; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">2</span>
                <strong>Bring a valid photo ID</strong>
              </li>
              <li style="margin-bottom: 15px; display: flex; align-items: center;">
                <span style="background: #22c55e; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">3</span>
                <strong>Plan your transportation</strong> to Ta' Qali
              </li>
              <li style="display: flex; align-items: center;">
                <span style="background: #f59e0b; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">4</span>
                <strong>Arrive by 6pm</strong> for the best experience
              </li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 30px; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); text-align: center;">
          <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">
            See you tomorrow at the EMS event! 🎉
          </h3>
          <p style="color: #9ca3af; margin: 0; font-size: 16px; font-weight: 500;">
            © 2025 EMS Tickets. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
    `
  }
}
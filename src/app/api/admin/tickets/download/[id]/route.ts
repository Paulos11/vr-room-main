// FIXED: src/app/api/admin/tickets/download/[id]/route.ts - Production URL fix
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        registration: true,
        ticketType: true // ✅ Include ticket type for PDF generation
      }
    })
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    // ✅ FIXED: Create proper absolute URL for production
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || request.nextUrl.host
    const baseUrl = `${protocol}://${host}`
    
    // Create the download URL with the correct base URL
    const downloadUrl = new URL(`/api/tickets/download?registrationId=${ticket.registrationId}`, baseUrl)
    
    console.log('🔗 Redirecting to download URL:', downloadUrl.toString())
    
    return NextResponse.redirect(downloadUrl)
    
  } catch (error: any) {
    console.error('❌ Error downloading ticket:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to download ticket', error: error.message },
      { status: 500 }
    )
  }
}
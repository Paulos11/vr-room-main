import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// src/app/api/admin/tickets/download/[id]/route.ts - Admin ticket download
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        registration: true
      }
    })
    
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    // Redirect to the download API with registration ID
    const downloadUrl = `/api/tickets/download?registrationId=${ticket.registrationId}`
    return NextResponse.redirect(new URL(downloadUrl, request.url))
    
  } catch (error: any) {
    console.error('Error downloading ticket:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to download ticket', error: error.message },
      { status: 500 }
    )
  }
}
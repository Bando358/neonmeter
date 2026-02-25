import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf"
import prisma from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { invoiceId } = await params

  // Verify access
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { companyId: true, invoiceNumber: true },
  })

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (session.user.role === "COMPANY_ADMIN" && invoice.companyId !== session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const pdfBuffer = await generateInvoicePdf(invoiceId)

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate PDF"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

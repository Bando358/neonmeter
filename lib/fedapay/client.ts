import { FedaPay, Transaction } from "fedapay"

// Initialize FedaPay
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY || "")
FedaPay.setEnvironment(
  (process.env.FEDAPAY_ENVIRONMENT as "sandbox" | "live") || "sandbox"
)

export interface CreateFedaPayTransactionParams {
  amount: number // In currency units (e.g., 2000 for 2000 XOF)
  currency: string // ISO code, e.g., "XOF"
  description: string
  callbackUrl: string
  customerEmail: string
  customerName: string
  customerPhone: string
  customerCountry?: string
}

export async function createFedaPayTransaction(
  params: CreateFedaPayTransactionParams
) {
  const [firstname, ...lastParts] = params.customerName.split(" ")
  const lastname = lastParts.join(" ") || "-"

  const transaction = await Transaction.create({
    description: params.description,
    amount: params.amount,
    currency: { iso: params.currency },
    callback_url: params.callbackUrl,
    customer: {
      email: params.customerEmail,
      firstname,
      lastname,
      phone_number: {
        number: params.customerPhone,
        country: params.customerCountry || "bj",
      },
    },
  })

  // Generate payment token for redirect
  const token = await transaction.generateToken()

  return {
    transactionId: String(transaction.id),
    paymentUrl: token.url,
  }
}

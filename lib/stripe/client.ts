import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return _stripe
}

export async function createOrGetStripeCustomer(
  companyId: string,
  companyName: string,
  email?: string | null
): Promise<string> {
  const stripe = getStripe()
  const prisma = (await import("@/lib/prisma")).default
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { stripeCustomerId: true },
  })

  if (company?.stripeCustomerId) return company.stripeCustomerId

  const customer = await stripe.customers.create({
    name: companyName,
    email: email || undefined,
    metadata: { companyId },
  })

  await prisma.company.update({
    where: { id: companyId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

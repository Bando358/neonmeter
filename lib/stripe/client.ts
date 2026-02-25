import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

export async function createOrGetStripeCustomer(
  companyId: string,
  companyName: string,
  email?: string | null
): Promise<string> {
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

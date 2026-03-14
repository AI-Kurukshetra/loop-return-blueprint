import { prisma } from "@/lib/db";
import { sendEmailViaMcp, sendSmsViaMcp } from "@/lib/mcp-connectors";

export type ReturnLifecycleEvent =
  | "return_approved"
  | "label_created"
  | "refund_processed";

function buildMessage(eventType: ReturnLifecycleEvent, rmaNumber: string) {
  if (eventType === "return_approved") {
    return {
      subject: `Return approved: ${rmaNumber}`,
      text: `Your return ${rmaNumber} has been approved. We'll send shipping details shortly.`,
    };
  }

  if (eventType === "label_created") {
    return {
      subject: `Shipping label ready: ${rmaNumber}`,
      text: `Your return label for ${rmaNumber} is ready. Please ship your item back to us.`,
    };
  }

  return {
    subject: `Refund processed: ${rmaNumber}`,
    text: `Your refund for return ${rmaNumber} has been processed.`,
  };
}

type NotifyArgs = {
  merchantId: string;
  returnId: string;
  customerId: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  rmaNumber: string;
  eventType: ReturnLifecycleEvent;
};

export async function notifyReturnEvent(args: NotifyArgs) {
  const { subject, text } = buildMessage(args.eventType, args.rmaNumber);
  const jobs: Promise<unknown>[] = [];

  if (args.customerEmail) {
    jobs.push(
      (async () => {
        const result = await sendEmailViaMcp({
          to: args.customerEmail!,
          subject,
          html: `<p>${text}</p>`,
          text,
        });

        await prisma.communicationEvent.create({
          data: {
            merchantId: args.merchantId,
            returnId: args.returnId,
            customerId: args.customerId,
            channel: "email",
            eventType: args.eventType,
            recipient: args.customerEmail!,
            provider: result.provider,
            providerRef: result.providerRef,
            status: result.ok ? "sent" : "failed",
            payload: { subject, text },
            error: result.error,
          },
        });
      })()
    );
  }

  if (args.customerPhone) {
    jobs.push(
      (async () => {
        const result = await sendSmsViaMcp({
          to: args.customerPhone!,
          body: text,
        });

        await prisma.communicationEvent.create({
          data: {
            merchantId: args.merchantId,
            returnId: args.returnId,
            customerId: args.customerId,
            channel: "sms",
            eventType: args.eventType,
            recipient: args.customerPhone!,
            provider: result.provider,
            providerRef: result.providerRef,
            status: result.ok ? "sent" : "failed",
            payload: { text },
            error: result.error,
          },
        });
      })()
    );
  }

  await Promise.all(jobs);
}


import "dotenv/config";
import { transporter } from "./smtp.js";

async function main() {
  try {
    const result = await transporter.sendMail({
      from: {
        name: "ReachInbox",
        address: process.env.ETHEREAL_USER!,
      },
      to: "test@example.com",
      subject: "ReachInbox SMTP Test",
      text: "This is a test email from the ReachInbox scheduler.",
    });

    console.log("Email sent successfully!");
    console.log("Message ID:", result.messageId);
    console.log("Preview URL:", result.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
  } finally {
    await transporter.close();
  }
}

main();
